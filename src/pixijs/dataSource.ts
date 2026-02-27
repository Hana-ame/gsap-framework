// not used.

export interface DataSource {
  /** 当前连接状态 */
  readonly isConnected: boolean;

  /** 订阅消息，返回取消订阅函数 */
  onMessage(callback: (data: any) => void): () => void;

  /** 订阅连接状态变化，返回取消订阅函数 */
  onStateChange(callback: (connected: boolean) => void): () => void;

  /** 可选：发送消息 */
  send?(data: any): void;
}

