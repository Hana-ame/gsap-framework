// ============================================================
// 文件: src/plugins/api-demo/demos/sprite.ts
// 用途: 演示精灵 (Sprite)
//       包括从纹理创建精灵、设置位置/旋转/缩放/透明度、使用 tint。
// 上下文: 被 demos/index.ts 导入，由 apiDemoPlugin 在收到
//        'apiDemo/sprite' 消息时调用。
//
// Outline:
// 1. 导入 PIXI 及辅助函数
// 2. 定义并导出 showSprite 函数
// 3. 生成圆形纹理，创建多个精灵展示不同属性
//
// 注意事项:
//   - 使用 app.renderer.generateTexture 从 Graphics 生成纹理。
// ============================================================

import * as PIXI from 'pixi.js';
import { getDemoContainer, clearDemo } from '../state';
import { addTitle, addDescription } from '../utils';

export function showSprite(app: PIXI.Application) {
  const container = getDemoContainer(app);
  clearDemo(app);

  addTitle(container, '精灵 (Sprite)');
  addDescription(container, '纹理、位置、旋转、缩放、tint', 40);

  // 创建一个圆形纹理
  const circleGraphic = new PIXI.Graphics();
  circleGraphic.circle(0, 0, 25);
  circleGraphic.fill(0xffaa00);
  const texture = app.renderer.generateTexture(circleGraphic);

  // 精灵1：基础
  const sprite1 = new PIXI.Sprite(texture);
  sprite1.position.set(50, 80);
  sprite1.rotation = 0.2;
  sprite1.scale.set(1.2);
  container.addChild(sprite1);

  // 精灵2：tint 变色，半透明
  const sprite2 = new PIXI.Sprite(texture);
  sprite2.position.set(130, 90);
  sprite2.tint = 0x00ff00;
  sprite2.alpha = 0.7;
  container.addChild(sprite2);

  // 精灵3：锚点居中
  const sprite3 = new PIXI.Sprite(texture);
  sprite3.anchor.set(0.5);
  sprite3.position.set(220, 100);
  sprite3.scale.set(1.5);
  sprite3.rotation = 0.5;
  container.addChild(sprite3);

  // 使用白色纹理创建色块
  const whiteTexture = PIXI.Texture.WHITE;
  const sprite4 = new PIXI.Sprite(whiteTexture);
  sprite4.position.set(300, 80);
  sprite4.width = 40;
  sprite4.height = 40;
  sprite4.tint = 0xff0000;
  container.addChild(sprite4);
}