// ============================================================
// 文件: src/plugins/plugin.types.ts
// 用途: 定义 Pixi 插件的标准接口。所有绘图插件必须符合此接口。
//       插件可以是对象字面量（推荐）或类实例，只需包含 messageTypes 和 execute。
// 上下文: 被 PixiController 和各个具体插件引用。
//
// Outline:
// 1. 导入 PIXI 类型
// 2. 定义 PixiPlugin 接口
//    - messageTypes: 插件能处理的消息类型列表
//    - execute: 执行绘图逻辑的函数
//    - name: (可选) 插件名称，用于日志和调试
//
// 使用方法:
//   export const myPlugin: PixiPlugin = {
//     name: 'MyPlugin',
//     messageTypes: ['drawSomething'],
//     execute: (message, app) => { ... }
//   };
// ============================================================

import * as PIXI from 'pixi.js';

export interface PixiPlugin {
  /** 此插件能够处理的消息类型列表 */
  messageTypes: string[];

  /** 执行绘图逻辑。若消息类型不匹配或参数错误，应抛出错误。 */
  execute(message: any, app: PIXI.Application): void;

  /** 插件名称（可选），用于日志和调试 */
  name?: string;
}