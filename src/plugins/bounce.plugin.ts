// ============================================================
// 文件: src/plugins/bounce.plugin.ts
// 用途: 实现DVD屏保风格的反弹图片动画，每次撞击边界随机变色并改变方向。
//       当收到 'startDVD' 消息时，加载SVG图片并开始在画布内移动反弹；
//       当收到 'clear' 消息时，停止动画并销毁图片。
// 上下文: 注册到 PixiController 中，由消息触发。支持持续动画。
//
// 版本: 1.1.0
//    - 新增每次撞击时随机改变精灵颜色 (sprite.tint)
//    - 新增每次撞击时随机生成新速度向量（方向随机，大小不变），取代镜面反射
//    - 初始化时随机设置初始颜色
//
// Outline:
// 1. 导入依赖与类型
// 2. 定义插件内部状态 (sprite, velocity, tickerCallback, isAnimating)
// 3. 导出插件对象，包含 messageTypes 和 execute 方法
// 4. execute 方法根据消息类型分发：
//    - 'startDVD': 启动动画（如果尚未启动，则加载SVG并开始移动）
//    - 'clear': 停止动画并清理资源
// 5. 辅助函数：loadSvg, startAnimation, stopAnimation, updatePosition
//
// 使用方法:
//   import { bouncePlugin } from './plugins/bounce.plugin';
//   controller.registerPlugin(bouncePlugin);
//   // 发送启动消息
//   controller.sendToPixi({ type: 'startDVD' });
//
// 注意事项:
//   - SVG 加载是异步的，动画会在加载完成后自动开始。
//   - 多次发送 'startDVD' 不会重复创建动画，会先停止旧动画。
//   - 收到 'clear' 消息时，会停止动画并销毁精灵，但不清除其他图形（由 clear.plugin 负责）。
//   - 需要确保 app 实例已设置，否则消息会被忽略。
//   - 颜色通过 sprite.tint 改变，会影响整个精灵的色调，包括白色文字。
// ============================================================

import { PixiPlugin } from './plugin.types';
import * as PIXI from 'pixi.js';

const svgUrl = new URL('../assets/dvd-logo.svg', import.meta.url).href;

export const bouncePlugin: PixiPlugin = {
  name: 'BouncePlugin',
  messageTypes: ['startDVD', 'clear'],

  execute(message: any, app: PIXI.Application): void {
    if (!app) {
      console.warn('[BouncePlugin] 未提供 Pixi 应用实例');
      return;
    }

    if (message.type === 'startDVD') {
      startBounce(app);
    } else if (message.type === 'clear') {
      stopBounce(app);
    }
  }
};

const appState = new WeakMap<PIXI.Application, {
  sprite: PIXI.Sprite | null;
  velocity: { x: number; y: number };
  tickerCallback: (() => void) | null;
  isAnimating: boolean;
}>();

async function startBounce(app: PIXI.Application) {
  let state = appState.get(app);
  if (!state) {
    state = {
      sprite: null,
      velocity: { x: 0, y: 0 },
      tickerCallback: null,
      isAnimating: false,
    };
    appState.set(app, state);
  }

  // 如果已有动画，先停止
  if (state.isAnimating) {
    stopBounce(app);
  }

  try {
    let texture: PIXI.Texture;
    if (PIXI.Assets.cache.has(svgUrl)) {
      texture = PIXI.Assets.get(svgUrl);
    } else {
      texture = await PIXI.Assets.load(svgUrl);
    }

    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.label = 'bouncingDVD';

    // 随机初始颜色
    sprite.tint = Math.random() * 0xffffff;

    // 随机初始位置（确保完全在画布内）
    const maxX = app.screen.width - sprite.width / 2;
    const minX = sprite.width / 2;
    const maxY = app.screen.height - sprite.height / 2;
    const minY = sprite.height / 2;
    sprite.x = Math.random() * (maxX - minX) + minX;
    sprite.y = Math.random() * (maxY - minY) + minY;

    // 随机初始速度（方向随机，大小固定）
    const speed = 3;
    const angle = Math.random() * Math.PI * 2;
    state.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };

    app.stage.addChild(sprite);
    state.sprite = sprite;

    const update = () => {
      if (!state.sprite || !state.sprite.parent) {
        stopBounce(app);
        return;
      }

      const sprite = state.sprite;
      const halfWidth = sprite.width / 2;
      const halfHeight = sprite.height / 2;
      let collided = false;

      // 更新位置
      sprite.x += state.velocity.x;
      sprite.y += state.velocity.y;

      // 边界检测与修正
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
        const currentSpeed = Math.hypot(state.velocity.x, state.velocity.y);
        const newAngle = Math.random() * Math.PI * 2;
        state.velocity.x = currentSpeed * Math.cos(newAngle);
        state.velocity.y = currentSpeed * Math.sin(newAngle);
      }
    };

    app.ticker.add(update);
    state.tickerCallback = update;
    state.isAnimating = true;

    console.log('[BouncePlugin] 反弹动画已启动，撞击时将随机变色并改变方向');
  } catch (error) {
    console.error('[BouncePlugin] 加载 SVG 失败:', error);
  }
}

function stopBounce(app: PIXI.Application) {
  const state = appState.get(app);
  if (!state) return;

  if (state.tickerCallback) {
    app.ticker.remove(state.tickerCallback);
    state.tickerCallback = null;
  }

  if (state.sprite && state.sprite.parent) {
    state.sprite.destroy();
  }
  state.sprite = null;
  state.isAnimating = false;
  console.log('[BouncePlugin] 反弹动画已停止');
}