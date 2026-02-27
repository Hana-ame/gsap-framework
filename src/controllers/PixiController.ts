// src/controllers/PixiController.ts

import * as PIXI from 'pixi.js';

export type PixiPlugin = {
  /** 声明此插件能处理的消息类型列表 */
  messageTypes: string[];
  /** 执行绘图逻辑，接收消息和Pixi应用实例 */
  execute(message: any, app: PIXI.Application): void;
};

type PluginHandler = (message: any) => void; // 内部使用的包装函数

export class PixiController {
  private plugins: Set<PluginHandler> = new Set();
  private childMessageHandlers: ((message: any) => void)[] = [];

  /**
   * 注册插件（需要传入已经绑定app的处理函数）
   */
  registerPlugin(handler: PluginHandler): () => void {
    this.plugins.add(handler);
    return () => {
      this.plugins.delete(handler);
    };
  }

  /**
   * 由父组件调用，向Pixi发送消息（分发给所有已注册插件）
   */
  sendToPixi(message: any) {
    this.plugins.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('插件执行错误:', error);
        // 可选：将错误发送给父组件
        this.sendToParent({ type: 'pluginError', error: String(error), originalMessage: message });
      }
    });
  }

  // 以下方法保持不变
  sendToParent(message: any) {
    this.childMessageHandlers.forEach(handler => handler(message));
  }

  onMessageFromPixi(handler: (message: any) => void): () => void {
    this.childMessageHandlers.push(handler);
    return () => {
      this.childMessageHandlers = this.childMessageHandlers.filter(h => h !== handler);
    };
  }

  cleanup() {
    this.plugins.clear();
    this.childMessageHandlers = [];
  }
}