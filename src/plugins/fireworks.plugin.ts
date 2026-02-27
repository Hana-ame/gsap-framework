// ============================================================
// 文件: src/plugins/fireworks.plugin.ts
// 用途: 实现鼠标跟随烟花效果。当启动后，在画布上移动鼠标时，
//       会在鼠标位置生成彩色粒子，粒子向外扩散并逐渐淡出消失，
//       产生类似烟花尾迹的效果。
// 上下文: 注册到 PixiController 中，由消息触发。需要 Pixi 应用实例。
//
// 版本: 1.0.0
//    - 初始版本，提供鼠标跟随烟花效果
//
// 处理逻辑:
// 1. 插件监听 'startFireworks', 'stopFireworks', 'clear' 三种消息类型。
// 2. 使用 WeakMap 以 app 实例为键存储每个画布的状态：
//    - particles: 当前活跃粒子数组
//    - maxParticles: 最大粒子数（默认200）
//    - listener: mousemove 事件监听函数
//    - tickerCallback: ticker 更新函数
//    - active: 标记是否已启动
// 3. 收到 'startFireworks' 时启动效果：
//    - 若已激活则先停止（stopFireworks）
//    - 在 app.canvas 上添加 mousemove 监听，根据鼠标坐标生成新粒子
//    - 将更新函数添加到 app.ticker，每帧更新粒子位置、透明度、大小，并移除消亡的粒子
// 4. 收到 'stopFireworks' 或 'clear' 时停止效果：
//    - 移除事件监听和 ticker 回调
//    - 销毁所有粒子并清空数组
//    - 标记为未激活
//
// 使用方法:
//   import { fireworksPlugin } from './plugins/fireworks.plugin';
//   controller.registerPlugin(fireworksPlugin);
//
//   // 启动烟花效果
//   controller.sendToPixi({ type: 'startFireworks' });
//
//   // 停止烟花效果
//   controller.sendToPixi({ type: 'stopFireworks' });
//
//   // 清除画布（会同时停止烟花）
//   controller.sendToPixi({ type: 'clear' });
//
// 注意事项:
//   - 需要确保 app 实例已通过 controller.setApp() 设置。
//   - 粒子数量受 maxParticles 限制，超出时会自动移除最早生成的粒子。
//   - 停止效果后，已生成的粒子会被立即销毁，不会残留。
//   - 与 clear.plugin 配合：clear 消息会同时触发本插件的停止逻辑，避免动画冲突。
// ============================================================

import { PixiPlugin } from './plugin.types';
import * as PIXI from 'pixi.js';

/** 粒子数据结构 */
interface Particle {
  graphics: PIXI.Graphics;   // 粒子图形
  vx: number;                // 水平速度
  vy: number;                // 垂直速度
  life: number;              // 当前生命值 (0-1)，控制透明度和大小
  decay: number;             // 每帧衰减量
}

/** 每个 app 实例对应的状态 */
interface FireworksState {
  particles: Particle[];
  maxParticles: number;
  listener: (event: MouseEvent) => void;
  tickerCallback: () => void;
  active: boolean;
}

// 使用 WeakMap 存储每个 app 实例的状态，避免全局污染
const appState = new WeakMap<PIXI.Application, FireworksState>();

export const fireworksPlugin: PixiPlugin = {
  name: 'FireworksPlugin',
  messageTypes: ['startFireworks', 'stopFireworks', 'clear'],

  /**
   * 插件执行入口，根据消息类型分发
   * @param message 消息对象，应包含 type 字段
   * @param app Pixi Application 实例
   */
  execute(message: any, app: PIXI.Application): void {
    if (!app) {
      console.warn('[FireworksPlugin] 未提供 Pixi 应用实例');
      return;
    }

    switch (message.type) {
      case 'startFireworks':
        startFireworks(app);
        break;
      case 'stopFireworks':
      case 'clear':   // 收到 clear 时同样停止效果，与 clearPlugin 协作
        stopFireworks(app);
        break;
      default:
        // 不会发生，因为 messageTypes 已限定
        break;
    }
  }
};

/**
 * 启动鼠标跟随烟花效果
 * @param app Pixi Application 实例
 */
function startFireworks(app: PIXI.Application): void {
  let state = appState.get(app);
  if (!state) {
    // 初始化状态
    state = {
      particles: [],
      maxParticles: 200,
      listener: createMouseListener(app),
      tickerCallback: createTickerCallback(app),
      active: false,
    };
    appState.set(app, state);
  }

  // 如果已经激活，先停止，确保重新启动时干净
  if (state.active) {
    stopFireworks(app);
    // 重新获取 state（stopFireworks 可能重置了状态）
    state = appState.get(app)!;
  }

  // 绑定事件监听
  app.canvas.addEventListener('mousemove', state.listener);
  // 添加到 ticker
  app.ticker.add(state.tickerCallback);
  state.active = true;

  console.log('[FireworksPlugin] 鼠标跟随烟花效果已启动');
}

/**
 * 停止烟花效果，清理资源
 * @param app Pixi Application 实例
 */
function stopFireworks(app: PIXI.Application): void {
  const state = appState.get(app);
  if (!state || !state.active) return;

  // 移除事件监听
  app.canvas.removeEventListener('mousemove', state.listener);
  // 移除 ticker 回调
  app.ticker.remove(state.tickerCallback);

  // 销毁所有粒子
  state.particles.forEach(p => p.graphics.destroy());
  state.particles = [];

  state.active = false;
  console.log('[FireworksPlugin] 鼠标跟随烟花效果已停止');
}

/**
 * 创建 mousemove 事件监听函数
 * @param app Pixi Application 实例
 * @returns 监听函数
 */
function createMouseListener(app: PIXI.Application): (event: MouseEvent) => void {
  return (event: MouseEvent) => {
    const state = appState.get(app);
    if (!state || !state.active) return;

    // 获取鼠标在 canvas 上的坐标
    const rect = app.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 边界检查（防止超出画布）
    if (x < 0 || x > app.screen.width || y < 0 || y > app.screen.height) return;

    // 生成新粒子
    createParticle(app, x, y);
  };
}

/**
 * 创建 ticker 更新函数
 * @param app Pixi Application 实例
 * @returns 更新函数
 */
function createTickerCallback(app: PIXI.Application): () => void {
  return () => {
    const state = appState.get(app);
    if (!state || !state.active) return;

    const { particles } = state;
    // 倒序遍历，以便安全删除
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      // 更新位置
      p.graphics.x += p.vx;
      p.graphics.y += p.vy;
      // 更新生命值
      p.life -= p.decay;
      if (p.life <= 0) {
        // 粒子消亡，移除并销毁
        p.graphics.destroy();
        particles.splice(i, 1);
        continue;
      }
      // 根据生命值调整透明度和缩放
      p.graphics.alpha = p.life;
      p.graphics.scale.set(p.life); // 缩放随生命减小
    }
  };
}

/**
 * 在指定坐标生成一个新粒子
 * @param app Pixi Application 实例
 * @param x 生成位置的 x 坐标
 * @param y 生成位置的 y 坐标
 */
function createParticle(app: PIXI.Application, x: number, y: number): void {
  const state = appState.get(app);
  if (!state || !state.active) return;

  // 控制粒子总数
  if (state.particles.length >= state.maxParticles) {
    // 移除最早的一个粒子（数组头部）
    const oldest = state.particles.shift();
    if (oldest) oldest.graphics.destroy();
  }

  // 随机颜色
  const color = Math.random() * 0xffffff;

  // 创建圆形粒子
  const graphics = new PIXI.Graphics();
  graphics.circle(0, 0, 3); // 半径为3
  graphics.fill(color);
  graphics.x = x;
  graphics.y = y;
  graphics.alpha = 1;
  graphics.scale.set(1);

  // 添加到舞台
  app.stage.addChild(graphics);

  // 随机速度（-1.5 到 1.5）
  const vx = (Math.random() - 0.5) * 3;
  const vy = (Math.random() - 0.5) * 3;
  // 随机衰减速率（0.01 到 0.03），生命约 33~100 帧
  const decay = 0.01 + Math.random() * 0.02;

  state.particles.push({
    graphics,
    vx,
    vy,
    life: 1,
    decay,
  });
}