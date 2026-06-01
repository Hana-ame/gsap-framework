# ui/Window — `createWindow`

带标题栏 + 关闭按钮 + 可拖动的"窗口"。基于 `SubCanvas`，内部把窗口分成两块：标题栏（拖动区）和 `content`（用户塞东西的子区域）。

---

## 调用栈

### 创建
```
createWindow({ parent, title, width, height, x?, y?, draggable?, closable?, onClose? })
  ├─ parent.createSubRegion({ x, y, width, height })   // 窗口本体
  ├─ bg (背景 Graphics)        addChildAt(0)
  ├─ bar (标题栏 Graphics)     addChild
  ├─ title (标题 Text)        addChild
  ├─ closeBtn + xMark          addChild (if closable)
  ├─ content = win.createSubRegion({ y: TITLE_BAR_H, ... })   // 内容区
  └─ 注册 onPress / onMove / onRelease（拖动 + 关闭）
```

### 拖动
```
鼠标按在标题栏
  └─ win.onPress(e)
       ├─ 点击在关闭按钮范围？→ opts.onClose?.() 或 win.destroy()
       ├─ 点击 y > TITLE_BAR_H？→ return（点的是内容区）
       └─ 拖动开始:
            dragging = true
            sx = e.globalX, sy = e.globalY
            ox = win.bounds.x, oy = win.bounds.y
            win.bringToFront()                 // 置顶
       win.onMove(e)
       └─ if (dragging):
            nx = ox + (e.globalX - sx)
            ny = oy + (e.globalY - sy)
            // 限制在 parent.bounds 内
            nx = clamp(nx, 0, parent.w - win.w)
            ny = clamp(ny, 0, parent.h - win.h)
            win.setPosition(nx, ny)            // 位置变化，不触发 onResize
       win.onRelease()
       └─ dragging = false
```

**为什么用 `setPosition` 不用 `setBounds`**：拖动期间 bounds 大小不变，只改 x/y；用 setPosition 不触发 onResize 回调（避免子级重布局）；用 setBounds 会无意义地通知"resize"。

### 关闭
```
点击关闭按钮（红圆 + 白叉）
  └─ win.onPress(e)
       └─ 距离 closeBtn 中心 ≤ (CLOSE_BTN_R + 2)？
            └─ opts.onClose?.() 否则 win.destroy()
```
**注意**：关闭是同步的 — `win.destroy()` 后所有引用该 window 的代码下次访问会 throw（_destroyed 守卫生效）。

### 事件路由（嵌套的妙处）
```
用户点击 content 子区
  └─ proxy.routePointer → win.handlePointer
       └─ 递归 content.handlePointer
            └─ content 命中 → content 的 listeners 触发
                 → return true（冒泡停止）
       → win.onPress 不触发 → 不会误触拖动
```
**关键**：content 是 win 的 child。点击 content 时 win.onPress **不**触发（child 优先），所以拖动只在标题栏触发。

### z-order（点击置顶）
```
任何点击触发 → bringToFront()
  ├─ dragging 开始时
  └─ （如果有别的带 setDraggable 的窗口，setDraggable 内部已调用）
```
`bringToFront` = `parent.setChildIndex(this.stage, parent.children.length - 1)` — PIXI 渲染顺序：后画的在上层。

### 销毁
```
win.destroy()
  ├─ 递归 destroy 所有 children（content + content 的 children）
  ├─ 摘除 stage from parent.stage
  ├─ destroy stage
  ├─ listeners.clear()
  └─ onDestroy 回调 → parent.children.splice
```
**GameWindow 没有 `bus`**：跨窗口通信走 `proxy.bus`；窗口内部事件用 SubCanvas 的 onPress/onMove 等。

---

## API

```ts
interface GameWindowOptions {
  parent: SubCanvas;          // 父级（一般是 root 或某个 layout 区域）
  title: string;              // 标题栏文字
  width: number;
  height: number;
  x?: number;                 // 默认 60
  y?: number;                 // 默认 60
  draggable?: boolean;        // 默认 true
  closable?: boolean;         // 默认 true
  onClose?: () => void;       // 默认 win.destroy()
}

interface GameWindow extends SubCanvas {
  setTitle(title: string): void;     // 改标题
  content: SubCanvas;                // 内容子区（用户 addChild 到 content.stage）
}

function createWindow(opts: GameWindowOptions): GameWindow
```

### GameWindow vs SubCanvas
- GameWindow **是** SubCanvas（extends + 类型断言）
- 多出 `setTitle` 和 `content`
- 所有 SubCanvas 方法（onPress/onMove/setBounds/setPosition/bringToFront/destroy 等）都可用

---

## 使用

### 基础
```ts
const win = createWindow({
  parent: root,
  title: 'Inventory',
  width: 280,
  height: 200,
});

const item = new PIXI.Graphics().rect(8, 8, 32, 32).fill(0xff8800);
win.content.stage.addChild(item);
```

### 自定义关闭行为
```ts
const win = createWindow({
  parent: root,
  title: 'Settings',
  width: 320,
  height: 240,
  onClose: () => {
    saveSettings();
    win.destroy();
  },
});
```

### 不可拖动 / 不可关闭
```ts
const hud = createWindow({
  parent: root,
  title: 'HP',
  width: 120,
  height: 30,
  draggable: false,
  closable: false,
  x: 10, y: 10,
});
```

### 改标题（运行时）
```ts
win.setTitle(`HP: ${player.hp}/${player.maxHp}`);
```

### 销毁
```ts
win.destroy();   // GameWindow 是 SubCanvas，调 destroy
```

### 通过 proxy.bus 与其他窗口通信
```ts
// Inventory
const off = proxy.bus.on<{ id: number }>('inventory:item-picked', ({ id }) => {
  addToInventory(id);
});

// HUD
proxy.bus.emit('inventory:item-picked', { id: 42 });
```

---

## 应用范围（游戏 UI）

适合：
- **浮动面板**（背包 / 角色面板 / 任务 / 队伍 / 聊天）
- **设置窗口**（带关闭回调保存设置）
- **迷你窗口**（HP / 蓝条 / 小地图 — 用 `closable: false, draggable: false`）
- **工具提示 / 浮动提示**
- **模态对话框**（onClose 触发事件让其他窗口 disabled）

不适合：
- **全屏场景切换**（菜单 ↔ 游戏）— 用路由（#single / #multiple / #window）
- **需要最大化/最小化**（目前只有 close；要加就扩展 createWindow options）
- **多 tab 窗口**（没有 tab UI；要就再加 ui/Tabs.ts）
- **跨 parent 拖动**（拖出 parent.bounds 被 clamp；如果要跨 root 拖，要先改 setDraggable 的 constraint）
- **resize 边框**（没有 resize handle；固定大小或外部调 setBounds）

---

## 注意事项

1. **GameWindow 的子级 = content** — 用户在 `win.content.stage.addChild(...)` 加东西，**不要**直接加到 `win.stage`（会和标题栏混）。
2. **拖动区域 = 标题栏 + 关闭按钮** — content 区域不响应拖动；点击 content 会触发 content 的 onPress（如果有），不会拖动。
3. **关闭按钮是 hit-area 判定，不是 PIXI event** — 用 `onPress` 算 (e.x, e.y) 到按钮中心距离；PIXI 的 eventMode 在 Graphics 上不稳定（v8），所以走 SubCanvas 事件。
4. **拖动用 setPosition 不触发 onResize** — 子级 content 不会因拖动而重布局；如果你的 content 用了 onResize 重画，确保画的内容是相对 (0,0) 而不是居中。
5. **没有最小化/最大化 API** — 只暴露 destroy；要加就改 createWindow 加 `onMinimize?: () => void` 之类。
6. **关闭是同步的** — `win.destroy()` 后代码再访问 `win.content` 会拿到已 destroy 的对象；用 `_destroyed` 守一下或自己加 ref。
7. **没有 z-index 持久化** — 拖动后置顶，刷新页面就回到初始顺序；要做"窗口列表"用 bus 通知。
8. **背景 95% 不透明（alpha 0.95）** — 留 5% 透出去的游戏画面；觉得太死板就改 alpha。
9. **clamp 到 parent.bounds** — 拖出父级窗口会被弹回；要做跨 parent 拖（比如从 inventory 拖到 chat），需要 setDraggable 的 constraint 用整个 root.bounds。
10. **未来后台集成**：窗口状态（位置/大小/最小化）可以 `bus.on('window:state', saveState)` + localStorage / 远端持久化。
