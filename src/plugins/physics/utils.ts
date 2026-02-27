// ============================================================
// 文件: src/plugins/physics/utils.ts
// 用途: 提供物理碰撞相关的工具函数。
// 上下文: 被 dvd.ts 和 balls.ts 中的更新函数调用。
//
// Outline:
// 1. 处理小球与边界的碰撞
// 2. 处理小球之间的弹性碰撞（考虑质量与半径平方成正比）
// 3. 处理小球与 DVD 的碰撞（DVD 视为无穷质量，速度不变）
// 4. 处理鼠标撞击小球
// ============================================================

import * as PIXI from 'pixi.js';
import { BallEntity, DVDEntity, PhysicsState } from './types';

/**
 * 根据半径计算质量（假设密度均匀，质量与面积成正比）
 */
function getMass(radius: number): number {
  return radius * radius; // 面积正比于半径平方
}

/**
 * 边界碰撞处理（带能量损失）
 * @param ball 小球实体
 * @param width 画布宽度
 * @param height 画布高度
 * @param bounce 反弹系数（默认 0.9）
 */
export function handleBallBoundaryCollision(ball: BallEntity, width: number, height: number, bounce = 0.9): void {
  if (ball.x < ball.radius) {
    ball.x = ball.radius;
    ball.vx = -ball.vx * bounce;
  } else if (ball.x > width - ball.radius) {
    ball.x = width - ball.radius;
    ball.vx = -ball.vx * bounce;
  }
  if (ball.y < ball.radius) {
    ball.y = ball.radius;
    ball.vy = -ball.vy * bounce;
  } else if (ball.y > height - ball.radius) {
    ball.y = height - ball.radius;
    ball.vy = -ball.vy * bounce;
  }
}

/**
 * 处理两个小球之间的弹性碰撞（考虑质量）
 * 使用完全弹性碰撞公式，并按照质量反比分离重叠。
 */
export function handleBallBallCollision(b1: BallEntity, b2: BallEntity): void {
  const dx = b2.x - b1.x;
  const dy = b2.y - b1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = b1.radius + b2.radius;
  if (dist < minDist) {
    // 计算质量
    const m1 = getMass(b1.radius);
    const m2 = getMass(b2.radius);
    const totalMass = m1 + m2;

    // 分离重叠：按照质量反比移动两个球
    const overlap = minDist - dist;
    const angle = Math.atan2(dy, dx);
    const moveX = Math.cos(angle) * overlap;
    const moveY = Math.sin(angle) * overlap;

    // b1 移动的比例 = m2 / totalMass，b2 移动的比例 = m1 / totalMass
    const ratio1 = m2 / totalMass;
    const ratio2 = m1 / totalMass;

    b1.x -= moveX * ratio1;
    b1.y -= moveY * ratio1;
    b2.x += moveX * ratio2;
    b2.y += moveY * ratio2;

    // 弹性速度更新（基于动量守恒和能量守恒）
    const nx = dx / dist; // 单位法向量（从 b1 指向 b2）
    const ny = dy / dist;

    // 相对速度在法向的分量
    const v1n = b1.vx * nx + b1.vy * ny;
    const v2n = b2.vx * nx + b2.vy * ny;

    // 碰撞后的法向速度（完全弹性）
    const v1nAfter = ((m1 - m2) * v1n + 2 * m2 * v2n) / totalMass;
    const v2nAfter = ((m2 - m1) * v2n + 2 * m1 * v1n) / totalMass;

    // 切向速度不变
    const v1tX = b1.vx - v1n * nx;
    const v1tY = b1.vy - v1n * ny;
    const v2tX = b2.vx - v2n * nx;
    const v2tY = b2.vy - v2n * ny;

    // 组合新速度
    b1.vx = v1tX + v1nAfter * nx;
    b1.vy = v1tY + v1nAfter * ny;
    b2.vx = v2tX + v2nAfter * nx;
    b2.vy = v2tY + v2nAfter * ny;
  }
}

/**
 * 处理小球与 DVD 的碰撞
 * DVD 视为无穷质量，速度不可变；小球按法向反射（类似撞击静止障碍物）
 */
export function handleBallDVDCollision(ball: BallEntity, dvd: DVDEntity): void {
  const dx = ball.x - dvd.sprite.x;
  const dy = ball.y - dvd.sprite.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = ball.radius + dvd.radius;
  if (dist < minDist) {
    // 分离重叠：只移动小球，DVD 不动
    const overlap = minDist - dist;
    const angle = Math.atan2(dy, dx);
    const moveX = Math.cos(angle) * overlap;
    const moveY = Math.sin(angle) * overlap;
    ball.x += moveX;
    ball.y += moveY;

    // 小球法向反射（忽略 DVD 的速度，因为 DVD 速度不可变）
    const nx = dx / dist;
    const ny = dy / dist;
    const vn = ball.vx * nx + ball.vy * ny;
    if (vn > 0) {
      // 如果小球正在远离 DVD，不改变速度（避免黏连）
      return;
    }
    ball.vx -= 2 * vn * nx;
    ball.vy -= 2 * vn * ny;

    // DVD 速度保持不变，不修改 dvd.vx / dvd.vy
  }
}

/**
 * 处理鼠标撞击小球
 * @param ball 小球实体
 * @param mouseX 鼠标 X
 * @param mouseY 鼠标 Y
 * @param mouseRadius 鼠标球半径
 * @param forceFactor 排斥力系数
 * @param maxSpeed 小球最大速度（可选）
 */
export function handleMouseBallCollision(
  ball: BallEntity,
  mouseX: number,
  mouseY: number,
  mouseRadius: number,
  forceFactor = 0.2,
  maxSpeed?: number
): void {
  const dx = ball.x - mouseX;
  const dy = ball.y - mouseY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = ball.radius + mouseRadius;
  if (dist < minDist) {
    const angle = Math.atan2(dy, dx);
    const force = (minDist - dist) * forceFactor;
    ball.vx += Math.cos(angle) * force;
    ball.vy += Math.sin(angle) * force;

    if (maxSpeed) {
      const speed = Math.hypot(ball.vx, ball.vy);
      if (speed > maxSpeed) {
        ball.vx = (ball.vx / speed) * maxSpeed;
        ball.vy = (ball.vy / speed) * maxSpeed;
      }
    }
  }
}