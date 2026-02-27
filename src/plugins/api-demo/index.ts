// ============================================================
// 文件: src/plugins/api-demo/index.ts
// 用途: API 演示插件的主入口。导出符合 PixiPlugin 接口的插件对象。
// 上下文: 被 src/plugins/index.ts 导入并注册到 PixiController。
//
// 处理逻辑:
//   1. 从 './demos' 导入 demoMap，该对象包含了所有消息类型到对应演示函数的映射。
//   2. 从 demoMap 中提取所有消息类型作为插件能处理的 messageTypes。
//   3. 定义插件对象，包含 name、messageTypes、execute 方法。
//   4. 在 execute 中，根据 message.type 从 demoMap 获取对应的演示函数并执行，
//      如果找不到则输出警告。
//
// 使用方法:
//   import { apiDemoPlugin } from './api-demo';
//   controller.registerPlugin(apiDemoPlugin);
//
// 注意事项:
//   - 插件自动支持所有在 demoMap 中注册的消息类型，新增演示只需在 demos/index.ts 中扩展即可。
//   - execute 方法中会先检查 app 实例是否存在，确保安全。
// ============================================================

import { PixiPlugin } from '../plugin.types';
import * as PIXI from 'pixi.js';
import { demoMap } from './demos';

// 从 demoMap 中提取所有消息类型，作为插件能够处理的消息类型列表
const messageTypes = Object.keys(demoMap);

/**
 * API 演示插件
 * 支持多个演示功能，每个演示对应一个消息类型。
 */
export const apiDemoPlugin: PixiPlugin = {
  name: 'ApiDemoPlugin',
  messageTypes,

  /**
   * 插件执行入口
   * @param message - 消息对象，必须包含 type 字段，用于选择演示内容
   * @param app - Pixi Application 实例
   */
  execute(message: any, app: PIXI.Application): void {
    if (!app) {
      console.warn('[ApiDemoPlugin] 未提供 Pixi 应用实例');
      return;
    }

    const demoFunc = demoMap[message.type];
    if (demoFunc) {
      console.log(`[ApiDemoPlugin] 执行演示: ${message.type}`);
      demoFunc(app);
    } else {
      console.warn(`[ApiDemoPlugin] 未知的消息类型: ${message.type}`);
    }
  },
};