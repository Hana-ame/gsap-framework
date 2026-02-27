// ============================================================
// 文件: src/plugins/physics/balls.ts
// 用途: 管理小球实体的生命周期和更新。
// 上下文: 由主插件在收到 'startBalls' 消息时调用。
//
// Outline:
// 1. 启动小球：创建 100 个小球，随机初始化，存入状态。
// 2. 停止小球：销毁所有小球图形，清空数组。
// 3. 更新小球：在 ticker 中调用，处理边界、小球间碰撞、与 DVD 碰撞、鼠标撞击。
// ============================================================

import * as PIXI from 'pixi.js';
import { getState } from './state';
import { BallEntity, PhysicsState } from './types';
import {
  handleBallBoundaryCollision,
  handleBallBallCollision,
  handleBallDVDCollision,
  handleMouseBallCollision,
} from './utils';

/**
 * 启动小球场景
 */
export function startBalls(app: PIXI.Application): void {
  const state = getState(app);

  // 如果已有小球，先停止
  if (state.balls.length > 0) {
    stopBalls(app);
  }

  const balls: BallEntity[] = [];
  for (let i = 0; i < 100; i++) {
    const radius = 5 + Math.random() * 10; // 5~15
    const color = Math.random() * 0xffffff;

    const graphics = new PIXI.Graphics();
    graphics.circle(0, 0, radius);
    graphics.fill(color);
    graphics.stroke({ width: 1, color: 0x000000 });

    // 随机初始位置（确保完全在画布内）
    const x = radius + Math.random() * (app.screen.width - 2 * radius);
    const y = radius + Math.random() * (app.screen.height - 2 * radius);
    graphics.x = x;
    graphics.y = y;

    const vx = (Math.random() - 0.5) * 4; // -2 ~ 2
    const vy = (Math.random() - 0.5) * 4;

    balls.push({ graphics, x, y, vx, vy, radius, color });
    app.stage.addChild(graphics);
  }

  state.balls = balls;
  state.active = true;

  console.log('[PhysicsPlugin] 已启动 100 个小球');
}

/**
 * 停止小球动画，销毁所有小球图形
 */
export function stopBalls(app: PIXI.Application): void {
  const state = getState(app);
  state.balls.forEach(ball => ball.graphics.destroy());
  state.balls = [];
  // 如果同时没有 DVD，则 active 为 false
  if (!state.dvd) {
    state.active = false;
  }
  console.log('[PhysicsPlugin] 已停止小球');
}

/**
 * 更新小球位置，处理各种碰撞
 * 在 ticker 中每帧调用
 */
export function updateBalls(app: PIXI.Application): void {
  const state = getState(app);
  if (state.balls.length === 0) return;

  const { balls, dvd, mouseX, mouseY, mouseRadius } = state;
  const width = app.screen.width;
  const height = app.screen.height;

  // 1. 移动小球并处理边界
  for (let i = 0; i < balls.length; i++) {
    const b = balls[i];
    b.x += b.vx;
    b.y += b.vy;
    handleBallBoundaryCollision(b, width, height, 0.9);
    b.graphics.x = b.x;
    b.graphics.y = b.y;
  }

  // 2. 小球间碰撞
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      handleBallBallCollision(balls[i], balls[j]);
    }
  }

  // 3. 小球与 DVD 碰撞（如果存在）
  if (dvd) {
    for (let i = 0; i < balls.length; i++) {
      handleBallDVDCollision(balls[i], dvd);
    }
  }

  // 4. 鼠标撞击
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    for (let i = 0; i < balls.length; i++) {
      handleMouseBallCollision(balls[i], mouseX, mouseY, mouseRadius, 0.2, 8);
    }
  }
}