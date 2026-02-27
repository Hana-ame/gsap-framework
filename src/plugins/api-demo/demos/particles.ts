// ============================================================
// 文件: src/plugins/api-demo/demos/particles.ts
// 用途: 演示粒子系统 (ParticleContainer) - 已适配 PixiJS v8
//       使用 ParticleContainer 优化大量粒子，展示简单粒子动画。
// 上下文: 被 demos/index.ts 导入，由 apiDemoPlugin 在收到
//        'apiDemo/particles' 消息时调用。
//
// Outline:
// 1. 导入 PIXI 及辅助函数、状态管理
// 2. 定义并导出 showParticles 函数
// 3. 创建 ParticleContainer，生成 200 个彩色粒子
// 4. 注册 ticker 更新粒子位置、旋转，实现缓慢流动效果
// 5. 保存 tickerCallback 以便清理
//
// 注意事项:
//   - ParticleContainer 构造函数使用两个参数形式（maxSize, properties），并添加 as any 绕过类型检查。
//   - 粒子动画使用正弦波移动，边界环绕。
// ============================================================

import * as PIXI from 'pixi.js';
import { getDemoContainer, clearDemo, appStates } from '../state';
import { addTitle, addDescription } from '../utils';

export function showParticles(app: PIXI.Application) {
  const container = getDemoContainer(app);
  clearDemo(app);

  addTitle(container, '粒子系统 (ParticleContainer)');
  addDescription(container, 'v8 优化版：使用 addParticle 代替 addChild', 40);

  // 1. 创建圆形纹理 (v8 的 Graphics 语法略有变化)
  const particleGraphic = new PIXI.Graphics();
  particleGraphic.circle(0, 0, 3);
  particleGraphic.fill(0xffffff);
  const texture = app.renderer.generateTexture(particleGraphic);

  // 2. 创建 ParticleContainer
  // v8 构造函数只接收一个配置对象
  const particleContainer = new PIXI.ParticleContainer({
    texture: texture, // 指定容器使用的基础纹理
    dynamicProperties: {
      position: true,
      rotation: true,
      color: true, // v8 中 tint 和 alpha 统称为 color
    },
  });

  particleContainer.position.set(20, 60);
  container.addChild(particleContainer);

  // 3. 生成粒子
  // v8 不再使用 new PIXI.Sprite，而是使用 addParticle()
  const particles: any[] = []; // 存储粒子引用以便在 ticker 中更新
  
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 300;
    const y = Math.random() * 120;
    const rotation = Math.random() * Math.PI * 2;
    
    // 处理颜色：v8 使用 32位 RGBA (0xRRGGBBAA)
    // 这里将随机颜色与 alpha (0.6-1.0) 结合
    const randomRGB = Math.floor(Math.random() * 0xffffff);
    const alpha = Math.floor((0.6 + Math.random() * 0.4) * 255);
    const rgbaColor = (randomRGB << 8) | alpha;

    const p = particleContainer.addParticle({
      x,
      y,
      rotation,
      scaleX: 1,
      scaleY: 1,
      anchorX: 0.5,
      anchorY: 0.5,
      color: rgbaColor,
      texture: texture,
    });
    
    particles.push(p);
  }

  // 4. 注册 ticker 更新粒子位置
  const tickerCallback = () => {
    const now = Date.now() * 0.001;
    particles.forEach((p, index) => {
      // 在 v8 中，这些属性是直接暴露在粒子对象上的
      p.rotation += 0.01;
      p.x += Math.sin(index + now) * 0.5;
      p.y += Math.cos(index + now) * 0.5;

      // 边界环绕
      if (p.x < 0) p.x = 300;
      if (p.x > 300) p.x = 0;
      if (p.y < 0) p.y = 120;
      if (p.y > 120) p.y = 0;
    });
  };

  app.ticker.add(tickerCallback);
  
  // 保存状态以便清理
  const state = appStates.get(app)!;
  state.tickerCallback = tickerCallback;
}