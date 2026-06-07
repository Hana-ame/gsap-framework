# ComponentLifeMapDisplay — Conway on a Draggable World

`src/example/component-life-map/ComponentLifeMapDisplay.tsx` 的对应文档。

---

## 职责

经典康威生命游戏（Conway's Game of Life）在一个**大尺寸 toroidal 世界**上运行，视角可以**像 Google Maps 那样鼠标拖动 pan**。

- 世界默认 200×150 格 = 30,000 cells（远超 viewport 看到的 100~200 格）
- `wrap = on`（硬编码，无 UI 切换）—— 邻居查询永远环绕（toroidal grid）
- 鼠标拖动 pan 视角，**有软边界**：世界比 viewport 大时 worldContainer 位置被 clamp 到 `[-(worldW-viewportW), 0]`，可以拉到底再拉回来；世界比 viewport 小时居中
- 拖动距离 < 4px 视为 click → toggle 该格生死
- 拖动距离 ≥ 4px 视为 pan → 移动 worldContainer
- 控制面板：Play / Pause / Step / Clear / Random / Reset + Speed / Zoom / Rows / Cols steppers + Gen / Pop / 视口中心坐标

**关键约束**（同 2048）：**整个 UI 100% 在 PIXI 内渲染**。React 组件 `return <></>`，游戏状态在**模块级 `let state: LifeMapRefs | null`**，**整个文件只有一个 `useEffect`（挂载/卸载 PIXI app）**。

---

## 玩法

| 操作 | 行为 |
|---|---|
| **viewport 内拖动**（≥ 4px） | 移动 worldContainer，pan 视角 |
| **viewport 内点击**（< 4px） | toggle 该格生死 |
| ▶ Play / ⏸ Pause | 启动 / 暂停自动步进（toroidal） |
| Step | 暂停时推进一步 |
| Clear | 清空整盘，Gen 归零 |
| 🎲 Random | 重新随机分布整盘（密度 12%），Gen 归零 |
| Reset | 暂停 + 清空 + Gen=0 |
| Speed +/- | 1-30 fps 步进速度 |
| Zoom +/- | 4-20 px 单格大小 |
| Rows +/- | 世界行数 50-300（**会清空**） |
| Cols +/- | 世界列数 50-400（**会清空**） |

> "wrap = on"：**永远**是 toroidal，没有 UI 切换。这是规则约束，不是因为 UI 没空位。

### 视口 vs 世界

- viewport 大小 = `window.innerWidth × (window.innerHeight - 100)`（100px 是控制栏）
- 世界大小 = `worldCols × cellSize × worldRows × cellSize`
- 默认 200×150 cells @ 8px = 1600×1200 px 世界，1280×880 viewport → 看到 160×110 cells（≈ 17%）
- 拖到右边缘：worldContainer.x = `-(worldW - viewportW)` = `-(1600 - 1280)` = `-320`，看到世界最右 1280px
- 拉到头后能再拉回来：clamp 是双向的，拖左 worldContainer.x 减小（负向更多），拖右 worldContainer.x 增大（趋向 0）

---

## 代码结构

```
模块级
  ├─ const: DEFAULT_WORLD_ROWS=150, DEFAULT_WORLD_COLS=200, DEFAULT_CELL_SIZE=8
  ├─ const: MIN/MAX 边界、密度、CELL_COLOR 等
  ├─ function idx / newGrid / stepGridToroidal / countLive
  ├─ function makeButton / makeStepper            (PIXI UI 工厂)
  ├─ interface LifeMapRefs                         (state shape)
  ├─ let state: LifeMapRefs | null = null         (整个游戏状态)
  ├─ function getBounds / initialWorldPos / drawBg / drawGridLines / drawCells
  ├─ function applyPan / toggleCellAt
  ├─ function updateStats / updateCoords / updatePlayPauseLabel
  ├─ function doStep / doClear / doRandom / doPlayPause / doReset
  ├─ function buildControlPanel / buildViewport / setupDrag
  ├─ function registerTicker / unregisterTicker
  ├─ function setRows / setCols / setCellSize / setSpeed    (state mutator, no React)
  └─ function rebuild                              (清空 region + 重建 PIXI children)

React 组件
  └─ ComponentLifeMapDisplay()
     ├─ useEffect([]) → startPixiApp → 创建 control + viewport region → rebuild
     └─ return <></>
```

---

## 关键设计

### 模块级 `let state`（沿用 2048 模式）

```ts
let state: LifeMapRefs | null = null;

function setRows(n: number): void {
  if (!state) return;
  if (n < MIN_WORLD_ROWS || n > MAX_WORLD_ROWS) return;
  if (state.worldRows === n) return;
  state.worldRows = n;
  state.grid = newGrid(n, state.worldCols, 'empty');
  state.generation = 0;
  state.playing = false;
  const init = initialWorldPos(state);
  state.worldX = init.x;
  state.worldY = init.y;
  rebuild(state);
}
```

- `setRows` / `setCols` / `setCellSize` 是**模块级函数**，不通过 React state。
- 状态变更直接 mutate `state` + 调 `rebuild(state)` 原地重建 PIXI 内容。
- React 组件不 re-render，PIXI app 不会被销毁（没有 `useEffect([...])` 依赖）。

### worldContainer 模式（pan 实现）

```ts
const worldContainer = new PIXI.Container();
worldContainer.eventMode = 'none';
worldContainer.x = refs.worldX;
worldContainer.y = refs.worldY;
region.stage.addChild(worldContainer);

// worldBg / gridLineGraphics / cellsGraphics 都是 worldContainer 的子节点
// 它们的 rect 用 world-local 坐标 (0..worldW, 0..worldH) 画

function applyPan(refs, dx, dy) {
  const b = getBounds(refs);
  refs.worldX = clampPan(refs.drag.startWorldX + dx, b.minX, b.maxX);
  refs.worldY = clampPan(refs.drag.startWorldY + dy, b.minY, b.maxY);
  refs.worldContainer.x = refs.worldX;
  refs.worldContainer.y = refs.worldY;
}
```

- **为什么是 `Container` 不是 `SubCanvas`**：我们拖的是子级图元，不是窗口。SubCanvas 拖动系统是为"在父级里 move 整个 SubCanvas"设计的（drag handle、dragBounds），不适合"在世界里 pan 视角"。
- **为什么 `eventMode='none'`**：worldContainer 及其子节点不参与 PIXI hit-test，让 viewport region 的 `onPress` 路由直接拿到 pointerdown。如果不设 `'none'`，cellsGraphics 的 rect 仍可能挡住事件（虽然默认 v8 是 `'passive'`，但显式设更稳）。
- **拖动距离 ≥ 4px 才算 pan**：DRAG_THRESHOLD 防止手抖把 click 误判为 drag。click → toggle cell；drag → pan。
- **window.addEventListener('pointermove'/'up')**：与 SubCanvas 拖动系统一样用 DOM 级事件，绕过 PIXI hit-test（虽然这里 viewport region 永远在屏幕里，理论上不需要 fallback，但模式一致更稳）。

### 视口 vs 世界坐标

`getBounds` 返回 `worldContainer` 的合法位置范围：

```ts
function getBounds(refs) {
  const worldW = refs.worldCols * refs.cellSize;
  const worldH = refs.worldRows * refs.cellSize;
  if (worldW <= refs.viewportW) {
    const c = Math.floor((refs.viewportW - worldW) / 2);
    return { minX: c, maxX: c, ... };  // 居中
  } else {
    return { minX: -(worldW - refs.viewportW), maxX: 0, ... };  // 可 pan
  }
}
```

- 当 `worldW > viewportW`：`worldX ∈ [-(worldW - viewportW), 0]`，pan 范围 = `worldW - viewportW`。
- 当 `worldW ≤ viewportW`：`worldX = (viewportW - worldW) / 2`，世界居中。
- `applyPan` 用这个范围 clamp `worldX = startWorldX + dx`。

### cull 可见 cell

`drawCells` 只画视口内的 cell：

```ts
function drawCells(refs) {
  const cs = refs.cellSize;
  const b = getBounds(refs);
  const leftPx = -b.minX;     // 当前 worldContainer.x = b.minX 时，左边缘 = 0
  const topPx = -b.minY;
  const rightPx = leftPx + refs.viewportW;
  const bottomPx = topPx + refs.viewportH;
  const firstCol = Math.max(0, Math.floor(leftPx / cs) - 1);
  const lastCol = Math.min(refs.worldCols, Math.ceil(rightPx / cs) + 1);
  // ... 同样 firstRow / lastRow
  for (let r = firstRow; r < lastRow; r++) {
    for (let c = firstCol; c < lastCol; c++) {
      if (refs.grid[idx(r, c, refs.worldCols)]) {
        refs.cellsGraphics.rect(c * cs, r * cs, cs, cs);
      }
    }
  }
  refs.cellsGraphics.fill({ color: CELL_COLOR });
}
```

- 默认 viewport 看 ~17% 世界 → 30,000 cells 里只画 ~5,000 live cells × viewport / world
- 12% 密度下 viewport 内 live cells ≈ 5,000 × 0.12 = 600，单 fill 600 rects，没压力
- 拖动时 redraw 是 O(visible_live) 不是 O(30k)

### toroidal step（hardcoded wrap）

```ts
function stepGridToroidal(grid, rows, cols) {
  const next = new Uint8Array(grid.length);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = (r + dr + rows) % rows;   // 永远 mod
          const nc = (c + dc + cols) % cols;
          if (grid[idx(nr, nc, cols)]) n++;
        }
      }
      const i = idx(r, c, cols);
      next[i] = grid[i] ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
    }
  }
  return next;
}
```

- 没有 `wrap` 变量，没有 `if (wrap)` 分支，**wrap 永远是 on**
- 30,000 cells × 8 neighbor queries = 240,000 操作/步，< 1ms
- 视口不 wrap（pan 软边界），但**格子拓扑** wrap（grid 是 toroidal 的）
- 经典 Conway 没有 wrap 时，glider 漂到边界就消失；这里 wrap 时，glider 可以绕一圈回到原点

### Zoom 跟 Rows/Cols 互相影响

`setCellSize(n)`、`setRows(n)`、`setCols(n)` 都会重置 `worldX/Y` 到 `initialWorldPos`（即 `getBounds` 的 `(minX, minY)`），**因为 zoom/size 变化会改变世界大小，可能让之前的 pan 位置越界**。

```ts
function setCellSize(n: number): void {
  if (!state) return;
  if (n < MIN_CELL_SIZE || n > MAX_CELL_SIZE) return;
  if (state.cellSize === n) return;
  state.cellSize = n;
  const init = initialWorldPos(state);
  state.worldX = init.x;
  state.worldY = init.y;
  rebuild(state);
}
```

- 这是有意的：用户缩小 zoom → 世界变小 → viewport 能装下 → 居中显示
- 用户增大 zoom → 世界变大 → 之前的 pan 位置可能越界 → 回到 `(minX, minY)`（左上 / 居中）
- 不会有"zoom 后看不见任何东西"的尴尬

### Cleanup 跟 onPress 累积

`region.onPress(onPress)` 把 listener 加到 `region.listeners.get('pointerdown')`，**不会随 `clearRegion(stage)` 清理**（因为它在 SubCanvas 内部 Map，不在 PIXI stage 上）。

每次 `rebuild` 创建新 `onPress` 闭包，所以需要在 cleanup 里调 `region.offPointer`：

```ts
function setupDrag(refs) {
  // ...
  region.onPress(onPress);
  refs.pointerCleanups.push(() => region.offPointer('pointerdown', onPress));
}

function rebuild(refs) {
  refs.pointerCleanups.forEach((fn) => fn());
  refs.pointerCleanups = [];
  // ... clearRegion + 重建
}
```

`useEffect` 卸载时同样调 `pointerCleanups` 清理，避免内存泄漏。

---

## 已知约束

- **没有 createWindow / createConfirm / createBus**：本例专注 SubCanvas + 纯 PIXI UI + 自定义 drag，未引入上层 components 包。
- **没有 keyboard control**：不像 component-conway 有 ArrowKeys 控制步进。viewport 拖动是主交互。
- **没动画**：拖动直接更新 worldContainer.x，PIXI 渲染每帧重画。没必要做 tween（pan 应该跟手）。
- **没有 inertia / momentum**：松手立刻停。Google Maps 在桌面端有惯性，移动端有 fling，但 v1 不做。
- **没做 pinch-zoom**：移动端双指缩放未实现。Zoom 只能通过 stepper 按钮调整。
- **没做 minimap**：viewport 看不到世界全貌，没有缩略图指示当前位置（只有"view: x,y"文字）。
- **没有内存保护**：200×150 = 30,000 cells × 1 byte = 30KB，3,000×400 = 1.2MB 也不大。最大 Rows/Cols 限 300/400 是软上限。
- **window 监听不挂 stage**：因为拖的是子 container，不是 region。如果未来改成"拖整个 region"，再挂 app.stage。

---

## 性能特征

- **30k cells step**：240k 邻居查询/步，< 1ms（V8 JIT，flat Uint8Array）。
- **拖动 redraw**：cull 到 viewport ~5k cells × 12% 密度 = 600 rects/frame，60fps 下 36k rects/s，单 Graphics fill 没问题。
- **30k cells cull 边界检查**：`firstCol` / `lastCol` / `firstRow` / `lastRow` 都是简单除法 + clamp，4 个数。
- **cellsGraphics 共享**：state.cellSize 变化时 rebuild 一次 cellsGraphics；不变化时只 `clear() + rect() + fill()`。
- **整盘 full redraw 的场景**：clear/random/reset → 画所有 live cells。30k × 12% = 3,600 rects/次，< 5ms。

---

## 未来扩展点

- **Inertia / fling**：pointerup 时记录速度向量，requestAnimationFrame 继续 worldContainer.x += vx * decay; vx *= 0.95。
- **Pinch zoom**：touchstart 双指，记录两指距离 → 移动时缩放 cellSize。难点：PIXI v8 的 pointer 事件已经支持 multi-touch，但要正确路由到 SubCanvas。
- **Minimap**：右下角小窗口显示整个世界 + 视口框，点击 minimap 跳转。
- **Pattern 预设**：glider / blinker / pulsar 等经典 pattern 的位图，paste 到 viewport 中心。
- **Hashlife**：超大世界的 O(log n) 步进。
- **Multicolor 规则**：HighLife / Day&Night / Wireworld。
- **Hash 路由同步**：`#life-map?rows=300&cols=400&seed=12345` 直接跳到指定配置。
