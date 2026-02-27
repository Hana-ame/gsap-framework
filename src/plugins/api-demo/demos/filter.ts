// ============================================================
// 文件: src/plugins/api-demo/demos/filter.ts
// 用途: 演示滤镜 (Filter)
//       包括模糊滤镜、颜色矩阵滤镜（灰度）。
// 上下文: 被 demos/index.ts 导入，由 apiDemoPlugin 在收到
//        'apiDemo/filter' 消息时调用。
//
// Outline:
// 1. 导入 PIXI 及辅助函数
// 2. 定义并导出 showFilter 函数
// 3. 生成纹理，创建三个精灵分别应用不同滤镜
//
// 注意事项:
//   - 模糊滤镜使用 BlurFilter，强度 5。
//   - 颜色矩阵使用 grayscale(0.5) 实现半灰度。
// ============================================================

import * as PIXI from 'pixi.js';
import { getDemoContainer, clearDemo } from '../state';
import { addTitle, addDescription } from '../utils';

export function showFilter(app: PIXI.Application) {
  const container = getDemoContainer(app);
  clearDemo(app);

  addTitle(container, '滤镜 (Filter)');
  addDescription(container, '模糊滤镜、颜色矩阵（灰度）', 40);

  const graphic = new PIXI.Graphics();
  graphic.rect(0, 0, 80, 60);
  graphic.fill(0xffaa00);
  graphic.stroke({ width: 2, color: 0xffffff });
  const texture = app.renderer.generateTexture(graphic);

  const sprite = new PIXI.Sprite(texture);
  sprite.position.set(30, 70);
  container.addChild(sprite);

  const blurFilter = new PIXI.BlurFilter({ strength: 5 });
  const spriteBlur = new PIXI.Sprite(texture);
  spriteBlur.position.set(130, 70);
  spriteBlur.filters = [blurFilter];
  container.addChild(spriteBlur);

  const grayMatrix = new PIXI.ColorMatrixFilter();
  grayMatrix.grayscale(0.5, true);
  const spriteGray = new PIXI.Sprite(texture);
  spriteGray.position.set(230, 70);
  spriteGray.filters = [grayMatrix];
  container.addChild(spriteGray);

  const desc = new PIXI.Text({
    text: '左:原图  中:模糊  右:灰度',
    style: { fontSize: 12, fill: 0xcccccc },
  });
  desc.position.set(30, 140);
  container.addChild(desc);
}