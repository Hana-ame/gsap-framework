# 拖拽性能分析报告

分析范围：`src/framework/`、`src/components/`、`src/example/` 中涉及拖拽交互的所有模块。

---

## 一、框架层（src/framework）

### 1. SubCanvas.ts — `_installDragOnHandle`

| 项目 | 内容 |
|---|---|
| 触发频率 | 每次 `pointermove`（60–240 Hz） |
| 每帧操作 | `applyDrag` → `setPosition` → `updateMask`（Graphics redraw）+ `updateBgHitArea`（new Rectangle）+ `resizeListeners.forEach` |
| 集合遍历 | `resizeListeners` Set（通常 0–2 个 listener） |
| 创建/销毁 PIXI 对象 | 无（仅 Graphics `clear()`+`rect()`+`fill()`，无新对象） |
| 缓存/跳过 | `_syncing` 防重入；**无 position-change guard**（delta=0 也执行全部） |
| **结论** | 开销极低，O(1)，无优化必要 |

### 2. SubCanvasProxy.ts — `routePointer`

| 项目 | 内容 |
|---|---|
| 触发频率 | 每次 `pointermove` |
| 每帧操作 | 迭代 `topCanvases` 数组（通常 1–2 个）调用 `handlePointer` |
| 集合遍历 | 遍历 `topCanvases` |
| 缓存/跳过 | 无 |
| **结论** | 1–2 次迭代，不可优化 |

### 3. InfiniteCanvas.ts

| 项目 | 内容 |
|---|---|
| 触发频率 | 每次 `onMove`（drag 期间）+ 每帧 `onUpdate`（减速期间） |
| 每帧操作 | `onMove`：遍历 plugins（1–3 个）+ `_syncChunks`（Set 构建 + Map 遍历 + 创建/销毁 chunk）+ `_onDrag` 回调 |
| 集合遍历 | `_plugins` 数组（~2）、`_syncChunks` 内 chunk range 循环（9–25 个）+ `_chunks` Map |
| 创建/销毁 PIXI 对象 | **是** — 跨 chunk 边界时创建/销毁 `PIXI.Container`，且 `chunkCreate`/`chunkDestroy` 回调可做任意重量操作 |
| 缓存/跳过 | ✅ **`_lastChunkRange`** — 2026-07-19 新增，chunk 范围不变时跳过全部遍历 |
| **结论** | 原最重模块。`_lastChunkRange` 后，跨 chunk 才做全量 sync，拖拽中间大部分帧 O(1) |

### 4. EventBus.ts — `emit`

| 项目 | 内容 |
|---|---|
| 触发频率 | 取决于调用方，非连续 |
| 每帧操作 | 空 Set 检查 → 展开 Set 为数组 → `forEach` |
| 集合遍历 | listener Set |
| 缓存/跳过 | 空 Set 提前返回 |
| **结论** | 开销取决于 listener 数量（典型 < 5），无问题 |

### 5. PixiApp.ts / register-components.ts / component.ts / ui-helpers.ts / gsap-pixi.ts

全部不参与拖拽路径，无每帧操作。

---

## 二、组件层（src/components）

### 1. PixiWindow

| 项目 | 内容 |
|---|---|
| 拖拽方式 | SubCanvas `dragMode` 完全托管 |
| 每帧操作 | 无 |
| PIXI 创建/销毁 | 无 |
| **结论** | ✅ 无问题 |

### 2. PixiConfirm

| 项目 | 内容 |
|---|---|
| 拖拽方式 | SubCanvas `dragMode` 完全托管 |
| 每帧操作 | 无 |
| **结论** | ✅ 无问题 |

### 3. ClickableImage

| 项目 | 内容 |
|---|---|
| 拖拽方式 | 父窗口 `dragMode` 托管 |
| 每帧操作 | 无 |
| **结论** | ✅ 无问题 |

### 4. Scrollable

| 项目 | 内容 |
|---|---|
| 拖拽方式 | 自建 `applyDrag`（`pointermove` → `window.addEventListener('pointermove')` 双路） |
| 每帧操作 | `applyDrag` → `clamp()` + `sync()` → `content.x/y` + `updateScrollbar()`（Graphics `clear()`+`roundRect()`+`fill()`） |
| 集合遍历 | 无 |
| PIXI 创建/销毁 | 无（仅 scrollbar Graphics 重绘） |
| 缓存/跳过 | 4px `DRAG_THRESHOLD` 防误触 |
| **结论** | Graphics 重绘是 vertex buffer 更新，无 alloc，开销极低 |

### 5. FullscreenManager

无拖拽，不参与拖拽路径。

### 6. Loading / PixiImage / PixiVideoPlayer / Avd / TextInput

无拖拽。

---

## 三、Example 层（src/example）

### 1. component-infinite（纯 InfiniteCanvas）

| 项目 | 内容 |
|---|---|
| 每帧操作 | `onDrag` 回调更新 `PIXI.Text.text` |
| 集合遍历 | 无（`_lastChunkRange` 缓存后大部分帧跳过 `_syncChunks`） |
| **结论** | ✅ 已修复，仅 chunk 跨边界时有开销 |

### 2. component-window-canvas（Window + InfiniteCanvas）

| 项目 | 内容 |
|---|---|
| 每帧操作 | `onDrag` 回调更新 `PIXI.Text.text` |
| 集合遍历 | 同上 |
| **结论** | ✅ 已修复 |

### 3. component-tutorial（部分 InfiniteCanvas）

| 项目 | 内容 |
|---|---|
| 每帧操作 | 无 `onDrag` 回调 |
| **结论** | ✅ 无问题 |

### 4. component-life-map（自建 tile pan）

| 项目 | 内容 |
|---|---|
| 每帧操作 | `setWorldPos` → `worldContainer.x/y` + `updateCoords`（text 更新） |
| 集合遍历 | `updateTilePositions` 仅在跨 tile 边界时调用 |
| 缓存/跳过 | ✅ 已有 `cdxNew !== cdxOld` 判断，同 `_lastChunkRange` 模式 |
| **结论** | ✅ 无问题，设计正确 |

### 5. component-colony（自建 tile pan）

| 项目 | 内容 |
|---|---|
| 每帧操作 | `syncTiles` → Set 构建（9 个 key）+ 2 次遍历 + `worldContainer.x/y` + coordText |
| 集合遍历 | 每次拖拽都遍历 9 个 tile 的 Set 和 Map |
| 缓存/跳过 | ❌ **无 cache**，每次拖拽都重建 Set 和遍历 Map |
| PIXI 创建/销毁 | 跨 tile 边界时创建/销毁 `PIXI.Graphics`（flora + grid + background） |
| **结论** | 9 个 tile 的数据量极低，遍历开销 < 0.01ms。**不值得加缓存**。如果未来 tile 数量增大（100+），可参考 `_lastChunkRange` 模式加 range cache |

### 6. component-drawing（自由画线）

| 项目 | 内容 |
|---|---|
| 每帧操作 | `currentStroke.lineTo().stroke()` — 预期行为 |
| **结论** | 画图业务的必然开销，非 drag 性能问题 |

### 7. component-scrollable-image（自定义 scroll）

| 项目 | 内容 |
|---|---|
| 每帧操作 | `applyScroll` → `content.setPosition()` + `updateScrollbar()`（Graphics redraw） |
| **结论** | 同 Scrollable 组件，开销极低 |

### 8. component-picture-drag / component-single-window / component-multi-window / window / window-mobile / component-bus / component-registry / pixi-confirm

全部使用 SubCanvas `dragMode`，每帧无额外操作。**无问题**。

### 9. component-2048 / component-snake / component-tetris

Swipe 检测仅 `onRelease` 触发，不连续。**无问题**。

---

## 四、总结

### 严重问题（已修复）

| 模块 | 问题 | 修复 |
|---|---|---|
| `InfiniteCanvas._syncChunks` | 每次 `onMove` 都遍历全部 chunk（9–25 个）| `_lastChunkRange` cache：chunk 范围不变直接 return |
| `DeceleratePlugin.onUp` | 最后两帧采样算速度，鼠标停住后松手仍有惯性 | 用 50ms 时间窗口 + `_lastMoveTime` 检测 |

### 无问题

所有 framework 基础模块（SubCanvas、EventBus、PixiApp）、所有 components（PixiWindow、PixiConfirm、Scrollable 等）、以及除上述两个 bug 外的所有 example，拖拽路径均为 O(1) 或极小数据量的 O(n)（n < 10），不可优化或不值得优化。

### 未来关注点

- `component-colony`：如果 `VISIBLE_TILES` 从 3 增长到 10+，`syncTiles` 的 range cache 会变得有价值。目前 9 个 tile 不值得。
- `SubCanvas.applyDrag`：没有 position-change guard，delta=0 时也执行 `setPosition`（包含 Graphics redraw + Rectangle alloc）。实践中 delta=0 极少发生，但可考虑加个极简 guard。
