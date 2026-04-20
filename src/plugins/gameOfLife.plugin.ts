// ============================================================
// 文件: src/plugins/gameOfLife.plugin.ts
// 用途: 实现康威生命游戏（Conway's Game of Life）。
//       管理细胞网格、自动演化、手动步进、点击切换细胞状态。
//       边界处理为环形（上下相连，左右相连）。
// 上下文: 注册到 PixiController 中，由消息触发。
//        需要配合 GameController 发送控制消息和点击事件。
//
// 处理逻辑:
// 1. 插件监听以下消息类型：
//    - 'gameOfLife/start' : 开始自动演化（每200ms一代）
//    - 'gameOfLife/pause' : 暂停自动演化
//    - 'gameOfLife/step'  : 立即执行一代演化
//    - 'gameOfLife/toggleCell' : 根据坐标切换对应细胞生死状态
//    - 'clear'           : 清空所有细胞（全部死亡）
// 2. 使用 WeakMap 以 app 实例为键存储每个画布的状态，包括：
//    - grid: 二维布尔数组表示细胞状态
//    - rows/cols: 网格行列数（固定40x30，单元格20x20）
//    - graphics: PIXI.Graphics 用于绘制网格
//    - running: 是否正在自动演化
//    - lastUpdateTime: 上次演化时间戳（用于控制帧率）
//    - updateInterval: 演化间隔（毫秒，默认200）
//    - tickerCallback: 注册到 app.ticker 的回调
// 3. 演化规则（康威生命游戏标准规则）：
//    - 活细胞：邻居 <2 或 >3 死亡，2或3存活
//    - 死细胞：邻居 ==3 复活
// 4. 边界处理：使用取模实现环形连接（i+rows)%rows, (j+cols)%cols
// 5. 绘图：每个细胞绘制一个矩形，活细胞填充白色，死细胞仅绘制灰色边框。
//
// 使用方法:
//   import { gameOfLifePlugin } from './plugins/gameOfLife.plugin';
//   controller.registerPlugin(gameOfLifePlugin);
//
//   // 控制命令示例：
//   controller.sendToPixi({ type: 'gameOfLife/start' });
//   controller.sendToPixi({ type: 'gameOfLife/pause' });
//   controller.sendToPixi({ type: 'gameOfLife/step' });
//   controller.sendToPixi({ type: 'gameOfLife/toggleCell', x: 100, y: 150 });
//   controller.sendToPixi({ type: 'clear' }); // 清空网格
//
// 注意事项:
//   - 网格大小固定为 40列×30行，单元格 20×20 像素，适配 800x600 画布。
//   - 如果 app 实例未设置，插件自动忽略消息。
//   - 自动演化使用 app.ticker 控制帧率，暂停时 ticker 仍然运行，但跳过演化。
//   - 收到 clear 消息时，会停止演化并重置所有细胞为死亡。
// ============================================================

import { PixiPlugin } from './plugin.types';
import * as PIXI from 'pixi.js';

/** 每个 app 实例对应的状态 */
interface GameOfLifeState {
  grid: boolean[][];               // 细胞网格，true=活，false=死
  rows: number;                     // 行数
  cols: number;                     // 列数
  cellSize: number;                 // 单元格边长（像素）
  graphics: PIXI.Graphics | null;   // 绘图对象
  running: boolean;                 // 是否正在自动演化
  lastUpdateTime: number;           // 上次演化时间戳（毫秒）
  updateInterval: number;           // 演化间隔（毫秒）
  tickerCallback: (() => void) | null; // ticker 回调
}

// 使用 WeakMap 存储每个 app 的状态，自动垃圾回收
const appStates = new WeakMap<PIXI.Application, GameOfLifeState>();

/**
 * 初始化状态（网格全死，创建绘图对象）
 */
function initState(app: PIXI.Application): GameOfLifeState {
  const rows = 30;
  const cols = 40;
  const cellSize = 20; // 800/40=20, 600/30=20
  const grid: boolean[][] = Array(rows)
    .fill(0)
    .map(() => Array(cols).fill(false));

  const graphics = new PIXI.Graphics();
  graphics.label = 'gameOfLifeGrid';
  app.stage.addChild(graphics);

  const state: GameOfLifeState = {
    grid,
    rows,
    cols,
    cellSize,
    graphics,
    running: false,
    lastUpdateTime: 0,
    updateInterval: 200,
    tickerCallback: null,
  };

  drawGrid(state); // 绘制初始空网格
  return state;
}

/**
 * 绘制整个网格
 */
function drawGrid(state: GameOfLifeState): void {
  const { graphics, grid, rows, cols, cellSize } = state;
  if (!graphics) return;
  graphics.clear();

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const x = j * cellSize;
      const y = i * cellSize;
      const w = cellSize - 1; // 留1像素间隙，便于观察网格线
      const h = cellSize - 1;

      if (grid[i][j]) {
        // 活细胞：填充白色，不加边框（或可选加边框）
        graphics.rect(x, y, w, h);
        graphics.fill(0xffffff);
      } else {
        // 死细胞：只画灰色边框，不填充
        graphics.rect(x, y, w, h);
        graphics.stroke({ width: 1, color: 0x333333 });
      }
    }
  }
}

/**
 * 计算指定细胞的活邻居数量（考虑环形边界）
 */
function countNeighbors(
  grid: boolean[][],
  rows: number,
  cols: number,
  i: number,
  j: number
): number {
  let count = 0;
  for (let di = -1; di <= 1; di++) {
    for (let dj = -1; dj <= 1; dj++) {
      if (di === 0 && dj === 0) continue;
      const ni = (i + di + rows) % rows;
      const nj = (j + dj + cols) % cols;
      if (grid[ni][nj]) count++;
    }
  }
  return count;
}

/**
 * 演化一代，更新 grid 并重新绘制
 */
function nextGeneration(state: GameOfLifeState): void {
  const { grid, rows, cols } = state;
  const newGrid = grid.map((row, i) =>
    row.map((cell, j) => {
      const neighbors = countNeighbors(grid, rows, cols, i, j);
      if (cell) {
        // 活细胞：邻居为2或3则存活，否则死亡
        return neighbors === 2 || neighbors === 3;
      } else {
        // 死细胞：邻居为3则复活
        return neighbors === 3;
      }
    })
  );
  state.grid = newGrid;
  drawGrid(state);
}

/**
 * 切换指定坐标的细胞状态
 */
function toggleCell(state: GameOfLifeState, x: number, y: number): void {
  const { cols, rows, cellSize } = state;
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  if (row >= 0 && row < rows && col >= 0 && col < cols) {
    state.grid[row][col] = !state.grid[row][col];
    drawGrid(state);
  }
}

/**
 * 清空所有细胞（全部死亡）
 */
function clearGrid(state: GameOfLifeState): void {
  for (let i = 0; i < state.rows; i++) {
    for (let j = 0; j < state.cols; j++) {
      state.grid[i][j] = false;
    }
  }
  drawGrid(state);
}

/**
 * 创建 ticker 回调（每帧调用，控制演化频率）
 */
function createTickerCallback(state: GameOfLifeState): () => void {
  return () => {
    if (!state.running) return;
    const now = performance.now();
    if (now - state.lastUpdateTime >= state.updateInterval) {
      nextGeneration(state);
      state.lastUpdateTime = now;
    }
  };
}

export const gameOfLifePlugin: PixiPlugin = {
  name: 'GameOfLifePlugin',
  messageTypes: [
    'gameOfLife/start',
    'gameOfLife/pause',
    'gameOfLife/step',
    'gameOfLife/toggleCell',
    'clear',
  ],

  execute(message: any, app: PIXI.Application): void {
    if (!app) {
      console.warn('[GameOfLifePlugin] 未提供 Pixi 应用实例');
      return;
    }

    // 获取或初始化状态
    let state = appStates.get(app);
    if (!state) {
      state = initState(app);
      appStates.set(app, state);
    }

    switch (message.type) {
      case 'gameOfLife/start':
        if (!state.running) {
          state.running = true;
          state.lastUpdateTime = performance.now();
          if (!state.tickerCallback) {
            state.tickerCallback = createTickerCallback(state);
            app.ticker.add(state.tickerCallback);
          }
        }
        break;

      case 'gameOfLife/pause':
        state.running = false;
        break;

      case 'gameOfLife/step':
        nextGeneration(state);
        break;

      case 'gameOfLife/toggleCell':
        if (message.x !== undefined && message.y !== undefined) {
          toggleCell(state, message.x, message.y);
        }
        break;

      case 'clear':
        state.running = false; // 停止自动演化
        clearGrid(state);
        break;
    }
  },
};