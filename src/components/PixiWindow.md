# ui/Window — `createWindow`

带标题栏 + 关闭按钮 + 可拖动的"窗口"。基于 `SubCanvas`，内部把窗口分成两块：标题栏（拖动区）和 `content`（用户塞东西的子区域）。

---

## 调用栈

### 创建
```
createWindow({ parent, title, width, height, x?, y?, draggable?, closable?, onClose? })
  ├─ 解析 dragMode: draggable? → (dragMode ?? 'title') : 'none'
  ├─ parent.createRegion({ x, y, width, height },
  │     { dragMode, dragBounds })       // 窗口本体，拖动由 SubCanvas 接管
  ├─ bg (背景 Graphics)        win.stage.addChildAt(0)
  ├─ bar (标题栏 Graphics)     win.addChild(bar)    // → SubCanvas.addChild 自动安装 drag handle
  │    bar.label = 'subcanvas-drag-handle'
  │    bar.cursor = dragMode === 'none' ? 'default' : 'move'
  ├─ title (标题 Text)        win.stage.addChild(titleText)
  ├─ closeBtn (Container)     win.stage.addChild(closeBtn)   // PIXI pointerdown + stopPropagation
  └─ content = win.createRegion({ y: TITLE_BAR_H, ... },
       { clipToBounds: true })          // 内容区，带裁切
```

### 拖动
```
鼠标按在标题栏（bar）
  └─ SubCanvas._installDragOnHandle(bar)
       ├─ bar.on('pointerdown', onDown)          // PIXI FederatedEvent
       │    ├─ e.stopPropagation()
       │    ├─ 记录 startLocal (getLocalPosition(parent.stage))
       │    ├─ 记录 startBoundsX/Y
       │    ├─ 挂 window.addEventListener('pointermove', onWindowMove)
       │    ├─ 挂 window.addEventListener('pointerup', onWindowUp)
       │    └─ win.bringToFront()                 // 置顶
       ├─ root.on('pointermove', onPxiMove)       // 备用 PIXI 级
       └─ root.on('pointerup', onPxiUp)
任意指针移动
  ├─ window.onWindowMove(e)                       // DOM 级，无条件
  │    └─ applyDrag(clientX, clientY)
  │         ├─ delta = client - startLocal
  │         ├─ nx = startBoundsX + delta.x, ny = startBoundsY + delta.y
  │         ├─ clamp 到 dragBounds (parent.bounds)
  │         └─ win.setPosition(nx, ny)            // 不触发 onResize
  └─ root.onPxiMove(e)                            // PIXI 级
       └─ applyDrag(getLocalPosition(parent.stage))
指针松开
  └─ window.onWindowUp() / root.onPxiUp()
       ├─ 清除 drag state
       ├─ removeEventListener('pointermove/up/cancel')
       └─ handlers.onEnd?.()
```

**为什么用 window.addEventListener fallback**：PIXI FederatedEvent 在鼠标快速移出 canvas 或跳过无交互目标区域时会丢失 move 事件。DOM 级事件永远触发。两层保证不丢帧。

### 关闭
```
点击关闭按钮（红圆 + 白叉 Container）
  └─ closeBtn.on('pointerdown', (e) => {
       e.stopPropagation();                       // 阻止冒泡到 bar/win
       if (opts.onClose) opts.onClose();
       else win.destroy();
     })
```
**注意**：关闭是同步的 — `win.destroy()` 后所有引用该 window 的代码下次访问会 throw（_destroyed 守卫生效）。
**按钮不经过 SubCanvas 路由**：关闭按钮使用 PIXI 原生 `pointerdown` + `hitArea`（Rectangle），不是 SubCanvas 的 AABB onPress 检测。

### 事件路由（嵌套的妙处）
```
用户点击 content 子区
  └─ proxy.routePointer → win.handlePointer
       └─ 递归 content.handlePointer
            └─ content 命中 → content 的 listeners 触发
                 → return true（冒泡停止）
       → win.onPress 不触发 → 不会误触拖动
```
**关键**：content 是 win 的 child SubCanvas。点击 content 时 win.onPress **不**触发（child 优先），所以拖动只在标题栏触发。

### z-order（点击置顶）
```
任何点击触发 → bringToFront()
  └─ SubCanvas.bringToFront()
       ├─ parent.sortableChildren = true
       ├─ 扫描 sibling zIndex 找到最大值
       ├─ this.stage.zIndex = max + 1
       └─ 同步 parent._subRegions 数组顺序
```
`bringToFront` 使用 zIndex 排序，不是 `setChildIndex`。渲染顺序 = 命中顺序。

### 销毁
```
win.destroy()
  ├─ 停用所有 drag handle 监听
  ├─ 递归 destroy 所有 children（content + content 的 children）
  ├─ 摘除 stage from parent.stage
  ├─ stage.destroy({ children: true })
  ├─ listeners.clear()
  └─ onDestroy 回调 → parent._subRegions.splice
```
**GameWindow 没有 `bus`**：跨窗口通信走 `proxy.bus`；窗口内部事件用 SubCanvas 的 onPress/onMove 等。

---

## API

```ts
type PixiDragMode = SubDragMode;   // 'title' | 'anywhere' | 'none'
```

### `dragMode`

| 值 | 行为 | 适用 |
| --- | --- | --- |
| `'title'` (default) | 只有标题栏（label='subcanvas-drag-handle'）的按压才开 drag | 信息型窗口、里面有交互式 content |
| `'anywhere'` | 整个 window 区域按压都开 drag（SubCanvas 自动加透明 bg handle） | 对话框、纯展示面板 |
| `'none'` | 完全不可拖动，cursor='default' | HUD、固定位置面板 |

注意：PIXI 模式下 `anywhere` 模式有一个限制 — `content` 是 SubCanvas child，按 AABB 事件路由，**点击 content 会优先命中 content 的 listeners，不触发 win.onPress**。所以 `anywhere` 拖动依赖 SubCanvas 内置 drag（PIXI FederatedEvent on handle），不依赖 onPress。拖动由 `_installDragOnHandle` 在 transparent bg handle 上安装，所以 content 的 SubCanvas 路由不影响拖动。

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
2. **拖动区域 = 标题栏（bar）** — content 区域不响应拖动；点击 content 会触发 content 的 onPress（如果有），不会拖动。
3. **关闭按钮是 PIXI pointerdown + stopPropagation** — 用 `Container` + `eventMode='static'` + `hitArea = Rectangle` + 自己的 `pointerdown` handler（内调 `stopPropagation`）。不是 SubCanvas onPress AABB 检测（PIXI v8 的 Graphics hitArea 不稳定，Container + Rectangle 是稳定方案）。
4. **拖动用 setPosition 不触发 onResize** — 子级 content 不会因拖动而重布局；如果你的 content 用了 onResize 重画，确保画的内容是相对 (0,0) 而不是居中。
5. **没有最小化/最大化 API** — 只暴露 destroy；要加就改 createWindow 加 `onMinimize?: () => void` 之类。
6. **关闭是同步的** — `win.destroy()` 后代码再访问 `win.content` 会拿到已 destroy 的对象；用 `_destroyed` 守一下或自己加 ref。
7. **没有 z-index 持久化** — 拖动后置顶，刷新页面就回到初始顺序；要做"窗口列表"用 bus 通知。
8. **背景 95% 不透明（alpha 0.95）** — 留 5% 透出去的游戏画面；觉得太死板就改 alpha。
9. **clamp 到 parent.bounds** — 拖出父级窗口会被弹回；要做跨 parent 拖（比如从 inventory 拖到 chat），需要 setDraggable 的 constraint 用整个 root.bounds。
10. **未来后台集成**：窗口状态（位置/大小/最小化）可以 `bus.on('window:state', saveState)` + localStorage / 远端持久化。
