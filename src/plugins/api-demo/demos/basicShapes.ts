// ============================================================
// 文件: src/plugins/api-demo/demos/basicShapes.ts
// 用途: 演示基础图形绘制 (Graphics)
//       包括矩形、圆形、线条、多边形，以及填充与描边。
// 上下文: 被 demos/index.ts 导入，由 apiDemoPlugin 在收到
//        'apiDemo/basicShapes' 消息时调用。
//
// Outline:
// 1. 导入 PIXI 及必要的辅助函数
// 2. 定义并导出 showBasicShapes 函数
// 3. 在函数内部：获取容器、清除旧内容、添加标题/说明、绘制图形
//
// 注意事项:
//   - 所有图形绘制在同一个 Graphics 对象上，便于演示。
// ============================================================

import * as PIXI from 'pixi.js';
import { getDemoContainer, clearDemo } from '../state';
import { addTitle, addDescription } from '../utils';

export function showBasicShapes(app: PIXI.Application) {
  const container = getDemoContainer(app);
  clearDemo(app);

  addTitle(container, '基础图形 (Graphics)');
  addDescription(container, '矩形、圆形、线条、多边形', 40);

  const graphics = new PIXI.Graphics();

  // 矩形（填充红色，黑色描边）
  graphics.rect(20, 60, 60, 40);
  graphics.fill(0xff0000);
  graphics.stroke({ width: 2, color: 0x000000 });

  // 圆形（填充蓝色，无描边）
  graphics.circle(120, 80, 25);
  graphics.fill(0x0000ff);

  // 线条（绿色，线宽3）
  graphics.moveTo(160, 60);
  graphics.lineTo(200, 100);
  graphics.stroke({ width: 3, color: 0x00ff00 });

  // 多边形（黄色填充，紫色描边）
  graphics.poly([220, 60, 260, 60, 240, 100]);
  graphics.fill(0xffff00);
  graphics.stroke({ width: 2, color: 0xff00ff });

  container.addChild(graphics);
}