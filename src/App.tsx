// src/App.tsx
import React, { useCallback, useRef } from 'react';
import { PixiCanvas, PixiCanvasHandle } from './components/PixiCanvas';
import { PixiController } from './controllers/PixiController';
import './App.css';

function App() {
  const canvasRef = useRef<PixiCanvasHandle>(null);

  //--------------------------------------------------------------------------
  // 安全的发送消息函数：等待控制器就绪后再发送
  //--------------------------------------------------------------------------
  const sendMessage = useCallback(async (type: string, params?: any) => {
    try {
      const controller = await canvasRef.current?.ready();
      if (!controller) {
        console.warn('无法获取控制器');
        return;
      }

      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      const margin = 50;
      const x = margin + Math.random() * (canvas.width - 2 * margin);
      const y = margin + Math.random() * (canvas.height - 2 * margin);

      switch (type) {
        case 'circle':
          controller.handleMessage({
            type: 'drawCircle',
            x,
            y,
            radius: 30,
            color: 0xff00ff,
            ...params,
          });
          break;
        case 'rectangle':
          controller.handleMessage({
            type: 'drawRectangle',
            x,
            y,
            width: 60,
            height: 40,
            color: 0x00ff00,
            ...params,
          });
          break;
        case 'clear':
          controller.handleMessage({ type: 'clear' });
          break;
        default:
          console.warn('未知消息类型', type);
      }
    } catch (error) {
      console.error('发送消息失败', error);
    }
  }, []);

  //--------------------------------------------------------------------------
  // 点击回调（仅记录，无需等待）
  //--------------------------------------------------------------------------
  const handleCanvasClick = useCallback((x: number, y: number) => {
    console.log(`业务处理：点击坐标 (${x}, ${y})`);
  }, []);

  return (
    <div className="App">
      <h1>PixiJS v8 测试项目</h1>
      <div className="toolbar">
        <button onClick={() => sendMessage('circle')}>画圆</button>
        <button onClick={() => sendMessage('rectangle')}>画矩形</button>
        <button onClick={() => sendMessage('clear')}>清除</button>
      </div>
      <PixiCanvas
        ref={canvasRef}
        width={800}
        height={600}
        backgroundColor={0x1099bb}
        onCanvasClick={handleCanvasClick}
      />
    </div>
  );
}

export default App;