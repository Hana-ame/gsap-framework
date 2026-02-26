import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { DataSource } from './dataSource';
import { webSocketDataSource } from '../websocket/webSocketDataSource';

interface PixiExampleProps {
  /** 数据源，默认使用 WebSocket 实现 */
  dataSource?: DataSource;
}

export const PixiExample: React.FC<PixiExampleProps> = ({
  dataSource = webSocketDataSource,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const circleRef = useRef<PIXI.Graphics | null>(null);

  // 本地状态，用于驱动 UI 更新
  const [isConnected, setIsConnected] = useState(dataSource.isConnected);
  const [lastMessage, setLastMessage] = useState<any>(null);

  // 订阅数据源的消息和状态变化
  useEffect(() => {
    const unsubMsg = dataSource.onMessage(setLastMessage);
    const unsubState = dataSource.onStateChange(setIsConnected);
    return () => {
      unsubMsg();
      unsubState();
    };
  }, [dataSource]);

  // 初始化 PixiJS 应用（不变）
  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application({
      width: 800,
      height: 600,
      backgroundColor: 0x1099bb,
      antialias: true,
    });

    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    const circle = new PIXI.Graphics();
    circle.beginFill(0xff0000);
    circle.drawCircle(0, 0, 50);
    circle.endFill();
    circle.position.set(400, 300);
    app.stage.addChild(circle);
    circleRef.current = circle;

    return () => {
      app.destroy(true, { children: true });
      appRef.current = null;
      circleRef.current = null;
    };
  }, []);

  // 根据收到的消息更新图形
  useEffect(() => {
    if (!lastMessage || !circleRef.current) return;
    const msg = lastMessage;
    if (msg.type === 'move' && msg.x !== undefined && msg.y !== undefined) {
      circleRef.current.position.set(msg.x, msg.y);
    } else if (msg.type === 'color' && msg.color !== undefined) {
      circleRef.current.clear();
      circleRef.current.beginFill(msg.color);
      circleRef.current.drawCircle(0, 0, 50);
      circleRef.current.endFill();
    }
  }, [lastMessage]);

  return (
    <div>
      <h2>PixiJS 示例</h2>
      <p>连接状态: {isConnected ? '✅ 已连接' : '❌ 未连接'}</p>
      <div ref={containerRef} style={{ border: '1px solid #ccc' }} />
    </div>
  );
};

export default PixiExample;
