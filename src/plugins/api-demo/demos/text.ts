// ============================================================
// 文件: src/plugins/api-demo/demos/text.ts
// 用途: 演示文本样式 (Text)
//       包括普通文本、彩色文本、描边文本、阴影文本、组合样式。
// 上下文: 被 demos/index.ts 导入，由 apiDemoPlugin 在收到
//        'apiDemo/text' 消息时调用。
//
// Outline:
// 1. 导入 PIXI 及辅助函数
// 2. 定义并导出 showText 函数
// 3. 在函数内部：获取容器、清除旧内容、添加标题、创建多个文本示例
//
// 注意事项:
//   - 每个文本独立创建，展示不同样式。
// ============================================================

import * as PIXI from 'pixi.js';
import { getDemoContainer, clearDemo } from '../state';
import { addTitle, addDescription } from '../utils';

export function showText(app: PIXI.Application) {
  const container = getDemoContainer(app);
  clearDemo(app);

  addTitle(container, '文本样式 (Text)');

  const text1 = new PIXI.Text({
    text: '普通文本',
    style: { fontSize: 14, fill: 0xffffff },
  });
  text1.position.set(10, 40);
  container.addChild(text1);

  const text2 = new PIXI.Text({
    text: '彩色文本',
    style: { fontSize: 16, fill: 0xffaa00 },
  });
  text2.position.set(10, 70);
  container.addChild(text2);

  const text3 = new PIXI.Text({
    text: '描边文本',
    style: {
      fontSize: 18,
      fill: 0x00ff00,
      stroke: { color: 0x0000ff, width: 2 },
    },
  });
  text3.position.set(10, 100);
  container.addChild(text3);

  const text4 = new PIXI.Text({
    text: '阴影文本',
    style: {
      fontSize: 18,
      fill: 0xffffff,
      dropShadow: {
        alpha: 0.8,
        blur: 4,
        distance: 3,
        angle: Math.PI / 4,
      },
    },
  });
  text4.position.set(150, 100);
  container.addChild(text4);

  const text5 = new PIXI.Text({
    text: '组合样式',
    style: {
      fontSize: 20,
      fill: 0xff00ff,
      stroke: { color: 0xffffff, width: 1 },
      dropShadow: {
        alpha: 0.7,
        blur: 3,
        distance: 2,
        angle: 0,
      },
    },
  });
  text5.position.set(10, 140);
  container.addChild(text5);

  addDescription(container, '支持字体、颜色、描边、阴影等', 180);
}