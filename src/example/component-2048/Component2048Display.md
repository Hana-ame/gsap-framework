# Component2048Display — 2048 swipe game

`src/example/component-2048/Component2048Display.tsx` 的对应文档。

---

## 职责

经典 2048 滑块合并游戏。玩家通过 **触屏滑动**（或键盘）将方块朝指定方向滑动，相同数字的方块相撞合并，数字相加。游戏持续到无空位且无相邻同值方块。**棋盘行数和列数可在 3-10 范围内自定义**。

API 建立在 SubCanvas 之上：棋盘用 `SubCanvas.onPress` + `onRelease` 测 swipe；控制面板用 `SubCanvas` 的 pointer event 测 button click。

---

## 玩法

| 输入 | 行为 |
|---|---|
| 上滑 (dy < -20px) | 棋盘上移，所有方块向顶部合并 |
| 下滑 (dy > +20px) | 棋盘下移，所有方块向底部合并 |
| 左滑 (dx < -20px) | 棋盘左移，所有方块向左侧合并 |
| 右滑 (dx > +20px) | 棋盘右移，所有方块向右侧合并 |
| 键盘 `↑/W` `↓/S` `←/A` `→/D` | 同上（桌面端调试用） |
| 触屏点击 (|dx|, |dy| < 20px) | 不触发任何移动 |
| 棋盘外点击 (Rows/Cols +/- / Reset) | 调整棋盘尺寸或重置游戏 |

- **手势判定阈值 20px**：小于此值视为点击，不触发移动；大于则取 dx/dy 绝对值较大的轴为方向。
- **合并规则**：每条线先压缩去零（`shiftLine`），再从前向后两两合并；合并后产生的零位补齐。
- **Spawn 规则**：每次成功移动后，在随机空格生成 `2`（90% 概率）或 `4`（10% 概率）。
- **Game Over**：棋盘满（无 `0`）且每行每列无相邻同值方块。

---

## 棋盘尺寸自定义

- 默认 `4 × 4`。
- `MIN_DIM = 3`, `MAX_DIM = 10`（仅暴露在源码常量，未做运行时检查；按钮 +/- 已 clamp）。
- Rows 与 Cols 独立调整。改 Rows 或 Cols 会触发 React `useEffect([rows, cols])` 重跑 → 销毁当前 PIXI 应用 → 新尺寸下重建棋盘。
- 调小时按当前最大可放区域自适应（`cellW = cellH = floor((availW/H - GAP×(dim+1)) / dim)`，其中 `dim = max(rows, cols)`）保证棋盘不超出可视区。

---

## 代码结构

```
React state
  ├─ rows, cols    (驱动 useEffect 重跑)
  └─ 其余 board / score / gameOver 全在 useEffect 闭包内

useEffect([rows, cols])
  ├─ startPixiApp((proxy) => {
  │    ├─ controlRegion = proxy.createRegion(0,0,W,controlH=110)
  │    │    ├─ Title "2048" + SCORE 面板
  │    │    ├─ Rows +/- stepper (调用 setRows)
  │    │    ├─ Cols +/- stepper (调用 setCols)
  │    │    └─ Reset 按钮 (清空 board 重置 score/gameOver)
  │    ├─ boardRegion = proxy.createRegion(0,controlH,W,H-controlH)
  │    │    ├─ boardBg (PIXI.Graphics 网格背景)
  │    │    ├─ tileNodes[r][c] (每格一个 PIXI.Container, 内含 Graphics+Text)
  │    │    ├─ onPress → 记 pressStart
  │    │    └─ onRelease → 计算 dx/dy → tryMove(dir)
  │    └─ window.addEventListener('keydown', onKey) (调试用)
  └─ renderTiles()   (board 首次 + 重置时调用)
     updateTiles()   (每次 move 后调用, 原地更新现有节点避免重建成本)

cleanup → keyCleanups.forEach(remove) + destroyApp()
```

---

## 关键设计

- **board / score / gameOver 在闭包内**：高频更新（每次 swipe）的状态走 PIXI 原生 `Text.text` 直接改属性，避免 React 每次 re-render。
- **rows / cols 在 React state**：低频配置变更，触发 `useEffect` 重跑是合理的（PIXI 应用整体销毁重建）。
- **`renderTiles` vs `updateTiles`**：`renderTiles` 第一次 + 重置时清空整棵 stage 子树并重建（grid 尺寸可能变了）；`updateTiles` 保留 `tileNodes[r][c]` 的 PIXI.Container 实例，只换内部 Graphics + Text 子节点，避免不必要的创建/销毁。
- **PIXI 控件捕获 React setter**：Rows/Cols stepper 的 +/- 按钮在 `useEffect` 内创建时闭包捕获 `setRows` / `setCols`。点击调 setter → React 排队 re-render → useEffect cleanup + 重跑 → 旧 PIXI 应用销毁 → 新应用就位。
- **Reset 与 Rows/Cols 共享一个 useEffect 路径**：Reset 只清 board/score/gameOver，不改 rows/cols，不触发 effect 重跑，所以走的是 `updateTiles` + 清除 `gameOverOverlay`，比改尺寸便宜。
- **不暴露 4 行/列/8 行/列的预置按钮**：用户明确要求"自定义长宽"，所以走 +/- stepper 而非 preset。如果将来要加 preset，逻辑是 `setRows(n); setCols(m);` 同时改两 state。
- **tile 颜色按 2048 原版 (Gabriele Cirulli)**：空 `cdc1b4`，2/4 浅米色，8/16/32/64 橙红系，128+ 金色系，>2048 黑底白字（`TILE_SUPER_BG / TILE_SUPER_FG`）。
- **scoreText 直接 `text` 属性赋值**：不重建 PIXI.Text，零分配。

---

## 触屏 swipe 检测算法

```ts
let pressStart: { x: number; y: number } | null = null;

boardRegion.onPress((e) => {
  pressStart = { x: e.x, y: e.y };
});

boardRegion.onRelease((e) => {
  if (!pressStart) return;
  const dx = e.x - pressStart.x;
  const dy = e.y - pressStart.y;
  pressStart = null;
  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    tryMove(dx > 0 ? 'right' : 'left');
  } else {
    tryMove(dy > 0 ? 'down' : 'up');
  }
});
```

`SWIPE_THRESHOLD = 20` px — 小于此值的 pointer up 视为"轻点"，不触发移动。这避免了"用户想点 Reset 按钮但同时被判为 swipe"的歧义（因为控制面板区域不挂 onPress/onRelease，所以 boardRegion 的事件不会因 button 点击触发）。

---

## Game Over 行为

- 检测：`isGameOver(board)` 在 `tryMove` 内部、spawn 之后调用。
- 表现：在 `boardRegion.stage` 上叠加一个 `Graphics` 半透明黑色蒙层（覆盖整个 board 区域） + "Game Over" 标题 + "Final: N" 副标题。
- 解除：点 Reset 按钮。
- 注意：Game Over 后 `tryMove` 直接 return，不会再生成新 tile，所以棋盘定格。

---

## 已知约束

- **Tiles 是 PIXI.Container 节点树，不是合并/滑动动画**：每次 move 直接 `updateTiles` 替换 Graphics+Text。如果将来要做 2048 原版那种"先滑再合并"的两阶段动画，需要把 move 拆成 `slide` + `merge` 两步并加 ticker。
- **非正方形棋盘（rows ≠ cols）下 tile 是非正方形**：当前用 `max(rows, cols)` 算 cellW = cellH，等比缩进，非正方形 board 时 tile 也跟着变形。如果要保持 tile 正方形，需要再乘 `cols/dim` 或 `rows/dim`。
- **没有 Undo / 没有 Best Score 持久化**：纯本地内存状态。
- **没接 createWindow / createConfirm**：本例专注 SubCanvas swipe + PIXI 渲染，未引入上层 `components` 包。

---

## 未来扩展点

- 滑块动画（每帧 lerp position / scale，0.12s easing）
- 撤销一步（保存 prevBoard + prevScore，分配一个 undo button）
- 历史最高分（`localStorage`）
- `createWindow` 包装版（顶部加可拖动 chrome）
- `createConfirm` 重启确认（Game Over 后点 "New Game" 弹 confirm）
