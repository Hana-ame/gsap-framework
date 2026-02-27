import { useState, useEffect, useCallback, useRef } from 'react';
import { wsService } from './websocket.service';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(wsService.getConnectionStatus());
  const [lastMessage, setLastMessage] = useState<any>(null);

  // 使用 ref 保存取消订阅函数，以便在组件卸载时清理
  const unsubscribeRef = useRef<{ state: () => void; message: () => void }>({
    state: () => {},
    message: () => {},
  });

  useEffect(() => {
    // 确保连接已建立（如果尚未连接）
    wsService.connect();

    // 订阅状态变化
    const unsubscribeState = wsService.onStateChange(() => {
      setIsConnected(wsService.getConnectionStatus());
    });

    // 订阅消息
    const unsubscribeMessage = wsService.onMessage((data) => {
      setLastMessage(data);
    });

    // 保存取消函数
    unsubscribeRef.current = { state: unsubscribeState, message: unsubscribeMessage };

    // 组件卸载时取消订阅
    return () => {
      unsubscribeState();
      unsubscribeMessage();
    };
  }, []);

  // 发送消息的封装
  const sendMessage = useCallback((data: any) => {
    wsService.send(data);
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}	
