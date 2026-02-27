// src/controllers/PixiController.ts
type MessageHandler = (message: any) => void;
type Plugin = (message: any) => void;

export class PixiController {
  private plugins: Set<Plugin> = new Set();           // 存储所有插件
  private childMessageHandlers: MessageHandler[] = [];

  /**
   * 注册一个插件，当收到父组件消息时会被调用
   * @param plugin 插件函数，接收消息参数
   * @returns 取消注册的函数
   */
  registerPlugin(plugin: Plugin): () => void {
    this.plugins.add(plugin);
    return () => {
      this.plugins.delete(plugin);
    };
  }

  /**
   * 由父组件调用，向Pixi发送消息（将分发给所有已注册的插件）
   */
  sendToPixi(message: any) {
    this.plugins.forEach(plugin => {
      try {
        plugin(message);
      } catch (error) {
        console.error('插件执行错误:', error);
      }
    });
  }

  // 以下方法保持不变（用于Pixi向父组件发送消息）
  sendToParent(message: any) {
    this.childMessageHandlers.forEach(handler => handler(message));
  }

  onMessageFromPixi(handler: MessageHandler): () => void {
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