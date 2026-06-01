# Windowing Layer — NOTES

`src/window/` 下的所有东西（HTML `Window.tsx` + PIXI `PixiWindow.ts`）共同构成「window 化层」。这层是整个项目的**基础设施** —— 每个 display 都有可能用，外部二次开发的人会依赖。

**polish 原则**：API 表面稳、内部实现可换、踩过的坑不能重蹈。

---

## 1. 踩过的坑（按时间倒序）

### 1.7 Dialog 风格 Window 缺「anywhere drag」

**症状**：`Confirm`（对话框）最初用 `Window` + 默认 `draggable`。用户反馈：「我想拖对话框，只能拖那一条 title bar，看着不像对话框。」

**根因**：默认 `dragMode='title'` 适合信息型窗口（有 canvas/3D/表格），但对话框整面都该是 drag handle（除了按钮）。

**修法**（Window.tsx）：加 `dragMode: 'title' | 'anywhere'`：
- `'title'`（默认）：只有 title bar 触发 drag
- `'anywhere'`：root 整个 surface 触发 drag（按钮自己 `e.stopPropagation()`）

**事件流**（`anywhere` 模式）：
```
用户按 root
  └─ onPointerDownCapture → onFocus()           // root 永远响应 onFocus
  └─ onPointerDown (bubble) → setPointerCapture + dragRef.current = ...
        ↓
用户移到按钮上
  └─ button.onPointerDown → e.stopPropagation()  // bubble 在 button 处停
       → root.onPointerDown 不会跑（已经过了）
       → drag 不会开始
  └─ button.onClick → handler
        ↓
用户释放
  └─ onPointerUp on root → releasePointerCapture + dragRef.current = null
```

**关键 insight**：
- `onPointerDownCapture` 在 root 上负责 `onFocus`（先于 bubble 跑，stopPropagation 拦不住）
- `onPointerDown` 在 root 上负责 drag（bubble 阶段，按钮可以拦）
- 两套并存是因为 capture vs bubble 的传播顺序

**PIXI 版同步加**：见 `PixiWindow.ts` 的 `dragMode: 'title' | 'anywhere'`。PIXI 版当时以为有限制（`anywhere` 模式只在 `content` 是空 SubCanvas 时才"全表面"），后来发现其实是 SubCanvas.handlePointer 的隐性 bug（见 1.8）。

**教训**：
- 不同的「容器风格」需要不同的 drag 触发面，不要 hard-code 一个
- 一个 prop (`dragMode`) 暴露两种行为，简单胜过把 drag 抽到 hook 让父级拼
- HTML/PIXI 两版必须同步 API；PIXI 版有约束时要写进 doc 警告

---

### 1.8 SubCanvas.handlePointer 空 listener 也 claim → 按钮/drag 不响应

**症状**：`PixiConfirm` 按钮按了不触发 onClick，dragMode='anywhere' 的 Confirm 在 content 区域拖不动。HTML 版 `Window` 没事但 PIXI 版 `PixiWindow` 'anywhere' 模式同样有 bug。

**根因**：
- `SubCanvas.handlePointer` 旧逻辑：children 全部 `return false` 后，**无条件** fire own listeners + `return true`。
- `win.content` 是 `win` 的 SubCanvas child，没 listener 但仍然 claim 事件 → `win.onPress` 永远收不到事件。
- 结果：drag handler 不跑 + 按钮 hit-test（在 onPress 里手写的）不跑。

**修法**（`SubCanvas.ts`）：
```ts
// 旧
this.listeners.get(type)?.forEach((fn) => fn(sub));
return true;

// 新
const hasListeners = (this.listeners.get(type)?.size ?? 0) > 0;
if (!hasListeners) return false;  // 没有 listener → 不 claim，让 parent 有机会处理
this.listeners.get(type)!.forEach((fn) => fn(sub));
return true;
```

**为什么之前没人发现**：
- `#window` / `#multiple` / `#single` 这些 display 里，`content` 区域不要求 drag（默认 'title' 模式）+ 用户在 content 里加的 PIXI children 是 `addChild` 到 `content.stage`，不在 SubCanvas 树里。
- 所以"点了 content 没反应"在 title 模式下是符合预期的。
- 加上 `anywhere` 模式后，这个隐性 bug 才显形。

**验证矩阵**（修后）：

| 场景 | content 有 listener? | win 有 listener? | 结果 |
|------|----------------------|------------------|------|
| PixiWindow 拖 title | 否 | 是（drag） | ✓ drag |
| PixiWindow 点 content（title 模式） | 否 | 是 | ✓ win.onPress fire → 检查 e.y > TITLE_BAR_H → 忽略 |
| PixiWindow 点 content（anywhere 模式） | 否 | 是 | ✓ win.onPress fire → 拖 |
| PixiConfirm 点按钮 | 否 | 是（drag + button test） | ✓ content pass through → button hit-test 命中 → 触发 |
| PixiConfirm 点空 content（anywhere） | 否 | 是 | ✓ 拖 |
| 用户在 content.onPress 加 handler | 是 | 是 | ✓ content claim，win 不动（同 HTML 现状） |

**教训**：
- "Claim 事件"和"有 handler 处理事件"是两件事。空 container 不该 claim。
- SubCanvas 树形路由下，空节点的 `return true` 会被一路 pass up，但 root 上没 listener 就丢；`return false` 让有 listener 的祖先接管。两种语义选对的就近。
- 单元测试要补：drag-anywhere + button-not-drag 这种组合一定要有 regression test。

---



### 1.1 Z-Order 缺失：点击 B 响应 A

**症状**：两个 Window 重叠时，点上面那个窗口的可见部分，**下面**那个窗口的 handler 触发了。

**根因**：
- 默认 CSS 堆叠由 DOM 顺序决定（后插入的在上）
- 但点下面窗口**没被挡住**的可见部分，事件正常命中下面窗口 —— 视觉上分不清
- 没有「点谁谁浮顶」的机制

**修法**：
- 父级管 `focusedId` state，给每个 Window 传 `zIndex`（focused 的 zIndex 高）
- 所有 `pointerdown`（包括 content 区域）都触发 `onFocus` → 父级 bump focused → 重渲染
- 这是 `Window.tsx` 唯一强制建议的父级状态

**教训**：z-order 不是 Window 自己的事，是父级的事。Window 只暴露 `onFocus` + `zIndex` 这对 API，强制外部管理。

---

### 1.2 跨窗口 Click：用 bus 反而坏事

**症状**：原本设计 —— `canvasA.click → bus.emit('pick-color') → A.setColor + B.setColor`；`canvasB.click → bus.emit('rotate-a') → A.setRotation`。用户反馈「点 B 响应 A」其实是设计如此（点 B 确实会让 A 旋转），但用户期望「点谁谁响应」。

**根因**：bus 太通用，handler 写在了 useEffect 顶层，跨窗口语义混在一起。

**修法**：
- 每个 canvas 自己挂 `addEventListener('click', ...)`，只调自己 scene 的方法
- bus 保留（跨窗口 sync + 未来 backend 接入用），但 click 不走 bus
- 每个 Window 是独立 unit —— click 只影响自己的 children

**教训**：pub-sub 是好工具，但**默认每个子组件自己管自己的事件**，不要为了「演示同步」强行把 click 接到 bus。

---

### 1.3 Canvas 屏幕占比不对

**症状**：`renderer.setSize(W, H, false)` 之后，canvas 看起来只有 300×150（HTML 默认），不填满 host。

**根因**：
- `setSize(w, h, updateStyle)` 第三个参数默认 `true`
- `false` = 不动 CSS，只改 buffer（`canvas.width/height` 属性）
- canvas 是 replaced element，CSS 不设就是 300×150 默认

**修法**（在 `three-euler` / `camera-euler` / 任何自己 new WebGLRenderer 的 display）：
```ts
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(W, H, false);
const canvas = renderer.domElement;
canvas.style.display = 'block';
canvas.style.width = '100%';
canvas.style.height = '100%';
host.appendChild(canvas);
```

**或者**用 `setSize(W, H)`（true，默认）让 canvas CSS 跟 host 一样大。两种都行，但**必须**显式设 CSS，不然就是 300×150。

**教训**：three.js 的 `setSize` 第三个参数容易踩。`Window.tsx` 里的子 canvas 通过 React style prop 传 `{width:'100%', height:'100%'}` 解决；自己 new WebGLRenderer 时必须手动 set。

---

### 1.4 文件名冲突：Window.ts vs Window.tsx

**症状**：想把 HTML 版本放到 `src/ui/Window.tsx`，但 PIXI 版本已经在 `src/ui/Window.ts`。两个文件同名不同扩展名，TypeScript 解析冲突。

**修法**：
- PIXI 版本重命名 `src/ui/Window.ts` → `src/ui/PixiWindow.ts`
- HTML 版本放 `src/ui/Window.tsx`
- 后来整个 window 化层挪到 `src/window/`：`src/window/Window.tsx` + `src/window/PixiWindow.ts`

**教训**：
- 同目录下不能有两个文件 `Window.ts` 和 `Window.tsx`（TS module resolution 会冲突）
- 命名要分语义（HTML/PIXI/GL/native/...），不要靠扩展名区分

---

### 1.5 Pointer Capture 必须 release

**症状**：drag 中浏览器切到后台 / 切窗口，回来后 drag 状态卡死（pos 不再更新）。

**根因**：
- `setPointerCapture(id)` 后所有 pointer 事件走那个元素
- 但 cancel / 切窗口 / pointer 离开时不会自动 release
- 下次 drag 时 `dragRef.current` 还是旧的

**修法**：
- `onPointerUp` + `onPointerCancel` 都要 release
- `try/catch` 包 release（已经 release 过的会 throw）
- React StrictMode 双 mount 也要清干净

```ts
const handleTitleUp = (e: ReactPointerEvent<HTMLDivElement>) => {
  dragRef.current = null;
  try {
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  } catch { /* already released */ }
};
```

**教训**：任何 `setPointerCapture` 都必须有对应的 `releasePointerCapture` 在 up/cancel 路径。

---

### 1.6 PIXI Window drag 鼠标快了卡住

**症状**：`#window` 拖窗口，鼠标快速移动 → 窗口停下不跟手 → 后续点击"卡住"（不响应）。

**根因**（PIXI 没 `setPointerCapture`）：
- `SubCanvas.handlePointer` 用 **bounds 命中测试**：`if (gx < gb.x || gx > gb.x + gb.width) return false;`
- 鼠标移出 title bar 区域 → `handlePointer` 返回 false → 事件不派发到这个 SubCanvas
- `onMove` 收不到事件 → window 不动
- 鼠标移出整个 window → `onRelease` 也收不到 → `dragging` 永远 `true` → 后续 `onPress` 进入 if 分支但 `dragging` 还是上次的 `true` → 行为错乱

**为什么是 PIXI 一个 canvas**：是的，确实一个 canvas（`startPixiApp` 一个 `PIXI.Application`）。所有 GameWindow 是这个 canvas 上的 SubCanvas 子区域。**不是**多 canvas 互打架。

**修法**（`PixiWindow.ts`）：drag 期间挂 `window` 上的全局 `pointermove` / `pointerup` / `pointercancel`：

```ts
const cleanupGlobal = () => {
  window.removeEventListener('pointermove', onGlobalMove);
  window.removeEventListener('pointerup', onGlobalUp);
  window.removeEventListener('pointercancel', onGlobalUp);
};

win.onPress((e) => {
  cleanupGlobal();  // 防 stale listeners
  // ... 启动 drag ...
  onGlobalMove = (ev) => { /* update win.setPosition */ };
  onGlobalUp = () => endDrag();
  window.addEventListener('pointermove', onGlobalMove);
  window.addEventListener('pointerup', onGlobalUp);
  window.addEventListener('pointercancel', onGlobalUp);
});
win.onRelease(() => endDrag());

// wrap destroy 防 listener 泄漏
const origDestroy = win.destroy.bind(win);
win.destroy = () => { cleanupGlobal(); origDestroy(); };
```

**教训**：
- PIXI 的 event system 是「hit-test based」，没有 DOM 的 `setPointerCapture`
- 任何 drag 跨区域（出 bounds）的需求，要自己挂全局 `window` 监听
- `pointercancel` 必加（alt-tab / OS 弹窗 / iframe 切换会触发）
- 每次 `onPress` 开头 `cleanupGlobal()` —— 防止前一次 drag 没正常结束（pointerup 丢失）导致 listener 累积

---

## 2. 设计决策（不要随便改）

### 2.1 父级管 z-index，不用 Context

| 方案 | 优点 | 缺点 |
|------|------|------|
| Context (WindowManager) | 自动，Window 内部决定 | 隐式依赖，DevTools 看不到，调试难 |
| 父级 state + prop | 显式，DevTools 可见，外部可控 | 父级要写几行 useState |

**结论**：用父级 state。Window 只暴露 `onFocus` + `zIndex` prop。Z-order 策略是父级的事，Window 不知道也不该知道。

### 2.2 Children 自己挂 click 监听

Window 不假设 children 是什么：
- canvas（自己挂 `addEventListener`）
- div / text
- iframe / video
- React 组件（自带 onClick）

Window 提供的只是**容器**和**事件路由之外的事**（drag / focus / close）。Click 决策权在 children 自己的代码里。

**例外**：未来做 modal window 时（要 focus trap、Escape 关掉等），可能要在 Window 内部加 onClick 转发。

### 2.3 PIXI Window vs HTML Window

| 维度 | PIXI (`PixiWindow.ts`) | HTML (`Window.tsx`) |
|------|------------------------|---------------------|
| 渲染 | PIXI 容器（SubCanvas 子区域） | React 组件（HTML 元素） |
| 性能 | 大场景 GPU 加速 | 一般 DOM |
| 字体 / 滚动条 / a11y | 麻烦 | 原生 |
| 嵌入 3D canvas | 要 shared context 或 overlay | 简单（children 直接放 `<canvas>`） |
| Touch / IME / 剪贴板 | 复杂 | 原生 |

**建议**：
- 游戏内 UI 面板（血条、背包格子、tooltip）→ **PIXI**（`PixiWindow`）
- HUD、设置、聊天、文档 → **HTML**（`Window.tsx`）
- 一个 display 可以混用：PIXI 渲染游戏场景 + HTML window 做 UI

### 2.4 Position state 在 Window 内部 vs 父级

| 方案 | 优点 | 缺点 |
|------|------|------|
| 内部 useState | 简单，父级不用管 | 外部读不到位置（除非 onPositionChange） |
| 父级管 | 持久化、reset、undo 容易 | 父级代码啰嗦 |

**结论**：默认内部，暴露 `onPositionChange` 钩子。父级要存就存，不要不存。

---

## 3. Polish Checklist

- [x] API 版本号 (`WINDOW_API_VERSION = '0.1.0'`)
- [x] Stable ID via `useId`（不是模块级计数器）
- [x] 受控 / 非受控 `visible`
- [x] `onPositionChange` 钩子
- [x] `onPointerCancel` 释放 capture
- [x] `data-window-version` DOM attribute
- [x] a11y: `aria-label="close"` on close button
- [x] `dragMode: 'title' | 'anywhere'`（HTML + PIXI 同步）
- [x] `data-window-drag-mode` DOM attribute
- [ ] Resize support (`resizable` prop + handle)
- [ ] Keyboard: Escape to close, Tab order
- [ ] Animation on open / close
- [ ] `useImperativeHandle` (`.focus()` / `.close()`)
- [ ] `role="dialog"` / `aria-modal` (for modal mode)
- [ ] Bounds clamp (prevent drag off-screen)
- [ ] Snap to edges
- [ ] Theme system (replace inline styles)
- [ ] CSS class instead of inline style
- [ ] 单元测试：drag math, z-order, focus events

---

## 4. 破坏性变更要做的检查

改 `Window.tsx` 之前：

1. **看所有 import**：`grep -r "from.*window/Window" src/`
2. **看所有用 prop 的代码**：每个 prop 都是公开 API，加/改/删 prop 是 breaking change
3. **bump `WINDOW_API_VERSION`**：DOM 上的 `data-window-version` 让外部能 check
4. **CHANGELOG**：记一笔
5. **不要改 inline style 字段名**：`background` / `border` / `boxShadow` 等虽然在 `style` 里合并，但**字段名**是隐式 API（外部可能 override `style` prop）

---

## 5. 怎么写新的 Window 化组件

如果以后要加（比如 modal、tooltip、context menu）：

1. **复用 Window 的 drag / focus / z-order 模式**，不要重新发明
2. **新文件放 `src/window/`**，不要散到 `src/ui/`
3. **同目录下写 `.md`**，包括 call stack + API + scope + 注意事项
4. **如果跟 Window 共享逻辑**，抽到 `src/window/internal/` 或共用 helper（现在还没到这步）
5. **加新 prop 是 breaking**，先 bump version 再说

---

## 6. 相关文件

- `src/window/Window.tsx` — HTML Window（React 组件）
- `src/window/Window.md` — HTML Window API 文档
- `src/window/PixiWindow.ts` — PIXI Window（createWindow + GameWindow extends SubCanvas）
- `src/window/PixiWindow.md` — PIXI Window API 文档
- `src/window/Confirm.tsx` — HTML 高层对话框（基于 `Window` + `dragMode="anywhere"`）
- `src/window/Confirm.md` — Confirm API + 设计说明
- `src/window/PixiConfirm.ts` — PIXI 高层对话框（基于 `SubCanvas` + `dragMode="anywhere"` + 手写 button hit-test）
- `src/window/PixiConfirm.md` — PixiConfirm API + 实现说明
- `src/html-displays/confirm/ConfirmDisplay.tsx` — `#confirm` 路由 demo（HTML Confirm 实例）
- `src/displays/pixi-confirm/PixiConfirmDisplay.tsx` — `#pixi-confirm` 路由 demo（PIXI Confirm 实例）
- `src/three-displays/two-3d/Two3DDisplay.tsx` — 两个 3D window 的 display，演示 z-order + per-window click
- `src/displays/window/WindowDisplay.tsx` — 用了 PIXI createWindow 的 display
- `src/pixi/SubCanvas.ts` — PIXI Window 的底层，drag / event routing / bounds 都在这
