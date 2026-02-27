
// websocket.service.ts
type Listener = () => void;
type MessageListener = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private isConnected = false;

  // 状态变化监听器（当连接状态改变时触发）
  private stateListeners: Set<Listener> = new Set();
  // 消息监听器（当收到消息时触发）
  private messageListeners: Set<MessageListener> = new Set();

  constructor(url: string) {
    this.url = url;
  }

  // 建立连接
  public connect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this.isConnected = true;
      this.notifyStateChange();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageListeners.forEach(listener => listener(data));
      } catch (error) {
        console.error('Failed to parse message', error);
      }
    };

    this.socket.onclose = () => {
      this.isConnected = false;
      this.notifyStateChange();
    };

    this.socket.onerror = (error) => {
      // 错误通常也会触发 close，所以只打印日志
      console.error('WebSocket error', error);
    };
  }

  // 断开连接
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // 发送消息
  public send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected. Message not sent.');
    }
  }

  // 获取当前连接状态
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // 订阅状态变化
  public onStateChange(listener: Listener): () => void {
    this.stateListeners.add(listener);
    // 返回取消订阅函数
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  // 订阅消息
  public onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  // 通知所有状态监听器
  private notifyStateChange(): void {
    this.stateListeners.forEach(listener => listener());
  }
}

// 导出单例实例（你也可以在应用启动时传入具体的 URL）
export const wsService = new WebSocketService('wss://example.com/socket');
