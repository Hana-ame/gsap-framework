// ============================================================
// 文件: src/plugins/balls.plugin.ts
// 用途: 实现 100 个小球的碰撞模拟，支持鼠标撞击。
//       小球之间、小球与边界、小球与鼠标（视为一个球）发生弹性碰撞。
// 上下文: 注册到 PixiController，由消息触发。需要接收鼠标位置消息。
//
// 版本: 1.0.0
//    - 初始版本，实现小球碰撞与鼠标交互
//
// 处理逻辑:
// 1. 插件监听 'startBalls', 'stopBalls', 'clear', 'mouseMove' 消息类型。
// 2. 使用 WeakMap 以 app 实例为键存储每个画布的状态：
//    - balls: 小球对象数组，每个小球包含 graphics, x, y, vx, vy, radius, color。
//    - mouseX, mouseY, mouseRadius: 鼠标位置和影响半径。
//    - tickerCallback: ticker 更新函数。
//    - active: 标记是否已启动。
// 3. 收到 'startBalls' 时，停止现有动画，创建 100 个小球并启动 ticker。
// 4. 收到 'stopBalls' 或 'clear' 时，停止动画并销毁所有小球。
// 5. 收到 'mouseMove' 时，更新鼠标位置。
// 6. ticker 更新函数每帧执行物理模拟：
//    - 移动小球
//    - 边界碰撞检测与修正
//    - 小球间碰撞检测与速度更新（弹性碰撞）
//    - 鼠标撞击检测：若鼠标在画布内，且小球与鼠标球相交，则小球获得远离鼠标的速度增量
//
// 使用方法:
//   import { ballsPlugin } from './plugins/balls.plugin';
//   controller.registerPlugin(ballsPlugin);
//
//   // 启动小球
//   controller.sendToPixi({ type: 'startBalls' });
//
//   // 停止小球
//   controller.sendToPixi({ type: 'stopBalls' });
//
//   // 清除（同时停止小球）
//   controller.sendToPixi({ type: 'clear' });
//
// 注意事项:
//   - 需要父组件转发鼠标移动事件（type: 'mouseMove', x, y）。
//   - 小球数量较多时，每帧碰撞检测 O(n^2)，100 个可流畅运行。
//   - 边界反弹系数设为 0.9，模拟能量损失。
//   - 鼠标球半径固定为 30 像素，可调整。
// ============================================================

import { PixiPlugin } from './plugin.types';
import * as PIXI from 'pixi.js';

/** 小球数据结构 */
interface Ball {
  graphics: PIXI.Graphics; // 绘图形状
  x: number;               // 当前位置 x
  y: number;               // 当前位置 y
  vx: number;              // 水平速度
  vy: number;              // 垂直速度
  radius: number;          // 半径
  color: number;           // 颜色
}

/** 每个 app 实例对应的状态 */
interface BallsState {
  balls: Ball[];
  mouseX: number;          // 最新鼠标位置 x（画布内坐标）
  mouseY: number;          // 最新鼠标位置 y
  mouseRadius: number;     // 鼠标球半径
  tickerCallback: () => void;
  active: boolean;
}

// 使用 WeakMap 存储每个 app 的状态
const appState = new WeakMap<PIXI.Application, BallsState>();

export const ballsPlugin: PixiPlugin = {
  name: 'BallsPlugin',
  messageTypes: ['startBalls', 'stopBalls', 'clear', 'mouseMove'],

  execute(message: any, app: PIXI.Application): void {
    if (!app) {
      console.warn('[BallsPlugin] 未提供 Pixi 应用实例');
      return;
    }

    switch (message.type) {
      case 'startBalls':
        startBalls(app);
        break;
      case 'stopBalls':
      case 'clear':
        stopBalls(app);
        break;
      case 'mouseMove':
        updateMousePosition(app, message.x, message.y);
        break;
      default:
        // 不会发生
        break;
    }
  }
};

/**
 * 启动小球场景
 * @param app Pixi 应用实例
 */
function startBalls(app: PIXI.Application): void {
  // 先停止现有动画
  stopBalls(app);

  // 获取或创建状态
  let state = appState.get(app);
  if (!state) {
    state = {
      balls: [],
      mouseX: -1000,        // 初始无效位置
      mouseY: -1000,
      mouseRadius: 30,
      tickerCallback: createTickerCallback(app),
      active: false,
    };
    appState.set(app, state);
  }

  // 创建 100 个小球
  const balls: Ball[] = [];
  for (let i = 0; i < 100; i++) {
    // 随机半径 5~15
    const radius = 5 + Math.random() * 10;
    // 随机颜色
    const color = Math.random() * 0xffffff;
    // 创建图形
    const graphics = new PIXI.Graphics();
    graphics.circle(0, 0, radius);
    graphics.fill(color);
    graphics.stroke({ width: 1, color: 0x000000 });

    // 随机初始位置，确保完全在画布内
    const x = radius + Math.random() * (app.screen.width - 2 * radius);
    const y = radius + Math.random() * (app.screen.height - 2 * radius);
    graphics.x = x;
    graphics.y = y;

    // 随机速度 (-2 ~ 2)
    const vx = (Math.random() - 0.5) * 4;
    const vy = (Math.random() - 0.5) * 4;

    balls.push({ graphics, x, y, vx, vy, radius, color });
    app.stage.addChild(graphics);
  }

  state.balls = balls;
  state.active = true;

  // 添加 ticker 回调（确保只添加一次）
  app.ticker.add(state.tickerCallback);

  console.log('[BallsPlugin] 已启动 100 个小球碰撞模拟');
}

/**
 * 停止小球动画，清理资源
 * @param app Pixi 应用实例
 */
function stopBalls(app: PIXI.Application): void {
  const state = appState.get(app);
  if (!state || !state.active) return;

  // 移除 ticker 回调
  if (state.tickerCallback) {
    app.ticker.remove(state.tickerCallback);
  }

  // 销毁所有小球图形
  state.balls.forEach(ball => ball.graphics.destroy());
  state.balls = [];

  state.active = false;
  console.log('[BallsPlugin] 已停止小球动画');
}

/**
 * 更新鼠标位置（由父组件通过消息发送）
 */
function updateMousePosition(app: PIXI.Application, x: number, y: number): void {
  const state = appState.get(app);
  if (!state) return;
  state.mouseX = x;
  state.mouseY = y;
}

/**
 * 创建 ticker 更新函数
 * @param app Pixi 应用实例
 * @returns 更新函数
 */
function createTickerCallback(app: PIXI.Application): () => void {
  return () => {
    const state = appState.get(app);
    if (!state || !state.active) return;

    const { balls, mouseX, mouseY, mouseRadius } = state;
    const width = app.screen.width;
    const height = app.screen.height;

    // 1. 移动小球并处理边界碰撞
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      b.x += b.vx;
      b.y += b.vy;

      // 边界碰撞（带能量损失）
      const bounce = 0.9; // 反弹系数
      if (b.x < b.radius) {
        b.x = b.radius;
        b.vx = -b.vx * bounce;
      } else if (b.x > width - b.radius) {
        b.x = width - b.radius;
        b.vx = -b.vx * bounce;
      }
      if (b.y < b.radius) {
        b.y = b.radius;
        b.vy = -b.vy * bounce;
      } else if (b.y > height - b.radius) {
        b.y = height - b.radius;
        b.vy = -b.vy * bounce;
      }

      // 更新图形位置
      b.graphics.x = b.x;
      b.graphics.y = b.y;
    }

    // 2. 小球间碰撞检测（简单弹性碰撞，质量相等）
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const b1 = balls[i];
        const b2 = balls[j];
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = b1.radius + b2.radius;
        if (dist < minDist) {
          // 分离重叠（避免卡住）
          const overlap = minDist - dist;
          const angle = Math.atan2(dy, dx);
          const moveX = Math.cos(angle) * overlap * 0.5;
          const moveY = Math.sin(angle) * overlap * 0.5;
          b1.x -= moveX;
          b1.y -= moveY;
          b2.x += moveX;
          b2.y += moveY;

          // 弹性速度交换（质量相等）
          const v1 = { x: b1.vx, y: b1.vy };
          const v2 = { x: b2.vx, y: b2.vy };
          const nx = dx / dist;
          const ny = dy / dist;
          const v1n = v1.x * nx + v1.y * ny;
          const v2n = v2.x * nx + v2.y * ny;
          const v1t = { x: v1.x - v1n * nx, y: v1.y - v1n * ny };
          const v2t = { x: v2.x - v2n * nx, y: v2.y - v2n * ny };
          b1.vx = v2n * nx + v1t.x;
          b1.vy = v2n * ny + v1t.y;
          b2.vx = v1n * nx + v2t.x;
          b2.vy = v1n * ny + v2t.y;
        }
      }
    }

    // 3. 鼠标撞击检测（如果鼠标在画布内）
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        const dx = b.x - mouseX;
        const dy = b.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = b.radius + mouseRadius;
        if (dist < minDist) {
          // 鼠标球视为无限质量，小球被弹开
          const angle = Math.atan2(dy, dx);
          const force = (minDist - dist) * 0.2; // 排斥强度
          b.vx += Math.cos(angle) * force;
          b.vy += Math.sin(angle) * force;
          // 可选的限速
          const maxSpeed = 8;
          const speed = Math.hypot(b.vx, b.vy);
          if (speed > maxSpeed) {
            b.vx = (b.vx / speed) * maxSpeed;
            b.vy = (b.vy / speed) * maxSpeed;
          }
        }
      }
    }
  };
}