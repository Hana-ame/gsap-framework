// ============================================================
// 文件: src/plugins/circle.plugin.ts
// 用途: 绘制圆形的插件（对象字面量形式）
// 上下文: 被 PixiController 注册，处理 'drawCircle' 类型的消息。
//
// Outline:
// 1. 导入插件类型和 PIXI
// 2. 定义插件对象，包含 name、messageTypes、execute
// 3. 导出插件对象
//
// 使用方法:
//   import { circlePlugin } from './plugins/circle.plugin';
//   controller.registerPlugin(circlePlugin);
// ============================================================

import { PixiPlugin } from './plugin.types';
import * as PIXI from 'pixi.js';

export const circlePlugin: PixiPlugin = {
  name: 'CirclePlugin',
  messageTypes: ['drawCircle'],

  /**
   * 绘制圆形
   * @param message 应包含 x, y, radius, color
   * @param app Pixi Application 实例
   */
  execute(message: any, app: PIXI.Application): void {
    const { x, y, radius = 30, color = 0xff0000 } = message;
    const circle = new PIXI.Graphics();
    circle.circle(x, y, radius);
    circle.fill(color);
    app.stage.addChild(circle);
  }
};