// ============================================================
// 文件: src/plugins/physics/index.ts
// 用途: Physics 插件的主入口。导出符合 PixiPlugin 接口的插件对象。
// 上下文: 被 src/plugins/index.ts 导入并注册到 PixiController。
//
// 处理逻辑:
//   1. 插件监听 'startDVD', 'startBalls', 'clear', 'mouseMove' 消息。
//   2. 使用状态管理模块（state.ts）存储每个 app 的物理实体。
//   3. 在收到 startDVD 时调用 dvd.startDVD，收到 startBalls 时调用 balls.startBalls。
//   4. 在收到 clear 时停止所有动画并销毁实体，并移除 ticker。
//   5. 在收到 mouseMove 时更新鼠标位置。
//   6. 通过 ticker 回调每帧更新所有实体（由插件在第一次收到消息时添加）。
//
// 注意事项:
//   - ticker 回调在第一次启动任一实体时添加，并在 clear 时自动移除。
// ============================================================

import { PixiPlugin } from '../plugin.types';
import * as PIXI from 'pixi.js';
import { getState } from './state';
import { startDVD, stopDVD, updateDVD } from './dvd';
import { startBalls, stopBalls, updateBalls } from './balls';
import { PhysicsState } from './types';

/**
 * 创建全局 ticker 回调（每个 app 独立）
 */
function createTickerCallback(app: PIXI.Application): () => void {
  return () => {
    const state = getState(app);
    if (!state.active) return;

    // 更新 DVD（如果存在）
    if (state.dvd) {
      updateDVD(app);
    }

    // 更新小球（如果存在）
    if (state.balls.length > 0) {
      updateBalls(app);
    }
  };
}

/**
 * 确保 ticker 已添加且状态中的回调正确
 */
function ensureTicker(app: PIXI.Application): void {
  const state = getState(app);
  if (!state.tickerCallback) {
    const callback = createTickerCallback(app);
    state.tickerCallback = callback;
    app.ticker.add(callback);
  }
}

/**
 * 移除 ticker 回调
 */
function removeTicker(app: PIXI.Application): void {
  const state = getState(app);
  if (state.tickerCallback) {
    app.ticker.remove(state.tickerCallback);
    state.tickerCallback = undefined;
  }
}

export const physicsPlugin: PixiPlugin = {
  name: 'PhysicsPlugin',
  messageTypes: ['startDVD', 'startBalls', 'clear', 'mouseMove'],

  execute(message: any, app: PIXI.Application): void {
    if (!app) {
      console.warn('[PhysicsPlugin] 未提供 Pixi 应用实例');
      return;
    }

    switch (message.type) {
      case 'startDVD':
        ensureTicker(app);   // 确保 ticker 存在
        startDVD(app);
        break;
      case 'startBalls':
        ensureTicker(app);   // 确保 ticker 存在
        startBalls(app);
        break;
      case 'clear':
        // 停止所有实体
        stopDVD(app);
        stopBalls(app);
        // 移除 ticker 回调（因为已经没有活跃实体）
        removeTicker(app);
        break;
      case 'mouseMove':
        {
          const state = getState(app);
          state.mouseX = message.x;
          state.mouseY = message.y;
        }
        break;
      default:
        // 不会发生
        break;
    }
  },
};