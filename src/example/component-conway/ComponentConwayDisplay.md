# ComponentConwayDisplay — Conway's Game of Life

`src/example/component-conway/ComponentConwayDisplay.tsx` 的对应文档。

---

## 职责

经典康威生命游戏（Conway's Game of Life）演示。玩家可以：

- 调节网格尺寸（行 / 列独立 10-120）
- 调节模拟速度（1-30 fps）
- 切换 toroidal wrap（开 = 边界连通，off = 边界消亡）
- 点击单个格子 toggle 死活状态（直接绘画）
- Random 按钮随机分布整盘（默认密度 28%）
- Play / Pause / Step / Clear / Reset

**关键约束**：**整个 UI 100% 在 PIXI 内渲染**——按钮、标签、stepper 全部 `PIXI.Container` + `PIXI.Graphics` + `PIXI.Text`，没有 React DOM overlay、没有 `<input>`、没有 `<button>`、没有 tooltip/toast/HTML。

API 建立在 SubCanvas 之上：控制面板用 `SubCanvas` 的 pointer event 测 button click；网格区域用 `SubCanvas.onPress` 测单格 toggle；模拟步进用 `SubCanvas.ticker`（即 `rootApp.ticker`）60fps 轮询。

---

## 玩法

| 操作 | 行为 |
|---|---|
| 网格内点按 | toggle 该格生死（play 时也可改，sim 状态保留） |
| ▶ Play / ⏸ Pause | 启动 / 暂停自动步进 |
| Step | 暂停时推进一步 |
| Clear | 清空整盘，Gen 归零 |
| 🎲 Random | 重新随机分布整盘（密度 28%），Gen 归零 |
| Wrap: ON / OFF | 切换 toroidal 边界（ON = 邻居查询环绕；OFF = 边界格邻居不足时视为死亡） |
| Speed +/- | 1-30 fps 步进速度 |
| Rows +/- | 网格行数 10-120 |
| Cols +/- | 网格列数 10-120 |
| Reset | 暂停 + 清空 + Gen=0 |

### 康威规则

- 活细胞 + 2 或 3 活邻居 → 活
- 活细胞 + 其他数量邻居 → 死（< 2 underpopulation, > 3 overpopulation）
- 死细胞 + 恰好 3 活邻居 → 活（reproduction）
- 死细胞 + 其他数量邻居 → 死

### Wrap 语义

- **Wrap ON**（默认）：行 / 列索引 `(r + rows) % rows` / `(c + cols) % cols` 环绕；toroidal 拓扑，glider 持续向右下漂。
- **Wrap OFF**：行 / 列越界时跳过该邻居计数；boundary 越界的格邻居数自然 < 3，更容易"饿死"。

---

## 代码结构

```
React state
  ├─ rows, cols          (驱动 useEffect 重跑)

useEffect([rows, cols])
  ├─ startPixiApp((proxy) => {
  │    ├─ controlRegion = proxy.createRegion(0,0,W,controlH=100)
  │    │    ├─ Title "Conway's Game of Life"
  │    │    ├─ Gen / Pop counter
  │    │    ├─ Play/Pause 按钮 (PIXI 容器, internal text node)
  │    │    ├─ Step / Clear / Random 按钮 (PIXI makeButton)
  │    │    ├─ Wrap toggle (PIXI 容器, internal text node)
  │    │    ├─ Speed / Rows / Cols stepper (PIXI makeStepper)
  │    │    └─ Reset 按钮
  │    ├─ gridRegion = proxy.createRegion(0,controlH,W,H-controlH)
  │    │    ├─ gridBgRect (PIXI.Graphics, 0x0a0a14 黑底)
  │    │    ├─ gridBg (PIXI.Graphics, 0.5px 网格线, cellSize<6 时不画)
  │    │    ├─ cellsGraphics (PIXI.Graphics, redraw 整盘, fill 0x88aaff)
  │    │    ├─ onPress → 坐标反算 → toggle grid[i] → drawCells + updateStats
  │    │    └─ ticker.add(tickFn) → playing 时按 speed 间隔调 doStep
  │    └─ return cleanup → ticker.remove(tickFn)
  └─ cleanup → destroyApp()
```

---

## 关键设计

### 纯 PIXI UI（用户明确要求）

**禁止**：`<button>` / `<input>` / `<div onClick>` / React state 驱动 UI / CSS tooltip / HTML overlay。

**允许**：`PIXI.Container` 包 `PIXI.Graphics`（圆角矩形按钮底）+ `PIXI.Text`（按钮文字）+ `eventMode='static'` + `hitArea` + `pointerdown` 监听。Stepper 用 +/- 按钮 + 内部 text 节点，**值变更**通过回调注入 React state。

- `makeButton(label, w, h, onClick, bg)`：返回完整可点击的 `PIXI.Container`。
- `makeStepper(label, value, onChange, min, max)`：返回 label + 三个子节点（minus / value / plus），回调调 `onChange(newValue)`。
- `makePlayPauseButton` / `makeWrapToggle`：状态依赖 UI 文本，复用 `PIXI.Text.text` setter 直接改文字，不重建 container。

### 渲染：单 Graphics + 一次 fill

```ts
function drawCells() {
  cellsGraphics.clear();
  cellsGraphics.fill({ color: CELL_COLOR });
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[idx(r, c, cols)]) {
        cellsGraphics.rect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }
}
```

- 2400 cells (60x40) 用一个 `PIXI.Graphics` 渲染 vs 2400 个 `PIXI.Container` —— **drastically less draw call**，单 Graphics 一条 fill call 出全部活格。
- `Uint8Array` flat buffer 比 `number[][]` 节省内存（60x40 = 2400 bytes vs ~30KB+），neighbor count 缓存友好（连续字节访问）。
- 网格线 `drawGridBg` 单独一个 Graphics：`cellSize < 6` 时不画线（避免视觉噪点 + 减少 stroke 节点数）。
- 死格底色 `gridBgRect` 单独一个 Graphics（不参与 redraw）。

### 步进 + ticker

```ts
const ticker = gridRegion.ticker;
const tickFn = () => {
  if (!playing) return;
  const now = performance.now();
  const interval = 1000 / speed;
  if (now - lastStepTime >= interval) {
    doStep();
    lastStepTime = now;
  }
};
ticker.add(tickFn);
return () => { ticker.remove(tickFn); };
```

- 60fps ticker 但只在 `now - lastStepTime >= 1000/speed` 时步进，1-30 fps 可调。
- 不在 `useEffect` cleanup 里 remove（`destroyApp` 会销毁 ticker），**额外**返回 onReady 的 cleanup 显式 remove —— 防止 React 19 Strict Mode 双 mount / 重连场景下 ticker callback 累积。
- `lastStepTime` 闭包变量，Play 时重置避免暂停后第一帧立刻步进两次。

### cellSize 自适应

```ts
const availW = gridRegion.bounds.width - 24;
const availH = gridRegion.bounds.height - 24;
cellSize = Math.max(2, Math.floor(Math.min(availW / cols, availH / rows)));
const gridW = cols * cellSize;
const gridH = rows * cellSize;
gridOX = Math.floor((gridRegion.bounds.width - gridW) / 2);
gridOY = Math.floor((gridRegion.bounds.height - gridH) / 2);
```

- 网格长宽比不同时，cell 是长方形（与 2048 同理）。
- 网格总尺寸 ≤ availW × availH，左右上下居中（gridOX/gridOY 计算）。
- 极小 cell（< 6px）隐藏网格线但保留 cell 渲染。

### Stepper 调 React state → useEffect 重跑

Speed / Rows / Cols stepper 的 +/- 按钮调 `setRows` / `setCols` / `speed = v`：
- **Speed** 不在 React state：在 useEffect 闭包里直接赋值 `speed = v`，不触发 useEffect 重跑（避免销毁整个 PIXI 应用）。
- **Rows / Cols** 在 React state：调 `setRows` / `setCols` 触发 `useEffect([rows, cols])` 重跑 → 销毁当前 PIXI 应用 → 新尺寸下重建网格。这是已知开销，与 2048 一致。

如果将来要优化 Rows / Cols（避免销毁应用），可以把 rows/cols/speed 都放进闭包、改用 `useRef` 保存 + 整盘重建（不销毁 app），但会显著复杂化 cleanup 路径。

### Random 密度

`DEFAULT_DENSITY = 0.28`：经验值，太低（< 0.1）开局就死光一片，太高（> 0.5）开局就静态堆叠。28% 是康威社区常引用的"稳定 + 演化"甜点。

### Gen / Pop 计数器

- `Gen` 每次 `doStep` +1，Clear/Reset/Random 归零。
- `Pop` = `countLive(grid)`，每次 redraw 完调 `updateStats()` 重算。
- `countLive` 简单 for 循环，60x40 = 2400 字节扫描 < 50µs，零成本。

---

## 点击 toggle 单格

```ts
gridRegion.onPress((e) => {
  const localX = e.x - gridOX;
  const localY = e.y - gridOY;
  if (localX < 0 || localY < 0) return;
  if (localX >= cols * cellSize || localY >= rows * cellSize) return;
  const c = Math.floor(localX / cellSize);
  const r = Math.floor(localY / cellSize);
  if (r < 0 || r >= rows || c < 0 || c >= cols) return;
  const i = idx(r, c, cols);
  grid[i] = grid[i] ? 0 : 1;
  drawCells();
  updateStats();
});
```

- 坐标反向映射：screen 坐标 → grid 局部坐标 → cell 索引。
- 越界守卫四道（负坐标 / 超过 grid 尺寸 / r/c 范围），防 onPress 来自 gridRegion 但 hit 在 padding 上。
- 跟"在网格上画图案"等价，单格 toggle 是最简单的"画"。

### 拖动画线

当前实现只支持**单格 toggle**。如需"按住拖动连续画"，加 `gridRegion.onMove(...)` 监听并判断 `e.buttons & 1`（左键按下）→ 在 move 里 toggle。但默认关闭以避免误触（用户想 scroll 整个 app 时 onMove 不会被 swallow，因为 SubCanvas 自己的 event 路由）。

---

## Wrap toggle 的 UI 状态

`wrap` 是 `boolean` 闭包变量。`wrapText.text` 直接 setter 改文字，**不重建 wrapBtn container**：

```ts
function updateWrapLabel() {
  if (wrapText) wrapText.text = wrap ? 'Wrap: ON' : 'Wrap: OFF';
}
```

同理 Play/Pause 按钮的 `playPauseText` 也是闭包外层的 Text 引用，doPlayPause 里只改 `.text`。

---

## 已知约束

- **60x40 default → 2400 cells**。120x120 = 14400 cells，单 fill call 仍然 OK（PIXI v8 单 fill 可以容纳 10k+ rects）。更大请调 Rows/Cols stepper 上限或调低 DEFAULT_ROWS/COLS。
- **gridBgRect 不参与 redraw**：因为整盘 clear 之前 gridBgRect 是死的（被 cellsGraphics 覆盖），但 clear 之后所有活格会重画。gridBgRect 留在 stage 充当底色，万一 cell 渲染漏格不会看到透到 stage 背景。
- **Speed 改值不触发 useEffect 重跑**：直接改 `speed` 闭包变量。`lastStepTime` 不重置，新速度下次 ticker tick 时自动生效。
- **Play 时点格子依然生效**：玩家可以一边 auto-step 一边手动 toggle。`grid` 数组是同一份引用，没有 race。
- **没接 createWindow / createConfirm / createBus**：本例专注 SubCanvas + 纯 PIXI UI 模式，未引入上层 components 包。
- **没接 AnimationTicker / 没插值 / 没有"细胞出生 / 死亡"过渡动画**：ticker 触发的是 sim step（CPU 端逻辑），不是 tween。如果要"细胞死亡时渐变 fade out"，需要在 step 后保留 prevGrid + 双 Graphics 插值（复杂度 +200 行，谨慎加）。

---

## 性能特征

- **CPU 步进**：60x40 = 2400 cells × 8 neighbor 查询 = 19200 字节读 / 2400 字节写 per step。V8 JIT 跑 < 1ms。120x120 = 14400 cells × 8 = 115200 字节读 / 14400 字节写 ≈ 5ms。30 fps 下 5ms/frame 仍留 28ms 给 render。
- **GPU 渲染**：单 Graphics fill + clear 调用 = 1 draw call。ticker 60fps 也只在 step 时 redraw，playing 时实际 draw 频率 = speed（1-30 fps）。静止时 0 draw。
- **内存**：Uint8Array 2400 字节 + 3 PIXI.Graphics 实例 + 1 PIXI.Text 实例（Gen / Pop 共享 font/style）。

---

## 未来扩展点

- **细胞出生 / 死亡动画**：保留 prevGrid + prevCellsGraphics + currCellsGraphics，step 时渐变 lerp alpha 0→1 / 1→0
- **拖动画线**：`gridRegion.onMove` + `e.buttons & 1` 守卫，连续 toggle
- **Pattern 预设按钮**：内置 glider / blinker / gosper glider gun / pulsar / pentadecathlon / LWSS 等经典 pattern 的位图，paste 到网格中央
- **历史最高 Gen / Pop**：`localStorage` 存 best
- **导出 / 导入 RLE**：康威社区标准 RLE 格式可读可写
- **Hashlife 算法**：超大网格 + 超长周期步进的 O(log n) 算法
- **Mosaic 渲染**：每个 cell 用独立 PIXI.Sprite，可以加 hover 高亮 / 选中范围 / 染色
- **多色规则**（HighLife / Day&Night / Wireworld）：参数化规则 + 颜色映射
- **接入 `createBus` 事件总线**：emit `'conway:step' { gen, pop }` 供其他 component 订阅，做仪表盘 / 折线图
