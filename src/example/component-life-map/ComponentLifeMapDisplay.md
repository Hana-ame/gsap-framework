# ComponentLifeMapDisplay — Conway on a Draggable World

`src/example/component-life-map/ComponentLifeMapDisplay.tsx` 的对应文档。

---

## 职责

经典康威生命游戏（Conway's Game of Life）在一个**大尺寸 toroidal 世界**上运行，视角可以**像 Google Maps 那样鼠标拖动 pan**，**无限滚动**。

- 世界默认 200×150 格 = 30,000 cells（远超 viewport 看到的 100~200 格）
- `wrap = on`（硬编码，无 UI 切换）—— 邻居查询永远环绕（toroidal grid）
- 鼠标拖动 pan 视角，**无边界**（unbounded）：拖多远都能继续，永远 wrap 回原点
- 拖动距离 < 4px 视为 click → toggle 该格生死（用 `region.onTap`）
- 拖动距离 ≥ 4px 视为 pan → 移动 worldContainer（用 `region.onMove`）
- 控制面板：Play / Pause / Step / Clear / Random / Reset / Recenter + Speed / Zoom / Rows / Cols steppers + Gen / Pop / 视口中心坐标
- **4 块动态 tile（2×2）**实现无限 wrap：tile 位置根据 `floor(-worldX/worldW)` 算，永远覆盖 viewport
- pan 路径**不重绘**：cellsGraphics 预先画好 4 块 tile 的所有 cell，pan 时只移动 worldContainer.x/y + 必要时换 tile 位置 + 更新坐标文本，零 CPU/帧

**关键约束**（同 2048）：**整个 UI 100% 在 PIXI 内渲染**。React 组件 `return <></>`，游戏状态在**模块级 `let state: LifeMapRefs | null`**，**整个文件只有一个 `useEffect`（挂载/卸载 PIXI app）**。

---

## 玩法

| 操作 | 行为 |
|---|---|
| **viewport 内拖动**（≥ 4px） | 移动 worldContainer，pan 视角，**无限** |
| **viewport 内点击**（< 4px） | toggle 该格生死（toroidal wrap） |
| ▶ Play / ⏸ Pause | 启动 / 暂停自动步进（toroidal） |
| Step | 暂停时推进一步 |
| Clear | 清空整盘，Gen 归零 |
| 🎲 Random | 重新随机分布整盘（密度 12%），Gen 归零 |
| Reset | 暂停 + 清空 + Gen=0 |
| Recenter | worldX/Y 归零，视角回到 (0, 0) |
| Speed +/- | 1-30 fps 步进速度（暂停时也能改） |
| Zoom +/- | 4-20 px 单格大小（会重置 pan 到 0,0） |
| Rows +/- | 世界行数 50-300（**会清空**） |
| Cols +/- | 世界列数 50-400（**会清空**） |

> "wrap = on"：**永远**是 toroidal，没有 UI 切换。这是规则约束，不是因为 UI 没空位。

### 视口 vs 世界

- viewport 大小 = `window.innerWidth × (window.innerHeight - 100)`（100px 是控制栏）
- 世界大小 = `worldCols × cellSize × worldRows × cellSize`
- 默认 200×150 cells @ 8px = 1600×1200 px 世界，1280×880 viewport → 看到 160×110 cells（≈ 17%）
- pan **无 clamp**：拖到负数几千像素都行，4 块 tile 自动跟手
- `cdxBase = floor(-worldX / worldW)`，tile 0/1 覆盖横向相邻两份世界，tile 2/3 覆盖纵向相邻两份

---

## 代码结构

```
模块级
  ├─ const: DEFAULT_WORLD_ROWS=150, DEFAULT_WORLD_COLS=200, DEFAULT_CELL_SIZE=8
  ├─ const: MIN/MAX 边界、密度、CELL_COLOR 等
  ├─ function idx / newGrid / stepGridToroidal / countLive / mod
  ├─ function makeButton / makeStepper            (PIXI UI 工厂)
  ├─ interface Stepper / TileRefs / LifeMapRefs
  ├─ let state: LifeMapRefs | null = null         (整个游戏状态)
  ├─ function centerOfView / tileBase / updateTilePositions
  ├─ function drawBg / drawGridLines / drawCells   (no-cull，画全部)
  ├─ function setWorldPos / toggleCellAt
  ├─ function updateStats / updateCoords / updatePlayPauseLabel
  ├─ function doStep / doClear / doRandom / doPlayPause / doReset / doRecenter
  ├─ function buildControlPanel / buildViewport
  ├─ function registerTicker / unregisterTicker
  ├─ function setRows / setCols / setCellSize / setSpeed    (state mutator, no React)
  ├─ function clearRegion / rebuild
  └─ function ComponentLifeMapDisplay()           (React 入口, 唯一 useEffect)

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
  state.worldH = n * state.cellSize;
  state.grid = newGrid(n, state.worldCols, 'empty');
  state.generation = 0;
  state.playing = false;
  state.lastStepTime = 0;
  setWorldPos(state, 0, 0);
  drawBg(state);
  drawGridLines(state);
  drawCells(state);
  updateStats(state);
  updatePlayPauseLabel(state);
  state.steppers.rows?.refresh();
}
```

- `setRows` / `setCols` / `setCellSize` / `setSpeed` 是**模块级函数**，不通过 React state。
- 状态变更直接 mutate `state`，PIXI app 不会被销毁（没有 `useEffect([...])` 依赖）。
- stepper 显示用 `() => state!.X` getter，不用 snapshot — 见下文。

### 用 `region.onPress/onMove/onTap` 处理 pan+click

**不要**在 viewport 里手动建一个 `eventMode='static'` 的 `dragOverlay` Container 来拖动 — 那会撞上两个坑：

1. `PIXI.FederatedPointerEvent.x/y` 是**全局 stage 坐标**（= clientX/Y），不是 dragOverlay-local。viewport region 在全局 stage 的 (0, CONTROL_H=100)，所以 click 算出来的 cell 行号会偏 12-13 cells（100/8）。
2. 你得自己写 `DRAG_THRESHOLD`、自己 add window listener、自己清理。

`SubCanvas` 已经提供了**正确的 API**：

```ts
let dragStartClientX = 0;
let dragStartClientY = 0;
let dragStartWorldX = 0;
let dragStartWorldY = 0;

region.onPress((e) => {                       // pointerdown
  dragStartClientX = e.globalX;
  dragStartClientY = e.globalY;
  dragStartWorldX = refs.worldX;
  dragStartWorldY = refs.worldY;
});

region.onMove((e) => {                        // pointermove
  const dx = e.globalX - dragStartClientX;
  const dy = e.globalY - dragStartClientY;
  setWorldPos(refs, dragStartWorldX + dx, dragStartWorldY + dy);
});

region.onTap((e) => {                         // pointerup 且 < 4px 位移
  toggleCellAt(refs, e.x, e.y);
  drawCells(refs);
  updateStats(refs);
});
```

- `onPress/onMove/onTap` 的 `x/y` 已经是**region-local**（`handlePointer` 内部 `gx - gb.x`），不会有偏移
- `onTap` 是 SubCanvas 新增的事件，**只在 pointerdown 到 pointerup 之间位移 < `tapThreshold`（默认 4px）时触发**，内部追踪 `_pressMoved` 标志，drag-then-return 不会误判
- `globalX/globalY` 永远 = `e.clientX/Y`（canvas `position: fixed; inset: 0`）

### 4 块动态 tile（无 clamp，无限 pan）

```ts
function tileBase(refs: LifeMapRefs): { cdx: number; cdy: number } {
  return {
    cdx: Math.floor(-refs.worldX / refs.worldW),
    cdy: Math.floor(-refs.worldY / refs.worldH),
  };
}

function updateTilePositions(refs: LifeMapRefs): void {
  const { cdx, cdy } = tileBase(refs);
  for (let i = 0; i < 4; i++) {
    const tileCx = i % 2;
    const tileCy = Math.floor(i / 2);
    const tile = refs.tiles[i];
    if (!tile) continue;
    tile.container.x = (cdx + tileCx) * refs.worldW;
    tile.container.y = (cdy + tileCy) * refs.worldH;
  }
}
```

- **为什么是 4 不是 9**：用户在 commit `9e3e1c4` 后明确说"4 tiles 拼接"。4 块 tile 在 2×2 排布，按 `cdxBase = floor(-worldX/worldW)` 算的 tile 0/1 横向相邻、tile 2/3 横向相邻；tile 0/2 纵向相邻、tile 1/3 纵向相邻。viewport 一定在 (cdx, cdy) 到 (cdx+1, cdy+1) 区域内，所以 4 块足够
- **为什么不需要 clamp**：tile 位置随 worldX/Y 移动，永远有 1-2 块 tile 覆盖 viewport，clamp 反而会限制探索
- **`setWorldPos` 检测 cdx 变化才调 `updateTilePositions`**：跨 tile 边界才换 tile 位置，纯 pan 不重排

### pan 不重绘（性能）

```ts
function setWorldPos(refs, x, y) {
  const cdxOld = Math.floor(-refs.worldX / refs.worldW);
  const cdyOld = Math.floor(-refs.worldY / refs.worldH);
  refs.worldX = x;
  refs.worldY = y;
  if (refs.worldContainer) {
    refs.worldContainer.x = x;
    refs.worldContainer.y = y;
  }
  const cdxNew = Math.floor(-x / refs.worldW);
  const cdyNew = Math.floor(-y / refs.worldH);
  if (cdxNew !== cdxOld || cdyNew !== cdyOld) {
    updateTilePositions(refs);
  }
  updateCoords(refs);  // 只改一行文本
}
```

- **cellsGraphics 预先画好 4 块 tile 的所有 cell**：`drawCells` 是 no-cull，遍历 4 × 30k = 120k cells × 12% 密度 = 14,400 live rects，一次性 `.fill({ color: CELL_COLOR })`
- pan 路径不调 `drawCells`，**只**移动 `worldContainer.x/y` + 改 `coordsText` 一行文本
- 60fps pan 零 CPU 工作（除了换 tile 位置时一次性重排 4 个 Container.x/y）
- cell 变化时（click toggle、step、rebuild）才调 `drawCells`

### stepper 用 getter 不用 snapshot

```ts
// WRONG: value 是 build 时的 snapshot
function makeStepper(label, value, onChange, min, max) {
  // minus button 闭包: () => { if (value > min) onChange(value - 1) }
  // 点击后 value 仍是 10，第二次点还是 onChange(10-1)=onChange(9) — 但 state.setCols 检查重复就 bail
  // valText 也是 10，刷新页面才能看到 "11"
}

// RIGHT: getValue 是 () => number 闭包，永远读 state
function makeStepper(label, getValue, onChange, min, max): Stepper {
  // minus button 闭包: () => { const cur = getValue(); if (cur > min) onChange(cur - 1) }
  // 点击后 getValue() 返回 state 里的最新值，可以连续点 + 多次
  // 暴露 refresh(): valText.text = String(getValue())
  return { container, refresh };
}

// build:
const rowsStepper = makeStepper('Rows', () => state!.worldRows, setRows, ...);
region.stage.addChild(rowsStepper.container);
state.steppers.rows = rowsStepper;

// setRows 末尾:
state.steppers.rows?.refresh();
```

- setSpeed / setCellSize / setRows / setCols 末尾都调 `state.steppers.X?.refresh()` — 用户点 +/- 后 valText 立刻更新
- 闭包不持有 value 快照，所以 `setSpeed` 重复检查（`if (state.speed === n) return`）不再是 bug 的根源

### Zoom 必须重画 cells

`setCellSize` 不调 `drawCells` 是经典 bug：cellSize 改了，bg 用了新的 worldW/H 重画（`drawBg`），gridLines 用了新的 cs 重画（`drawGridLines`），**但 cellsGraphics 还在用旧 cs 画**。结果：bg 和 grid 对齐，cells 全错位。修法是 `drawCells(state)` 加进去。

```ts
function setCellSize(n: number): void {
  if (!state) return;
  if (n < MIN_CELL_SIZE || n > MAX_CELL_SIZE) return;
  if (state.cellSize === n) return;
  state.cellSize = n;
  state.worldW = state.worldCols * n;
  state.worldH = state.worldRows * n;
  setWorldPos(state, 0, 0);
  drawBg(state);
  drawGridLines(state);
  drawCells(state);  // 不能少
  state.steppers.zoom?.refresh();
}
```

### setSpeed 改 lastStepTime

```ts
function setSpeed(n: number): void {
  if (!state) return;
  if (n < MIN_FPS || n > MAX_FPS) return;
  if (state.speed === n) return;
  state.speed = n;
  state.lastStepTime = performance.now();  // 改完速度立刻重新计时
  state.steppers.speed?.refresh();
}
```

- 不重置的话：原 30fps 调到 1fps，但 lastStepTime 太久以前，next frame 就触发 step（因为 `now - lastStepTime >= 1000` 立刻满足），感觉"改完速度后第一步立即触发"
- 重置后：新速度的 interval 才开始算，符合直觉

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
- 视口不 wrap（pan 无限），但**格子拓扑** wrap（grid 是 toroidal 的）
- 经典 Conway 没有 wrap 时，glider 漂到边界就消失；这里 wrap 时，glider 可以绕一圈回到原点

---

## 踩过的坑

1. **不要在 viewport 里手动建 `eventMode='static'` 的 dragOverlay** — `PIXI.FederatedPointerEvent.x/y` 是全局 stage 坐标（= clientX/Y），不是 overlay-local，会算错 cell。改用 `region.onPress/onMove/onTap`，`e.x/y` 已经是 region-local。

2. **不要用 `setWorldPos` 重画 cells** — `drawCells` 一次性画 4 块 tile 14k+ live rects，pan 时重画是浪费。pan 只该改 `worldContainer.x/y` + 改 `coordsText`，`cdxBase` 跨边界才换 tile 位置。

3. **不要用 `eventMode='static'` 的 Container 拦截 viewport 事件然后自己 add window listener** — SubCanvas.onPress/onMove/onTap 已经做了这件事，自己重复一遍会和 PIXI hit-test 边界冲突（cursor 跳到非 interactive 区域时 PIXI move 事件会丢），而且写两套阈值。

4. **stepper 不要传 value 快照** — 闭包持有 value 快照 = 第二次点 +/- 永远不生效。传 `() => state!.X` getter，setter 末尾调 `stepper.refresh()` 同步 valText。

5. **setCellSize 必须调 `drawCells`** — 改了 cs 之后 cellsGraphics 的 rect 还在旧 cs 坐标，bg 用了新 worldW/H 重画，gridLines 用了新 cs 重画，唯独 cells 不动 → 视觉错位。

6. **setSpeed 应该重置 `lastStepTime`** — 不重置的话减速时下一步会立刻触发（旧的 lastStepTime 离现在太远，新的 interval 一开始就满足）。

7. **不要给 worldContainer / tileContainer / cellsGraphics 设 `eventMode='static'`** — 那是给按钮交互用的，world 不需要 hit-test。如果不设 `'none'`，cellsGraphics 会在 viewport 区域拦下 pointer 事件，region.onPress 收不到。

8. **4 块 tile 不是 9 块** — 9 块浪费；4 块按 `cdxBase = floor(-worldX/worldW)` 算 (cdx, cdy) 到 (cdx+1, cdy+1) 永远覆盖 viewport。

9. **stage mask 是裁切 viewport 用，不是裁切 tile** — `viewportRegion.stage.mask = whiteFilledRect(0, 0, viewportW, viewportH)`，把 world 限定在 viewport 区域内，不会溢出到控制面板。

10. **cellsGraphics 画完一次不要 clear**（pan 路径） — 4 块 tile 一起画，pan 时所有 tile 跟着 worldContainer 移动即可，不需逐 tile 重画。

---

## 已知约束

- **没有 createWindow / createConfirm / createBus**：本例专注 SubCanvas + 纯 PIXI UI + 4 块 tile 无限 pan，未引入上层 components 包。
- **没有 keyboard control**：不像 component-conway 有 ArrowKeys 控制步进。viewport 拖动是主交互。
- **没动画**：拖动直接更新 worldContainer.x，PIXI 渲染每帧重画。没必要做 tween（pan 应该跟手）。
- **没有 inertia / momentum**：松手立刻停。Google Maps 在桌面端有惯性，移动端有 fling，但 v1 不做。
- **没做 pinch-zoom**：移动端双指缩放未实现。Zoom 只能通过 stepper 按钮调整。
- **没做 minimap**：viewport 看不到世界全貌，没有缩略图指示当前位置（只有"view: col,row"文字）。
- **没有内存保护**：200×150 = 30,000 cells × 1 byte = 30KB，3,000×400 = 1.2MB 也不大。最大 Rows/Cols 限 300/400 是软上限。
- **cellsGraphics 4 块 tile 一次 fill** — 14k+ live rects 单 fill，单次 < 5ms。如果未来世界更大需要分块 fill。

---

## 性能特征

- **30k cells step**：240k 邻居查询/步，< 1ms（V8 JIT，flat Uint8Array）。
- **pan 路径**：零重绘，只改 worldContainer.x/y + coordsText。60fps 流畅。
- **4 块 tile 一次 drawCells**：14k+ live rects / 12% 密度，< 5ms，step/click 触发。
- **cdxBase 检测**：floor 除法，4 个数 / 帧。
- **cellsGraphics 共享**：state.cellSize 变化时一次 `clear() + rect() × 4 + fill()`；不变化时只换 worldContainer 位置。

---

## 未来扩展点

- **Inertia / fling**：pointerup 时记录速度向量，requestAnimationFrame 继续 worldContainer.x += vx * decay; vx *= 0.95。
- **Pinch zoom**：touchstart 双指，记录两指距离 → 移动时缩放 cellSize。难点：PIXI v8 的 pointer 事件已经支持 multi-touch，但要正确路由到 SubCanvas。
- **Minimap**：右下角小窗口显示整个世界 + 视口框，点击 minimap 跳转。
- **Pattern 预设**：glider / blinker / pulsar 等经典 pattern 的位图，paste 到 viewport 中心。
- **Hashlife**：超大世界的 O(log n) 步进。
- **Multicolor 规则**：HighLife / Day&Night / Wireworld。
- **Hash 路由同步**：`#life-map?rows=300&cols=400&seed=12345` 直接跳到指定配置。
