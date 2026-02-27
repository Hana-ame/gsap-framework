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
  width = 600,      // 默认改小
  height = 400,
  backgroundColor = 0x1099bb,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || !containerRef.current) return;

    let isMounted = true;
    let unregisterPlugin: (() => void) | null = null;

    const initPixi = async () => {
      const app = new PIXI.Application();
      await app.init({
        width,
        height,
        backgroundColor,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
      });

      if (!isMounted) {
        await app.destroy(true);
        return;
      }

      appRef.current = app;
      initializedRef.current = true;
      containerRef.current!.appendChild(app.canvas);
      const canvas = app.canvas;

      // --- 定义消息处理插件（闭包捕获 app）---
      const messagePlugin = (message: any) => {
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
        // 可继续扩展其他指令
      };

      // 将插件注册到控制器
      unregisterPlugin = controller.registerPlugin(messagePlugin);

      // --- 向父组件发送消息（用户输入）---
      const handleCanvasClick = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        controller.sendToParent({ type: 'canvasClick', x, y });
      };
      canvas.addEventListener('click', handleCanvasClick);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        controller.sendToParent({ type: 'keydown', key: e.key, code: e.code });
      };
      window.addEventListener('keydown', handleKeyDown);

      // 保存清理函数
      (app as any)._cleanup = () => {
        canvas.removeEventListener('click', handleCanvasClick);
        window.removeEventListener('keydown', handleKeyDown);
        if (unregisterPlugin) unregisterPlugin(); // 取消插件注册
      };
    };

    initPixi();

    return () => {
      isMounted = false;
      if (appRef.current) {
        (appRef.current as any)._cleanup?.();
        appRef.current.destroy(true);
        appRef.current = null;
        initializedRef.current = false;
      }
      controller.cleanup?.();
    };
  }, [controller, width, height, backgroundColor]);

  return <div ref={containerRef} style={{ border: '1px solid #ccc' }} />;
};