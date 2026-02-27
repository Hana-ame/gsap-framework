import type { DataSource } from '../pixijs/dataSource';

export class TestDataSource implements DataSource {
  private _isConnected = true;
  private messageListeners = new Set<(data: any) => void>();
  private stateListeners = new Set<(connected: boolean) => void>();
  private intervalId: number | null = null;

  constructor() {
    // 每秒随机发送一条移动消息
    this.intervalId = window.setInterval(() => {
      const msg = {
        type: 'move',
        x: Math.random() * 800,
        y: Math.random() * 600,
      };
      this.messageListeners.forEach(cb => cb(msg));
    }, 1000);
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  onMessage(callback: (data: any) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  onStateChange(callback: (connected: boolean) => void): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  // 模拟连接/断开
  public setConnected(connected: boolean) {
    this._isConnected = connected;
    this.stateListeners.forEach(cb => cb(connected));
  }

  // 清理定时器
  public destroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}

