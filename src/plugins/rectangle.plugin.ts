// ============================================================
// 文件: src/plugins/rectangle.plugin.ts
// 用途: 绘制矩形的插件（对象字面量形式）
// 上下文: 被 PixiController 注册，处理 'drawRectangle' 类型的消息。
//
// Outline:
// 1. 导入插件类型和 PIXI
// 2. 定义插件对象，包含 name、messageTypes、execute
// 3. 导出插件对象
//
// 使用方法:
//   import { rectanglePlugin } from './plugins/rectangle.plugin';
//   controller.registerPlugin(rectanglePlugin);
// ============================================================

import { PixiPlugin } from './plugin.types';
import * as PIXI from 'pixi.js';

export const rectanglePlugin: PixiPlugin = {
  name: 'RectanglePlugin',
  messageTypes: ['drawRectangle'],

  /**
   * 绘制矩形
   * @param message 应包含 x, y, width, height, color
   * @param app Pixi Application 实例
   */
  execute(message: any, app: PIXI.Application): void {
    const { x, y, width = 60, height = 40, color = 0x00ff00 } = message;
    const rect = new PIXI.Graphics();
    rect.rect(x - width / 2, y - height / 2, width, height); // 以(x,y)为中心
    rect.fill(color);
    app.stage.addChild(rect);
  }
};