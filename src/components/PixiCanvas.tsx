// src/components/PixiCanvas.tsx
import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { PixiController } from '../controllers/PixiController';

interface PixiCanvasProps {
  controller: PixiController;
  width?: number;
  height?: number;
  backgroundColor?: number;
}

export const PixiCanvas: React.FC<PixiCanvasProps> = ({
  controller,
  width = 640,
  height = 320,
  backgroundColor = 0x1099bb,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const initializedRef = useRef(false); // 防止重复初始化

  useEffect(() => {
    // 如果已经初始化或容器不存在，则返回
    if (initializedRef.current || !containerRef.current) return;

    let isMounted = true; // 标志组件是否仍然挂载

    // 异步初始化Pixi应用 (v8 方式)
    const initPixi = async () => {
      // 创建应用实例（构造函数不再接受参数）
      const app = new PIXI.Application();

      // 初始化应用
      await app.init({
        width,
        height,
        backgroundColor,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
      });

      if (!isMounted) {
        // 如果组件已卸载，销毁应用
        await app.destroy(true);
        return;
      }

      // 保存应用实例
      appRef.current = app;
      initializedRef.current = true;

      // 将画布挂载到容器
      containerRef.current!.appendChild(app.canvas);

      // 获取canvas元素（即 app.canvas）
      const canvas = app.canvas;

      // 处理来自父组件的消息
      const handleParentMessage = (message: any) => {
        console.log('[Pixi] 收到父组件消息:', message);
        if (message.type === 'drawCircle') {
          const { x, y, radius = 30, color = 0xff0000 } = message;
          const circle = new PIXI.Graphics();
          circle.beginFill(color);
          circle.drawCircle(x, y, radius);
          circle.endFill();
          app.stage.addChild(circle);
        } else if (message.type === 'drawRectangle') {
          const { x, y, width = 50, height = 50, color = 0x00ff00 } = message;
          const rect = new PIXI.Graphics();
          rect.beginFill(color);
          rect.drawRect(x, y, width, height);
          rect.endFill();
          app.stage.addChild(rect);
        } else if (message.type === 'clear') {
          app.stage.removeChildren();
        }
      };

      controller.onParentMessage(handleParentMessage);

      // 向父组件发送消息
      const handleCanvasClick = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        controller.sendToParent({ type: 'canvasClick', x, y });
      };
      canvas.addEventListener('click', handleCanvasClick);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        controller.sendToParent({ type: 'keydown', key: e.key, code: e.code });
      };
      window.addEventListener('keydown', handleKeyDown);

      // 保存事件处理器以便清理
      (app as any)._cleanup = () => {
        canvas.removeEventListener('click', handleCanvasClick);
        window.removeEventListener('keydown', handleKeyDown);
      };
    };

    initPixi();

    // 清理函数
    return () => {
      isMounted = false;
      if (appRef.current) {
        // 如果有清理函数，先调用
        if ((appRef.current as any)._cleanup) {
          (appRef.current as any)._cleanup();
        }
        appRef.current.destroy(true);
        appRef.current = null;
        initializedRef.current = false;
      }
      controller.cleanup?.();
    };
  }, [controller, width, height, backgroundColor]); // 当这些属性变化时重新创建画布

  return <div ref={containerRef} style={{ border: '1px solid #ccc' }} />;
};