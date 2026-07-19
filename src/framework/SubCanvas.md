# SubCanvas

子画布 — 共享一个 `PIXI.Application`，但拥有独立的 `bounds` / 事件路由 / 生命周期。看上去像 `PIXI.Application`，但实际只是主 stage 里的一个 `Container`（位置由 `bounds` 决定）。

---

## 调用栈

### 创建
```
SubCanvasProxy.createRegion(bounds)
  └─ new SubCanvas({ rootApp, bounds, parent: null, onDestroy })
       ├─ new PIXI.Container()                     // this.stage
       ├─ stage.position.set(bounds.x, bounds.y)
       └─ rootApp.stage.addChild(stage)            // 顶层 canvas 挂到主 stage

root.createRegion(bounds)
  └─ new SubCanvas({ rootApp, bounds, parent: this, onDestroy })
       ├─ new PIXI.Container()
       ├─ stage.position.set(bounds.x, bounds.y)
       └─ this.stage.addChild(sub.stage)           // 嵌套 canvas 挂到父 stage
```

### 销毁
```
SubCanvas.destroy()
  ├─ 递归 destroy() 所有 children
  ├─ this.stage.parent.removeChild(this.stage)
  ├─ this.stage.destroy({ children: true })
  ├─ listeners.clear() / resizeListeners 清空
  └─ onDestroy()                                    // 从 parent.children 摘除
```

### 事件路由（pointerdown / move / up / leave）
```
window.addEventListener('pointerX', handler)        // PixiApp 统一监听
  └─ proxy.routePointer(type, e)
       └─ 顶层 topCanvas.handlePointer(type, e)
            ├─ 命中检测：e.clientX/Y 在 globalBounds 内？
            ├─ 子节点优先：递归 children.handlePointer(...) → 命中则 return true
            └─ 自己处理：派发到 this.listeners.get(type)，所有 callback 收到 SubPointerEvent
```
**关键**：先递归子节点；只有子节点都没匹配时，本层才触发自己的监听器；命中后立刻 return，子层之上不再触发（事件冒泡顺序：叶子 → 根）。

### 布局（resize）
```
window.addEventListener('resize', userLayout)       // 通过 proxy.onWindowResize 注册
  └─ userLayout(W, H)                              // 用户写的 layout 函数
       ├─ root.setBounds({ x:0, y:0, width:W, height:H })
       │    ├─ this._bounds = bounds
       │    ├─ this.stage.position.set(x, y)
       │    └─ resizeListeners.forEach(fn)          // 各子 canvas 的 onResize 回调
       └─ quadrants.forEach(q => q.setBounds(...))  // 重算每个子 canvas
```
子 canvas 的 `globalBounds` 是 **惰性 getter**（不存储），每次访问都从父级递归算出 — 所以父级 setBounds 后，子级的 globalBounds 自动正确，**无需级联通知**。

---

## API

### 构造
```ts
new SubCanvas({
  rootApp: PIXI.Application,
  bounds:  Rect,
  parent?: SubCanvas | null,
  onDestroy?: () => void,
})
```
不要直接 `new SubCanvas` — 必须通过 `SubCanvasProxy.createRegion` 或 `SubCanvas.createRegion` 创建。

构造后 `this.stage.eventMode` 自动设为 `'static'`（非 `'none'`），确保 PIXI 事件系统能穿透 stage 到达子对象（按钮、drag handle 等）。

### 只读属性
| 属性 | 类型 | 说明 |
|---|---|---|
| `stage` | `PIXI.Container` | 这个子画布的容器（在主 stage 或父 stage 里） |
| `bounds` | `Rect` | **本地的 AABB**（x, y 相对父级）— SubCanvas 自己的 source of truth |
| `globalBounds` | `Rect` | 全局 AABB（递归父级），惰性 getter |
| `parent` | `SubCanvas \| null` | 父级（顶层为 null） |
| `rootApp` | `PIXI.Application` | 主 PIXI 应用 |
| `ticker` | `PIXI.Ticker` | → `rootApp.ticker` |
| `renderer` | `PIXI.Renderer` | → `rootApp.renderer`（v8.18 类型，不是 `IRenderer`） |
| `canvas` | `HTMLCanvasElement` | → `rootApp.canvas` |
| `destroyed` | `boolean` | 已 destroy 标志 |

### PIXI 兼容代理（顶层 API 无感知）
所有这些都代理到内部 `stage`，写时跟 PIXI Container 完全一样：

**变换属性**
- `position: ObservablePoint`
- `scale: ObservablePoint`、`pivot: ObservablePoint`
- `rotation: number`、`angle: number`
- `alpha: number`、`visible: boolean`、`tint: number`
- `x: number`、`y: number`
- `eventMode: PIXI.EventMode`
- `label: string`

**Children**
- `addChild<T>(c: T): T` — 自动安装 drag handle 监听（label='subcanvas-drag-handle'）
- `removeChild<T>(c: T): T` — 自动清理 drag handle 监听
- `removeChildren(): Container[]`
- `getChildAt(i): Container`、`getChildByLabel(label)`
- `children: readonly Container[]`（注意：返回 `stage` 的 PIXI children；SubCanvas 子区域用 `subRegions`）

**销毁**
- `destroy(options?: { children?, texture? })` — 幂等，清理所有 drag handle + 递归子 SubCanvas + stage.destroy

### 子区域管理
```ts
createRegion(bounds: Rect, opts?): SubCanvas    // 直接创建子区域（opts 见下方）
subRegions: readonly SubCanvas[]                   // 子区域只读数组
getChildren(): SubCanvas[]                         // 同 subRegions，返回浅拷贝
```

### 事件
```ts
onPress(fn)   / onMove(fn)   / onRelease(fn)   / onLeave(fn)   / onTap(fn)   // 链式，返回 this
offPointer(type, fn)                                                       // 移除单个监听器
```
回调签名：
```ts
(e: SubPointerEvent) => void
// SubPointerEvent = { type, x, y, globalX, globalY, originalEvent }
// type ∈ 'pointerdown' | 'pointermove' | 'pointerup' | 'pointerleave' | 'tap'
```
`x/y` 是 **本地坐标**（相对此 SubCanvas 的 stage）；`globalX/globalY` 是 viewport 坐标（同 `e.clientX/Y`）。

**`onTap` vs `onRelease`**：`onTap` 只在 `pointerdown` 到 `pointerup` 之间位移 < `tapThreshold`（默认 4px）时触发。`onRelease` 每次 pointerup 都触发。点击/拖动分流场景用 `onPress` + `onMove` 处理拖动，用 `onTap` 处理点击（避免自己写阈值判断）。`tapThreshold` 可在构造选项中改。

**注意**：这些事件通过 SubCanvas `handlePointer` AABB 路由分发，不是 PIXI FederatedEvent。点击按钮等 PIXI 子对象不会触发 SubCanvas 的 `onPress`（它们走 PIXI 事件系统）。只有 `eventMode='static'` + `hitArea` 明确设置的 PIXI children 需要自己挂 `pointerdown`。

### 布局
```ts
onResize(fn: (bounds: Rect) => void): this        // 注册布局回调（只在 size 变化时需要）
setBounds(bounds: Rect): void                     // 更新 _bounds + stage.position + 触发 onResize
setPosition(x: number, y: number): void           // 只改位置，不触发 onResize（拖动用）
setSize(width: number, height: number): void      // 只改大小，触发 onResize
```
**`bounds` 是只读的**（getter，背后是 `_bounds`）。外部代码不能 `sc.bounds = ...`，必须用 `setBounds / setPosition / setSize`。

**拖动场景**：用 `setPosition(x, y)` 而不是 `setBounds` — 避免拖动期间无意义地触发 `onResize`，子级 content 不会因位置变化而重布局。

### z-order
```ts
bringToFront(): void                              // 移到 parent.stage.children 末尾（最上层）
sendToBack(): void                                // 移到 0 位（最下层）
```
**渲染顺序 = 命中顺序**：后画的在上层 + 后被命中。`createRegion` 的顺序就是 z-order；想换序调 `bringToFront`/`sendToBack`。

实现：使用 `parent.sortableChildren = true` + sibling zIndex 扫描。同时同步更新 `parent._subRegions` 数组（事件路由的 truth source），保证子区域数组顺序 = 渲染顺序。

### 拖动（构造选项）
拖动通过 `createRegion` 的 `opts` 传入：

```ts
type SubDragMode = 'title' | 'anywhere' | 'none';

createRegion(bounds, {
  dragMode?: SubDragMode;                // 'none' = 不可拖动（默认不传 = 不可拖动）
  dragBounds?: () => Rect | null;        // 拖动约束范围（默认 parent.bounds）
  dragBringToFront?: boolean;            // 拖动时是否置顶，默认 true
  tapThreshold?: number;                 // onTap 的位移阈值（px），默认 4
  onDragStart?: (p: { x, y }) => void;
  onDrag?: (p: { x, y }) => void;
  onDragEnd?: (p: { x, y }) => void;
})
```

**实现**：在 `SubCanvas` 构造函数中初始化 drag handlers。扫描 `stage.children` 中 label=`'subcanvas-drag-handle'` 的 child → 在其上安装 `pointerdown` → 按 `dragMode`：
- `'title'`：只响应 handle child 上的按下（PIXI 原生事件）
- `'anywhere'`：由 `handlePointer` 直接处理，走 AABB 命中检测（见下方 "anywhere 实现"）

**拖动事件流**：`handle.on('pointerdown')` 启动 → 挂 `window.addEventListener('pointermove'/'pointerup')`（DOM 级事件，无视 PIXI hit-test 边界问题）+ `app.stage.on('pointermove'/'pointerup')`（PIXI 级，handle 同 frame 事件）。位置取 `e.clientX/Y`（canvas 全屏，client=canvas 坐标）。

**`dragMode='anywhere'` 实现**（2026-07-20 重写）：

**背景**：原先依赖 PIXI EventSystem 做命中检测（`_bg` 容器 + `eventMode = 'static'` + `hitArea`）。但 PIXI v8 的 hit-test 算法会跳过 `eventMode = 'none'` 的容器及其子树，而 SubCanvas 的 `stage`（`PIXI.Container`）默认 `eventMode = undefined`（PIXI 视作 `'none'`），导致 `_bg` 永远无法被命中，`anywhere` 拖拽完全失效。

**新实现**：
- 不再创建 `_bg` 透明容器，不依赖 PIXI EventSystem
- 拖拽逻辑在 `SubCanvas.handlePointer` 内，复用框架已有的 AABB 事件路由（`proxy.routePointer` → `SubCanvas.handlePointer` → AABB hit-test），这套路由不依赖 PIXI 的 `eventMode`
- 流程：`pointerdown` 记录起始坐标 → `pointermove` 超过 `tapThreshold`（默认 4px）后启动拖拽 → `_applyAnywhereDrag(clientX, clientY)` 逐帧 `setPosition` → `pointerup/leave` 调用 `_endAnywhereDrag()` 结束
- 拖拽启动时通过 `_installWindowDragFallback()` 挂 `window.addEventListener('pointermove'/'pointerup')` 作为跨 canvas 边界 fallback；结束自动解绑

**粘手 bug 修复**：重写后拖拽走 `proxy.routePointer`，但 PixiApp 的 `makePointerHandler` 中有 `e.target !== proxy.canvas` 过滤鼠标事件。快速移出 canvas 后 `pointerup` 的 `target` 不再是 canvas → 被过滤 → 收不到 up → `_isDragging` 永不重置 → 粘手。修复：拖拽启动时挂 window 级 `pointermove/up` 事件（DOM 级事件不检查 `e.target`），`_endAnywhereDrag()` 中自动解绑。

**边界情况**：
- 拖拽结束后清除 `_pressStart`，防止 tap 检测误触发

**constraint clamp**：每帧在 `dragBounds` 内 clamp `setPosition`，保证窗口不被拖出父级。

**注意**：用了 `dragMode` 就别在同一个 SubCanvas 上手动写 `onPress` 处理拖动 — built-in drag 和手动拖动会冲突；但其他用途的 onPress（如点击检测）可以共存。

### 生命周期
```ts
destroy(): void                                  // 幂等（重复调用安全）
getChildren(): SubCanvas[]                        // 返回浅拷贝
```

---

## 使用

### 最简 — 一个全屏子画布
```ts
const sc = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
const g = new PIXI.Graphics().rect(0, 0, W, H).fill(0xff0000);
sc.stage.addChild(g);

sc.onPress((e) => console.log('clicked at', e.x, e.y));
```

### 2×2 网格（手动划分子区域）
```ts
const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
const cells = [0, 1, 2, 3].map((i) => {
  const col = i % 2, row = Math.floor(i / 2);
  return root.createRegion({
    x: col * (W / 2) + 2, y: row * (H / 2) + 2,
    width: W / 2 - 4, height: H / 2 - 4,
  });
});

cells.forEach((cell, i) => {
  cell.onPress((e) => console.log(`cell ${i}:`, e.x, e.y));
});
```

### 响应窗口 resize
```ts
const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
const cells = [0, 1, 2, 3].map((i) => {
  const col = i % 2, row = Math.floor(i / 2);
  return root.createRegion({
    x: col * (W / 2), y: row * (H / 2),
    width: W / 2, height: H / 2,
  });
});

const border = new PIXI.Graphics();
cells[0].stage.addChild(border);
cells[0].onResize((b) => {
  border.clear().rect(0, 0, b.width, b.height).stroke({ width: 2, color: 0xff0000 });
});

const layout = (W: number, H: number) => {
  root.setBounds({ x: 0, y: 0, width: W, height: H });
  cells.forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    c.setBounds({
      x: col * (W / 2), y: row * (H / 2),
      width: W / 2, height: H / 2,
    });
  });
};
layout(W, H);
const cleanup = proxy.onWindowResize(() => layout(window.innerWidth, window.innerHeight));
```

### 销毁
```ts
proxy.destroyAll();   // 销毁所有顶层 canvas，递归到子级
// 或
sc.destroy();         // 单个销毁
```

---

## 应用范围

适合：
- **多窗口模拟**（编辑器、IDE、桌面 UI）— 在一个 canvas 里摆 N 个伪窗口
- **HUD 叠加层**（血条、小地图、聊天）— grid 切分到屏幕角落
- **平铺游戏地图**（大世界滚动）— grid 把可视区切成瓦片，按需渲染
- **多面板数据可视化**（仪表盘）— divide/grid 切出独立交互区

不适合：
- 需要 WebGL 后处理（blur / bloom / 像素着色）全屏统一处理 — 整个根 canvas 共享一个后处理
- 多个真正独立的 canvas（favicon canvas / 离屏 render target）— 那是 `rootApp.renderer.generateTexture` 或多 `PIXI.Application` 的场景
- 频繁跨越子边界拖拽对象 — 拖拽期间子边界重叠判定需要手动管理

---

## 注意事项

1. **bounds 是局部坐标**：`{ x: 0, y: 0, width: 100, height: 100 }` 表示在父级内的 100×100；顶层 canvas 的 `bounds.x/y` 通常是 0，但可以是任意值（用于悬浮窗）。
2. **事件冒泡是叶子优先**：嵌套时点击子区域，父级的 `onPress` 不会触发（子级 return true）。
3. **`globalBounds` 是 getter**，每次访问都递归算，O(depth)。频繁访问请自行缓存。
4. **PIXI v8.18**：渲染器类型是 `PIXI.Renderer`（联合类型 WebGL/WebGPU/Canvas），不是已删除的 `PIXI.IRenderer`。
5. **z-order 用 `bringToFront`/`sendToBack`**：内部用 sibling zIndex 扫描 + `parent.sortableChildren = true`。同时同步更新 `_subRegions` 数组（事件路由的 truth source）。不要直接操作 `parent.stage.setChildIndex`，会破坏事件路由。
6. **`clipToBounds` 是构造选项**：传 `clipToBounds: true` 后 SubCanvas 自动创建裁切 mask（`PIXI.Graphics` + `.fill({ color: 0xffffff })`，mask 必须 fill 否则全隐藏）。仅构造时设置，不可运行时更改。
7. **`destroy()` 幂等**：重复调用安全；`destroyed` getter 用来跳过已销毁实例的逻辑。
8. **`setBounds` 不会通知子级**：但子级的 `globalBounds` 动态算，所以指针命中仍然正确；子级若需要重新画自己（如重画边框），在子级上注册 `onResize`。
9. **拖动使用 DOM `window.addEventListener` 作为 fallback**：PIXI 的 FederatedEvent 在鼠标快速移出 canvas 时可能丢失移动事件。挂 window 级 `pointermove`/`pointerup` 保证拖动不卡住。这是已知痛点（见 README.md 踩过的坑）。
10. **`addChild` 自动安装 drag handle**：当 `dragMode` 非 `'none'` 时，调用 `sc.addChild(child)` 后，如果 child 的 `label === 'subcanvas-drag-handle'`，自动在其上安装 `pointerdown` 事件。不要用 `win.stage.addChild(bar)`（绕过自动安装）。
