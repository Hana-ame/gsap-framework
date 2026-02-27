// ============================================================
// 文件: src/plugins/clear.plugin.ts
// 用途: 清空画布的插件（对象字面量形式）
// 上下文: 被 PixiController 注册，处理 'clear' 类型的消息。
//
// Outline:
// 1. 导入插件类型和 PIXI
// 2. 定义插件对象，包含 name、messageTypes、execute
// 3. 导出插件对象
//
// 使用方法:
//   import { clearPlugin } from './plugins/clear.plugin';
//   controller.registerPlugin(clearPlugin);
// ============================================================

import { PixiPlugin } from './plugin.types';
import * as PIXI from 'pixi.js';

export const clearPlugin: PixiPlugin = {
  name: 'ClearPlugin',
  messageTypes: ['clear'],

  /**
   * 清空画布（移除舞台上所有子对象）
   * @param message 无需特定参数
   * @param app Pixi Application 实例
   */
  execute(message: any, app: PIXI.Application): void {
    app.stage.removeChildren();
  }
};