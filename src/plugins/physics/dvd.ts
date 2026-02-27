// ============================================================
// 文件: src/plugins/physics/dvd.ts
// 用途: 管理 DVD 实体的生命周期和更新。
// 上下文: 由主插件在收到 'startDVD' 消息时调用。
//
// Outline:
// 1. 启动 DVD：加载 SVG，创建精灵，随机初始位置/速度，存入状态。
// 2. 停止 DVD：从状态中移除，销毁精灵，从舞台移除。
// 3. 更新 DVD：在 ticker 中调用，处理边界碰撞。
// ============================================================

import * as PIXI from 'pixi.js';
import { getState } from './state';
import { DVDEntity } from './types';

const svgUrl = new URL('../../assets/dvd-logo.svg', import.meta.url).href;

/**
 * 启动 DVD 动画（如果尚未存在）
 */
export async function startDVD(app: PIXI.Application): Promise<void> {
  const state = getState(app);

  // 如果已有 DVD，先停止
  if (state.dvd) {
    stopDVD(app);
  }

  try {
    // 加载纹理
    let texture: PIXI.Texture;
    if (PIXI.Assets.cache.has(svgUrl)) {
      texture = PIXI.Assets.get(svgUrl);
    } else {
      texture = await PIXI.Assets.load(svgUrl);
    }

    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.label = 'bouncingDVD';
    sprite.tint = Math.random() * 0xffffff; // 随机初始颜色

    // 计算碰撞半径（取宽高较大者的一半，因为精灵有旋转）
    const radius = Math.max(sprite.width, sprite.height) / 2;

    // 随机初始位置（确保完全在画布内）
    const maxX = app.screen.width - radius;
    const minX = radius;
    const maxY = app.screen.height - radius;
    const minY = radius;
    sprite.x = Math.random() * (maxX - minX) + minX;
    sprite.y = Math.random() * (maxY - minY) + minY;

    // 随机初始速度（方向随机，大小固定）
    const speed = 3;
    const angle = Math.random() * Math.PI * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    // 创建 DVD 实体
    const dvd: DVDEntity = {
      sprite,
      vx,
      vy,
      speed,
      radius,
    };

    app.stage.addChild(sprite);
    state.dvd = dvd;
    state.active = true;

    console.log('[PhysicsPlugin] DVD 已启动');
  } catch (error) {
    console.error('[PhysicsPlugin] 加载 DVD 图片失败:', error);
  }
}

/**
 * 停止 DVD 动画，销毁精灵
 */
export function stopDVD(app: PIXI.Application): void {
  const state = getState(app);
  if (state.dvd) {
    if (state.dvd.sprite.parent) {
      state.dvd.sprite.destroy();
    }
    state.dvd = null;
    console.log('[PhysicsPlugin] DVD 已停止');
  }
}

/**
 * 更新 DVD 位置，处理边界碰撞
 * 在 ticker 中每帧调用
 */
export function updateDVD(app: PIXI.Application): void {
  const state = getState(app);
  if (!state.dvd) return;

  const dvd = state.dvd;
  const sprite = dvd.sprite;

  // 移动
  sprite.x += dvd.vx;
  sprite.y += dvd.vy;

  // 边界检测与修正
  const halfWidth = sprite.width / 2;
  const halfHeight = sprite.height / 2;
  let collided = false;

  if (sprite.x - halfWidth < 0) {
    sprite.x = halfWidth;
    collided = true;
  } else if (sprite.x + halfWidth > app.screen.width) {
    sprite.x = app.screen.width - halfWidth;
    collided = true;
  }

  if (sprite.y - halfHeight < 0) {
    sprite.y = halfHeight;
    collided = true;
  } else if (sprite.y + halfHeight > app.screen.height) {
    sprite.y = app.screen.height - halfHeight;
    collided = true;
  }

  if (collided) {
    // 撞击时随机变色
    sprite.tint = Math.random() * 0xffffff;

    // 随机新方向（速度大小保持不变）
    const newAngle = Math.random() * Math.PI * 2;
    dvd.vx = dvd.speed * Math.cos(newAngle);
    dvd.vy = dvd.speed * Math.sin(newAngle);
  }
}