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

root.createSubRegion(bounds)
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
不要直接 `new SubCanvas` — 必须通过 `SubCanvasProxy.createRegion` 或某个 `SubCanvas.createSubRegion / divide / grid` 创建。

### 只读属性
| 属性 | 类型 | 说明 |
|---|---|---|
| `stage` | `PIXI.Container` | 这个子画布的容器（在主 stage 或父 stage 里） |
| `bounds` | `Rect` | 当前本地边界（x, y 相对父级） |
| `globalBounds` | `Rect` | 当前全局边界（递归父级） |
| `parent` | `SubCanvas \| null` | 父级（顶层为 null） |
| `rootApp` | `PIXI.Application` | 主 PIXI 应用 |
| `ticker` | `PIXI.Ticker` | → `rootApp.ticker` |
| `renderer` | `PIXI.Renderer` | → `rootApp.renderer`（v8.18 类型，不是 `IRenderer`） |
| `canvas` | `HTMLCanvasElement` | → `rootApp.canvas` |
| `destroyed` | `boolean` | 已 destroy 标志 |

### 派生 / 划分
```ts
createSubRegion(bounds: Rect): SubCanvas          // 直接创建子区域
divide({ direction, ratios }): SubCanvas[]        // 线性切分（horizontal/vertical）
grid({ rows, cols, gap? }): SubCanvas[]           // 网格切分
```

### 事件
```ts
onPress(fn)   / onMove(fn)   / onRelease(fn)   / onLeave(fn)   // 链式，返回 this
off(type, fn)                                                  // 移除单个
```
回调签名：
```ts
(e: SubPointerEvent) => void
// SubPointerEvent = { type, x, y, globalX, globalY, originalEvent }
```
`x/y` 是 **本地坐标**（相对此 SubCanvas 的 stage）；`globalX/globalY` 是 viewport 坐标。

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
**渲染顺序 = 命中顺序**：后画的在上层 + 后被命中。`createSubRegion` 的顺序就是 z-order；想换序调 `bringToFront`。

### 拖动
```ts
setDraggable(opts?: {
  bounds?: Rect;                                  // 拖动范围（默认 parent.bounds）
  onDragStart?: (e: SubPointerEvent) => void;
  onDrag?: (e: SubPointerEvent, pos: { x, y }) => void;
  onDragEnd?: (e: SubPointerEvent) => void;
  bringToFront?: boolean;                         // 拖动时是否置顶，默认 true
}): () => void                                    // 返回 cleanup
```
**实现**：内部注册 `onPress` / `onMove` / `onRelease`，在 `onPress` 时记起点，`onMove` 时算 delta 并 `setPosition`，自动 clamp 到 `bounds`。
**注意**：用了 `setDraggable` 就别再在同一个 SubCanvas 上手动写 `onPress` 处理拖动 — 会冲突；其他用途的 onPress 仍然可以共存。

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

### 2×2 网格
```ts
const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
const cells = root.grid({ rows: 2, cols: 2, gap: 4 });

cells.forEach((cell, i) => {
  cell.onPress((e) => console.log(`cell ${i}:`, e.x, e.y));
});
```

### 响应窗口 resize
```ts
const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
const cells = root.grid({ rows: 2, cols: 2 });

const border = new PIXI.Graphics();
cells[0].stage.addChild(border);
cells[0].onResize((b) => {
  border.clear().rect(0, 0, b.width, b.height).stroke({ width: 2, color: 0xff0000 });
});

const layout = (W: number, H: number) => {
  root.setBounds({ x: 0, y: 0, width: W, height: H });
  cells.forEach((c, i) => {
    const row = Math.floor(i / 2), col = i % 2;
    c.setBounds({ x: col * (W / 2), y: row * (H / 2), width: W / 2, height: H / 2 });
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
5. **没有 z-order API**：兄弟节点的命中顺序 = `createSubRegion` 的顺序；后建的在上层（PIXI 渲染顺序），也后被命中。要换 z-order 用 `parent.stage.setChildIndex(sc.stage, idx)`。
6. **没有裁切 mask**：超出 bounds 的内容不会被裁掉，会画到屏幕外（暂时按设计如此；如需裁切可手动 `stage.mask = new Graphics().rect(0,0,w,h).fill(0xffffff)`，但 PIXI v8 的 `Graphics.fill(0xffffff)` 当 mask 需要 `renderable = false`）。
7. **`destroy()` 幂等**：重复调用安全；`destroyed` getter 用来跳过已销毁实例的逻辑。
8. **`setBounds` 不会通知子级**：但子级的 `globalBounds` 动态算，所以指针命中仍然正确；子级若需要重新画自己（如重画边框），在子级上注册 `onResize`。
