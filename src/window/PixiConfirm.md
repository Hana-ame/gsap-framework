# PixiConfirm

`createConfirm(opts) → PixiConfirm` — PIXI 对话框，构建在 `SubCanvas` 上。

PIXI 版本的高层对话框。对应 HTML 版本 [`Confirm`](./Confirm.md)。API 行为一致；区别在 PIXI 事件路由（PIXI 没有 `setPointerCapture`，子级 SubCanvas 也不会"自动 claim"PIXI children），所以 button 命中测试是手写在 `onPress` 里的。

## API

```ts
type PixiConfirmResult = 'ok' | 'cancel' | string;

interface PixiConfirmButton {
  label: string;
  onClick?: (confirm: PixiConfirm) => void;
  primary?: boolean;    // 主色高亮
  keepOpen?: boolean;   // 默认 false：点击后自动 destroy
}

interface PixiConfirmOptions {
  parent: SubCanvas;
  title: string;
  message: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  draggable?: boolean;          // 默认 true
  dragMode?: 'title' | 'anywhere';  // 默认 'title'
  closable?: boolean;           // 默认 true（X = cancel）
  onClose?: () => void;         // X 关闭前回调；不传则 destroy()
  okText?: string;              // 默认 'OK'，label === okText 时 onResult('ok')
  cancelText?: string;          // 默认 'Cancel'，label === cancelText 时 onResult('cancel')
  buttons?: PixiConfirmButton[]; // 不传 = [cancel, ok]；传空数组 = 只剩 X
  onResult?: (result: PixiConfirmResult, confirm: PixiConfirm) => void;
}

interface PixiConfirm extends SubCanvas {
  setTitle(title: string): void;
  setMessage(message: string): void;
  content: SubCanvas;          // 给高级用户加自定义 PIXI children
}
```

## 与 HTML Confirm 的对应

| 维度 | HTML `Confirm` | PIXI `PixiConfirm` |
|------|----------------|--------------------|
| 渲染 | React DOM | PIXI Container |
| 按钮拦 drag | `onPointerDown stopPropagation` | `onPress` 里手写 hit-test（按钮在 PIXI 层，不进 SubCanvas 路由） |
| Drag 实现 | `setPointerCapture` on title/root | 全局 `window` listener（出 bounds 也能继续 drag） |
| 关闭 | `onClose` 或内部 hide | `onClose` 或 `win.destroy()` |
| 默认按钮 | OK + Cancel | OK + Cancel（按 `okText`/`cancelText` label 匹配 → `'ok'`/`'cancel'`） |
| 多按钮 | 写自定义 Window 拼 | `buttons: PixiConfirmButton[]` 数组 |

## `dragMode` 在 PIXI 下的语义

- `'title'`：只有 y ≤ TITLE_BAR_H 的按压开 drag（行为同 `PixiWindow`）
- `'anywhere'`：整面按压都开 drag —— **但** button 区域优先（点击 button 调 `onClick`/`onResult` 不开 drag）

## 使用

### 基础
```ts
const c = createConfirm({
  parent: root,
  title: 'Delete item?',
  message: 'This cannot be undone.',
  width: 320,
  height: 160,
  dragMode: 'anywhere',
  onResult: (r, conf) => {
    if (r === 'ok') doDelete();
    conf.destroy();
  },
});
```

### 自定义按钮
```ts
createConfirm({
  parent: root,
  title: 'Pick color',
  message: 'Choose primary color.',
  width: 400,
  height: 160,
  dragMode: 'anywhere',
  buttons: [
    { label: 'Red',   onClick: () => setColor(0xff0000) },
    { label: 'Green', primary: true, onClick: () => setColor(0x00ff00) },
    { label: 'Blue',  onClick: () => setColor(0x0000ff) },
  ],
  onResult: (r) => console.log('result label =', r),
});
// 红/绿/蓝任一被点 → onClick 跑 → 弹窗自动 destroy
```

### 「Cancel 永远关」语义
每个按钮默认 `keepOpen: false` —— 点完调用 `onClick` + `onResult` 后自动 `destroy()`。Cancel 没 `onClick` 也照样关（对齐 HTML `Confirm`）。要保持打开（异步任务中等），传 `keepOpen: true`：
```ts
buttons: [
  { label: 'Cancel' },
  { label: 'Delete', keepOpen: true, onClick: (c) => {
    fetch('/api/delete', { method: 'POST' })
      .then(() => c.destroy())   // 异步完成手动关
      .catch((e) => showError(e));
  }},
]
```

### 只剩 X 关闭
```ts
createConfirm({
  parent: root,
  title: 'Read me',
  message: 'Click X to close.',
  width: 280,
  height: 120,
  dragMode: 'anywhere',
  buttons: [],
  onResult: (r) => console.log('closed via', r),  // r = 'cancel'（X 触发）
});
```

## 内部实现要点

- **按钮 hit-test 不走 SubCanvas 路由**：按钮是 PIXI 容器（Graphics + Text）add 到 `win.stage`，不是 `SubCanvas` child。`SubCanvas.handlePointer` 不会看到它们。所以 `onPress` 显式遍历 `buttonHits` 做 AABB 测试。
- **dragMode='anywhere' 时 button 拦 drag**：因为 hit-test 在 drag 判定之前，button 命中就直接 `return` 不会进 drag 流程。
- **drag 期间挂 window 全局 listener**（同 `PixiWindow` 的 1.6 修法）：PIXI 没有 `setPointerCapture`，鼠标移出窗口 bounds 后 SubCanvas 收不到事件，drag 就卡住。详见 `NOTES.md` 1.6。
- **message 自动 word-wrap**：用 `PIXI.TextStyle` 的 `wordWrap: true` + `wordWrapWidth = width - PADDING * 2`。
- **点击后自动 destroy（`keepOpen: false`）**：onClick / onResult 跑完，若 `!keepOpen` 就 `win.destroy()`。Cancel 按钮无 onClick 也能关，对齐 HTML `Confirm` 行为。X 关闭按钮不受 `keepOpen` 影响（X 永远关）。

## Scope

- ✅ Title + message + 自定义 buttons
- ✅ dragMode='title' | 'anywhere'
- ✅ X close (closable) = cancel result
- ✅ 按钮 hit-test（不触发 drag）
- ✅ onResult('ok' | 'cancel' | label)
- ❌ 自定义 message 区域（用户可加 PIXI children 到 `content`，但要小心 hit-test）
- ❌ 动态按钮 enable/disable / 进度条 / 多行 message 居中
- ❌ Animation in/out
- ❌ 主题系统
- ❌ 国际化
- ❌ a11y / 键盘焦点
