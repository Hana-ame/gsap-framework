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
| Rows +/- | 网格行数 10-120（**不死 canvas**） |
| Cols +/- | 网格列数 10-120（**不死 canvas**） |
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

## 代码结构（两段 useEffect 模式）

```ts
React state
  ├─ rows, cols         (驱动 [rows, cols] effect 重跑内容；不销毁 app)
  └─ refsRef = useRef<ConwayRefs>  (所有 mutable state + PIXI refs)

useEffect([])                                  // 只跑一次：mount 创建 / unmount 销毁
  ├─ refsRef.current = makeInitialRefs(rows, cols, W, H, setRows, setCols)
  ├─ const destroyApp = startPixiApp((proxy) => {
  │    refs.controlRegion = proxy.createRegion(0, 0, W, 100)
  │    refs.gridRegion = proxy.createRegion(0, 100, W, H - 100)
  │    rebuildBoard(refs)                     // 第一次构建
  │  })
  └─ return cleanup → unregisterTicker + keyCleanups.forEach + destroyApp()

useEffect([rows, cols])                        // rows/cols 变化时只重建内容
  ├─ refs.rows = rows; refs.cols = cols
  ├─ refs.grid = newGrid(rows, cols, 'random')
  ├─ rebuildBoard(refs)                       // 不调 destroyApp，canvas 活着
  └─ (无 cleanup —— 内容重建在 effect 内同步完成)

rebuildBoard(refs)
  ├─ clearRegion(refs.controlRegion) + clearRegion(refs.gridRegion)
  ├─ nullify 所有 PIXI refs (cellsGraphics / gridBg / genText / popText / etc.)
  ├─ unregisterTicker(refs)                   // 移除旧 tickFn
  ├─ buildControlPanel(refs)                  // 重建 title / counters / buttons / steppers
  ├─ buildGrid(refs)                          // 重建 gridBgRect / gridBg / cellsGraphics + onPress
  ├─ registerTicker(refs)                     // 新 tickFn 注册到 rootApp.ticker
  └─ updateStats / updatePlayPauseLabel / updateWrapLabel
```

---

## 关键设计

### ConwayRefs 容器（必须）

```ts
interface ConwayRefs {
  // layout
  W: number; H: number; rows: number; cols: number;
  cellSize: number; gridOX: number; gridOY: number;
  // sim state
  grid: Grid; generation: number; playing: boolean;
  speed: number; wrap: boolean; lastStepTime: number;
  // PIXI objects
  controlRegion: SubCanvas | null;
  gridRegion: SubCanvas | null;
  cellsGraphics: PIXI.Graphics | null;
  gridBg: PIXI.Graphics | null;
  gridBgRect: PIXI.Graphics | null;
  genText: PIXI.Text | null;
  popText: PIXI.Text | null;
  playPauseText: PIXI.Text | null;
  wrapText: PIXI.Text | null;
  // ticker plumbing
  ticker: PIXI.Ticker | null;
  tickFn: (() => void) | null;
  keyCleanups: Array<() => void>;
  // React setters (for stepper -> state bridge)
  setRows: (n: number) => void;
  setCols: (n: number) => void;
}
```

`refsRef = useRef<ConwayRefs>` 在组件顶部。**所有** mutable state 都放进 refs，**不**用 `useState`——因为 state 变化触发 effect 重跑，会破坏两段 useEffect 模式。

所有事件 handler / ticker callback 闭包捕获 `refs` 引用，操作 `refs.grid` / `refs.playing` / `refs.speed` 等。React 不参与热路径（点击 toggle、tickFn doStep 都直接读 refs）。

### 两段 useEffect 模式（消除闪烁）

**第一段 `useEffect([])`**：
- 创建 PIXI app（一次 mount / 一次 unmount）
- 初始化 refs
- 在 onReady callback 里创建 controlRegion + gridRegion + 调 `rebuildBoard(refs)`
- cleanup 调 `destroyApp()` + `unregisterTicker` + 移除 window 监听

**第二段 `useEffect([rows, cols])`**：
- 同步 `refs.rows / refs.cols / refs.grid / refs.generation`
- 调 `rebuildBoard(refs)` —— **`destroyApp` 不调**
- `rebuildBoard` 内部 `clearRegion` 两个 SubCanvas 的 stage children、nullify refs、重建内容、重新注册 ticker

**为什么这消除闪烁**：rows/cols 变化时 canvas + ticker + app 不被销毁重建，只是 content 替换。1-2 帧空窗消失。**反面教材**（conway 第一版）：`useEffect([rows, cols]) { ... destroyApp() }` 单段模式，stepper +/- 触发 canvas 销毁+重建 → 用户看到闪一下。

详见 `README.md` gotcha "配置变更（`useEffect([...])`）destroyApp + startPixiApp = 闪烁 1-2 帧"。

### 纯 PIXI UI（用户明确要求）

**禁止**：`<button>` / `<input>` / `<div onClick>` / React state 驱动 UI / CSS tooltip / HTML overlay。

**允许**：`PIXI.Container` 包 `PIXI.Graphics`（圆角矩形按钮底）+ `PIXI.Text`（按钮文字）+ `eventMode='static'` + `hitArea` + `pointerdown` 监听。Stepper 用 +/- 按钮 + 内部 text 节点，**值变更**通过回调注入 React state。

- `makeButton(label, w, h, onClick, bg)`：返回完整可点击的 `PIXI.Container`。
- `makeStepper(label, value, onChange, min, max)`：返回 label + 三个子节点（minus / value / plus），回调调 `onChange(newValue)`。
- **Speed stepper** 的 onChange 直接写 `refs.speed = v`，不调 React state（避免 60fps ticker 路径被 React scheduler 干扰）。
- **Rows / Cols stepper** 的 onChange 调 `refs.setRows(v)` / `refs.setCols(v)`，触发 `[rows, cols]` effect 重建内容。

### 渲染：单 Graphics + 一次 fill（batch commit 模式）

```ts
function drawCells(refs: ConwayRefs): void {
  if (!refs.cellsGraphics) return;
  refs.cellsGraphics.clear();
  for (let r = 0; r < refs.rows; r++) {
    for (let c = 0; c < refs.cols; c++) {
      if (refs.grid[idx(r, c, refs.cols)]) {
        refs.cellsGraphics.rect(c * refs.cellSize, r * refs.cellSize, refs.cellSize, refs.cellSize);
      }
    }
  }
  refs.cellsGraphics.fill({ color: CELL_COLOR });
}
```

- 2400 cells (60x40) 用一个 `PIXI.Graphics` 渲染 vs 2400 个 `PIXI.Container` —— **drastically less draw call**，单 Graphics 一条 fill call 出全部活格。
- `Uint8Array` flat buffer 比 `number[][]` 节省内存（60x40 = 2400 bytes vs ~30KB+），neighbor count 缓存友好（连续字节访问）。
- 网格线 `drawGridBg(refs)` 单独一个 Graphics：`cellSize < 6` 时不画线（避免视觉噪点 + 减少 stroke 节点数）。
- 死格底色 `gridBgRect` 单独一个 Graphics（不参与 redraw）。

#### ⚠️ fill-first 死路（v8 行为变更，conway 黑屏根因）

PIXI v8 的 `fill()` / `stroke()` 是**"对当前已定义路径生效"**的操作。在 v7 是立即模式（`beginFill` 立即着色），v8 改成路径构建模式。

**错**（conway 第一版踩坑）：
```ts
graphics.clear();
graphics.fill({ color: 0x88aaff });   // ❌ no-op: path 为空，fill 状态未生效
for (...) graphics.rect(...);           // rect 拿到 path 但没拿到 fill
```

**对**（batch commit）：
```ts
graphics.clear();
for (...) graphics.rect(...);           // 加 path
graphics.fill({ color: 0x88aaff });   // ✅ 一次性提交整条 path
```

**对比 2048**：用 `new Graphics().roundRect(...).fill(...)` 链式，`roundRect` 在 `fill` 之前已经把 path 加上了——天然规避。详见 `README.md` PIXI v8 坑 "Graphics fill()/stroke() 是路径提交"。

### 步进 + ticker

```ts
function registerTicker(refs: ConwayRefs): void {
  if (!refs.gridRegion) return;
  refs.ticker = refs.gridRegion.ticker;
  refs.tickFn = () => {
    if (!refs.playing) return;
    const now = performance.now();
    const interval = 1000 / refs.speed;
    if (now - refs.lastStepTime >= interval) {
      doStep(refs);
      refs.lastStepTime = now;
    }
  };
  refs.ticker.add(refs.tickFn);
}
```

- 60fps ticker 但只在 `now - lastStepTime >= 1000/speed` 时步进，1-30 fps 可调。
- `tickFn` 引用存在 `refs.tickFn`，第二段 useEffect 重建内容时通过 `unregisterTicker` 显式 remove + 重新 add，**不会**累积。
- `lastStepTime` 在 `doPlayPause` 切到 playing 时重置，避免暂停后第一帧立刻步进两次。

### cellSize 自适应

```ts
const availW = region.bounds.width - 24;
const availH = region.bounds.height - 24;
refs.cellSize = Math.max(2, Math.floor(Math.min(availW / refs.cols, availH / refs.rows)));
const gridW = refs.cols * refs.cellSize;
const gridH = refs.rows * refs.cellSize;
refs.gridOX = Math.floor((region.bounds.width - gridW) / 2);
refs.gridOY = Math.floor((region.bounds.height - gridH) / 2);
```

- 网格长宽比不同时，cell 是长方形。
- 网格总尺寸 ≤ availW × availH，左右上下居中（gridOX/gridOY 计算）。
- 极小 cell（< 6px）隐藏网格线但保留 cell 渲染。

### Random 密度

`DEFAULT_DENSITY = 0.28`：经验值，太低（< 0.1）开局就死光一片，太高（> 0.5）开局就静态堆叠。28% 是康威社区常引用的"稳定 + 演化"甜点。

### Gen / Pop 计数器

- `Gen` 每次 `doStep` +1，Clear/Reset/Random 归零。
- `Pop` = `countLive(refs.grid)`，每次 redraw 完调 `updateStats(refs)` 重算。
- `countLive` 简单 for 循环，60x40 = 2400 字节扫描 < 50µs，零成本。

---

## 点击 toggle 单格

```ts
region.onPress((e) => {
  const localX = e.x - refs.gridOX;
  const localY = e.y - refs.gridOY;
  if (localX < 0 || localY < 0) return;
  if (localX >= refs.cols * refs.cellSize || localY >= refs.rows * refs.cellSize) return;
  const c = Math.floor(localX / refs.cellSize);
  const r = Math.floor(localY / refs.cellSize);
  if (r < 0 || r >= refs.rows || c < 0 || c >= refs.cols) return;
  const i = idx(r, c, refs.cols);
  refs.grid[i] = refs.grid[i] ? 0 : 1;
  drawCells(refs);
  updateStats(refs);
});
```

- 坐标反向映射：screen 坐标 → grid 局部坐标 → cell 索引。
- 越界守卫四道（负坐标 / 超过 grid 尺寸 / r/c 范围），防 onPress 来自 gridRegion 但 hit 在 padding 上。
- 跟"在网格上画图案"等价，单格 toggle 是最简单的"画"。

### 拖动画线

当前实现只支持**单格 toggle**。如需"按住拖动连续画"，加 `region.onMove(...)` 监听并判断 `e.buttons & 1`（左键按下）→ 在 move 里 toggle。但默认关闭以避免误触。

---

## Wrap / Play-Pause 的 UI 状态

`refs.wrap` / `refs.playing` 是 refs 里的 boolean。`wrapText.text` / `playPauseText.text` 直接 setter 改文字，**不重建 wrapBtn / playPauseBtn container**：

```ts
function updateWrapLabel(refs: ConwayRefs): void {
  if (refs.wrapText) refs.wrapText.text = refs.wrap ? 'Wrap: ON' : 'Wrap: OFF';
}
function updatePlayPauseLabel(refs: ConwayRefs): void {
  if (refs.playPauseText) refs.playPauseText.text = refs.playing ? '\u23F8  Pause' : '\u25B6  Play';
}
```

---

## 已知约束

- **60x40 default → 2400 cells**。120x120 = 14400 cells，单 fill call 仍然 OK（PIXI v8 单 fill 可以容纳 10k+ rects）。更大请调 Rows/Cols stepper 上限或调低 DEFAULT_ROWS/COLS。
- **gridBgRect 不参与 redraw**：因为整盘 clear 之前 gridBgRect 是死的（被 cellsGraphics 覆盖），但 clear 之后所有活格会重画。gridBgRect 留在 stage 充当底色，万一 cell 渲染漏格不会看到透到 stage 背景。
- **Speed 改值不触发 React 重跑**：直接写 `refs.speed` 字段。`lastStepTime` 不重置，新速度下次 ticker tick 时自动生效。
- **Play 时点格子依然生效**：玩家可以一边 auto-step 一边手动 toggle。`refs.grid` 是同一份 Uint8Array 引用，没有 race。
- **没接 createWindow / createConfirm / createBus**：本例专注 SubCanvas + 纯 PIXI UI 模式，未引入上层 components 包。
- **没接 AnimationTicker / 没插值 / 没有"细胞出生 / 死亡"过渡动画**：ticker 触发的是 sim step（CPU 端逻辑），不是 tween。如果要"细胞死亡时渐变 fade out"，需要在 step 后保留 prevGrid + 双 Graphics 插值（复杂度 +200 行，谨慎加）。
- **rows/cols 极端值（120x120）下 rebuildBoard 单次重建内容**耗时 < 50ms（含 14400 cells 的 Uint8Array + 14400 rect 调用），但 cellSize 此时 = 2px，活格肉眼不易分辨。

---

## 性能特征

- **CPU 步进**：60x40 = 2400 cells × 8 neighbor 查询 = 19200 字节读 / 2400 字节写 per step。V8 JIT 跑 < 1ms。120x120 = 14400 cells × 8 = 115200 字节读 / 14400 字节写 ≈ 5ms。30 fps 下 5ms/frame 仍留 28ms 给 render。
- **GPU 渲染**：单 Graphics fill + clear 调用 = 1 draw call。ticker 60fps 也只在 step 时 redraw，playing 时实际 draw 频率 = speed（1-30 fps）。静止时 0 draw。
- **内存**：Uint8Array 2400 字节 + 3 PIXI.Graphics 实例 + ~10 PIXI.Text 实例（title / Gen / Pop / stepper values / etc.）。第一段 useEffect 一次性分配后跨 rows/cols 重建复用（rebuildBoard clearRegion + 重建 children，原 children 被 destroy）。

---

## 未来扩展点

- **细胞出生 / 死亡动画**：保留 prevGrid + prevCellsGraphics + currCellsGraphics，step 时渐变 lerp alpha 0→1 / 1→0
- **拖动画线**：`region.onMove` + `e.buttons & 1` 守卫，连续 toggle
- **Pattern 预设按钮**：内置 glider / blinker / gosper glider gun / pulsar / pentadecathlon / LWSS 等经典 pattern 的位图，paste 到网格中央
- **历史最高 Gen / Pop**：`localStorage` 存 best
- **导出 / 导入 RLE**：康威社区标准 RLE 格式可读可写
- **Hashlife 算法**：超大网格 + 超长周期步进的 O(log n) 算法
- **Mosaic 渲染**：每个 cell 用独立 PIXI.Sprite，可以加 hover 高亮 / 选中范围 / 染色
- **多色规则**（HighLife / Day&Night / Wireworld）：参数化规则 + 颜色映射
- **接入 `createBus` 事件总线**：emit `'conway:step' { gen, pop }` 供其他 component 订阅，做仪表盘 / 折线图
- **细胞 hover 信息**：加 `region.onMove` + raycast 命中 cell，HUD 显示该格当前 state + 邻居数 + 下一态预测
