import { wsService } from './websocket.service';
import type { DataSource } from '../pixijs/dataSource';

class WebSocketDataSource implements DataSource {
  get isConnected(): boolean {
    return wsService.getConnectionStatus();
  }

  onMessage(callback: (data: any) => void): () => void {
    return wsService.onMessage(callback);
  }

  onStateChange(callback: (connected: boolean) => void): () => void {
    return wsService.onStateChange(() => {
      callback(wsService.getConnectionStatus());
    });
  }

  send(data: any): void {
    wsService.send(data);
  }
}

// 导出单例（也可根据需要每次都 new）
export const webSocketDataSource = new WebSocketDataSource();

