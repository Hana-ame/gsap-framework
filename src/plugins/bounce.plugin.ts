// ============================================================
// 文件: src/plugins/bounce.plugin.ts
// 用途: 实现DVD屏保风格的反弹图片动画。
//       当收到 'startDVD' 消息时，加载SVG图片并开始在画布内移动反弹；
//       当收到 'clear' 消息时，停止动画并销毁图片。
// 上下文: 注册到 PixiController 中，由消息触发。支持持续动画。
//
// 版本: 1.0.0
//    - 初始版本，实现反弹动画。
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
// ============================================================

import { PixiPlugin } from './plugin.types';
import * as PIXI from 'pixi.js';

// SVG 文件路径（相对于 public 或 src 目录，这里使用相对于项目根目录的路径）
// 注意：在 Vite 项目中，放在 public 下的资源可以直接用 / 引用，
// 但为了清晰，我们将 SVG 放在 src/assets，并通过 import 或动态路径处理。
// 使用 new URL 获取正确路径（适用于 Vite）
const svgUrl = new URL('../assets/dvd-logo.svg', import.meta.url).href;

export const bouncePlugin: PixiPlugin = {
  name: 'BouncePlugin',
  // 同时监听 'startDVD' 和 'clear' 消息
  messageTypes: ['startDVD', 'clear'],

  /**
   * 执行插件逻辑
   * @param message 消息对象
   * @param app Pixi Application 实例
   */
  execute(message: any, app: PIXI.Application): void {
    if (!app) {
      console.warn('[BouncePlugin] 未提供 Pixi 应用实例');
      return;
    }

    // 处理不同消息类型
    if (message.type === 'startDVD') {
      startBounce(app);
    } else if (message.type === 'clear') {
      stopBounce(app);
    }
  }
};

// 使用 WeakMap 为每个 app 实例存储动画状态，防止全局变量污染
const appState = new WeakMap<PIXI.Application, {
  sprite: PIXI.Sprite | null;
  velocity: { x: number; y: number };
  tickerCallback: (() => void) | null;
  isAnimating: boolean;
}>();

/**
 * 启动反弹动画（如果尚未启动）
 * @param app Pixi Application 实例
 */
async function startBounce(app: PIXI.Application) {
  // 获取或初始化 app 状态
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

  // 加载 SVG 纹理
  try {
    // 检查是否已加载，避免重复加载
    let texture: PIXI.Texture;
    if (PIXI.Assets.cache.has(svgUrl)) {
      texture = PIXI.Assets.get(svgUrl);
    } else {
      texture = await PIXI.Assets.load(svgUrl);
    }

    // 创建精灵
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5); // 设置锚点为中心，便于碰撞计算
    sprite.label = 'bouncingDVD'; // 方便调试

    // 随机初始位置（确保完全在画布内）
    const maxX = app.screen.width - sprite.width / 2;
    const minX = sprite.width / 2;
    const maxY = app.screen.height - sprite.height / 2;
    const minY = sprite.height / 2;
    sprite.x = Math.random() * (maxX - minX) + minX;
    sprite.y = Math.random() * (maxY - minY) + minY;

    // 随机速度（方向随机，大小固定）
    const speed = 3;
    const angle = Math.random() * Math.PI * 2;
    state.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };

    // 添加到舞台
    app.stage.addChild(sprite);
    state.sprite = sprite;

    // 创建 ticker 回调
    const update = () => {
      if (!state.sprite || !state.sprite.parent) {
        // 精灵已被移除（例如被 clear 插件删除），停止动画
        stopBounce(app);
        return;
      }

      // 更新位置
      state.sprite.x += state.velocity.x;
      state.sprite.y += state.velocity.y;

      // 边界反弹（考虑精灵尺寸）
      const halfWidth = state.sprite.width / 2;
      const halfHeight = state.sprite.height / 2;

      if (state.sprite.x - halfWidth < 0) {
        state.sprite.x = halfWidth;
        state.velocity.x = Math.abs(state.velocity.x);
      } else if (state.sprite.x + halfWidth > app.screen.width) {
        state.sprite.x = app.screen.width - halfWidth;
        state.velocity.x = -Math.abs(state.velocity.x);
      }

      if (state.sprite.y - halfHeight < 0) {
        state.sprite.y = halfHeight;
        state.velocity.y = Math.abs(state.velocity.y);
      } else if (state.sprite.y + halfHeight > app.screen.height) {
        state.sprite.y = app.screen.height - halfHeight;
        state.velocity.y = -Math.abs(state.velocity.y);
      }
    };

    // 添加到 ticker
    app.ticker.add(update);
    state.tickerCallback = update;
    state.isAnimating = true;

    console.log('[BouncePlugin] 反弹动画已启动');
  } catch (error) {
    console.error('[BouncePlugin] 加载 SVG 失败:', error);
  }
}

/**
 * 停止反弹动画并清理资源
 * @param app Pixi Application 实例
 */
function stopBounce(app: PIXI.Application) {
  const state = appState.get(app);
  if (!state) return;

  if (state.tickerCallback) {
    app.ticker.remove(state.tickerCallback);
    state.tickerCallback = null;
  }

  if (state.sprite && state.sprite.parent) {
    state.sprite.destroy(); // 销毁精灵释放纹理
  }
  state.sprite = null;
  state.isAnimating = false;
  console.log('[BouncePlugin] 反弹动画已停止');
}