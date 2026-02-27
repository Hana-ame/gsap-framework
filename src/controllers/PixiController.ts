// src/controllers/PixiController.ts
/**
 * 控制器类 - 负责React父组件与Pixi画布之间的双向通信
 * 当前为dummy实现，但设计为可轻松扩展为WebSocket版本
 */
type MessageHandler = (message: any) => void;

export class PixiController {
  private parentMessageHandler: MessageHandler | null = null;
  private childMessageHandlers: MessageHandler[] = [];

  /**
   * 由Pixi组件内部调用，注册收到父组件消息时的处理函数
   */
  onParentMessage(handler: MessageHandler) {
    this.parentMessageHandler = handler;
  }

  /**
   * 由父组件调用，向Pixi发送消息（例如绘图指令）
   */
  sendToPixi(message: any) {
    if (this.parentMessageHandler) {
      this.parentMessageHandler(message);
    } else {
      console.warn('Pixi组件尚未就绪，消息被忽略');
    }
  }

  /**
   * 由Pixi组件内部调用，向所有监听者发送消息（例如用户输入）
   */
  sendToParent(message: any) {
    this.childMessageHandlers.forEach(handler => handler(message));
  }

  /**
   * 由父组件调用，监听来自Pixi的消息
   * @returns 取消订阅的函数
   */
  onMessageFromPixi(handler: MessageHandler): () => void {
    this.childMessageHandlers.push(handler);
    return () => {
      this.childMessageHandlers = this.childMessageHandlers.filter(h => h !== handler);
    };
  }

  /**
   * 清理资源（可选）
   */
  cleanup() {
    this.parentMessageHandler = null;
    this.childMessageHandlers = [];
  }
}

// 未来可扩展为WebSocket版本：
// export class WebSocketPixiController extends PixiController {
//   private ws: WebSocket;
//   constructor(url: string) {
//     super();
//     this.ws = new WebSocket(url);
//     this.ws.onmessage = (event) => {
//       // 将服务器消息转发给Pixi组件
//       const message = JSON.parse(event.data);
//       this.sendToPixi(message);
//     };
//     // 也可以将Pixi发来的消息发送给服务器
//     const originalSendToParent = this.sendToParent.bind(this);
//     this.sendToParent = (message) => {
//       this.ws.send(JSON.stringify(message));
//       originalSendToParent(message);
//     };
//   }
// }