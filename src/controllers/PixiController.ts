// ============================================================
// 文件: src/controllers/PixiController.ts
// 用途: Pixi 控制器，作为消息中枢。管理插件、分发绘图消息，
//       并负责将画布事件（带时间戳）发送给 React 父组件。
// 上下文: 被 PixiCanvas 和 React 组件使用。它不依赖具体渲染逻辑，
//        只负责消息路由。
//
// Outline:
// 1. 导入插件类型
// 2. PixiController 类定义
//    a. 私有属性: plugins, parentMessageHandler, app
//    b. 构造函数
//    c. 注册插件方法: registerPlugin (接受符合 PixiPlugin 接口的对象)
//    d. 设置应用实例: setApp
//    e. 发送消息到 Pixi (绘图): sendToPixi
//    f. 发送消息到父组件: sendToParent
//    g. 监听来自父组件的消息: onMessageFromParent
//
// 注意事项:
//   - 插件可以是对象字面量或类实例，只需包含 messageTypes 和 execute。
//   - 调用 sendToPixi 前必须通过 setApp 设置 Pixi 应用实例。
// ============================================================

import { PixiPlugin } from '../plugins/plugin.types';
import * as PIXI from 'pixi.js';

export class PixiController {
  private plugins: PixiPlugin[] = [];
  private parentMessageHandler?: (message: any) => void;
  private app: PIXI.Application | null = null;

  constructor() {}

  /**
   * 设置 Pixi 应用实例，供插件执行时使用
   * @param app Pixi Application 实例
   */
  setApp(app: PIXI.Application): void {
    this.app = app;
  }

  /**
   * 注册一个插件（支持对象字面量或类实例）
   * @param plugin 符合 PixiPlugin 接口的插件对象
   */
  registerPlugin(plugin: PixiPlugin): void {
    this.plugins.push(plugin);
    console.log(`[Controller] 插件已注册: ${plugin.name || '未命名插件'}`);
  }

  /**
   * 向 Pixi 发送消息（通常用于绘图指令）
   * 该方法会被 React 组件调用，自动寻找匹配的插件执行
   * @param message 消息对象，应包含 type 字段
   */
  sendToPixi(message: any): void {
    if (!this.app) {
      console.warn('[Controller] Pixi 应用实例未设置，无法执行插件');
      return;
    }

    console.log(`[Controller] 收到消息发往 Pixi:`, message);

    const handled = this.plugins.some(plugin => {
      if (plugin.messageTypes.includes(message.type)) {
        try {
          plugin.execute(message, this.app!);
          return true;
        } catch (error) {
          console.error(`[Controller] 插件 ${plugin.name || '未知'} 执行失败:`, error);
          return false;
        }
      }
      return false;
    });

    if (!handled) {
      console.log(`[Controller] 没有插件处理消息类型: ${message.type}`);
    }
  }

  /**
   * 向父组件 (通常是 React 组件) 发送消息
   * 此方法由 PixiCanvas 调用，传递用户交互事件
   * @param message 消息对象，包含 timestamp 字段
   */
  sendToParent(message: any): void {
    if (this.parentMessageHandler) {
      this.parentMessageHandler(message);
    } else {
      console.warn('[Controller] 父组件消息处理器未设置，消息被丢弃:', message);
    }
  }

  /**
   * 设置来自父组件的消息监听器
   * @param handler 处理函数
   */
  onMessageFromParent(handler: (message: any) => void): void {
    this.parentMessageHandler = handler;
  }

  /**
   * 获取当前注册的插件列表 (用于调试)
   */
  getPlugins(): PixiPlugin[] {
    return this.plugins;
  }
}

export type { PixiPlugin };