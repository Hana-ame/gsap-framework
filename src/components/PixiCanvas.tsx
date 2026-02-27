// src/components/PixiCanvas.tsx
import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { PixiController } from '../controllers/PixiController';
import { plugins } from '../plugins'; // 导入所有插件

interface PixiCanvasProps {
  controller: PixiController;
  width?: number;
  height?: number;
  backgroundColor?: number;
}

export const PixiCanvas: React.FC<PixiCanvasProps> = ({
  controller,
  width = 600,
  height = 400,
  backgroundColor = 0x1099bb,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || !containerRef.current) return;

    let isMounted = true;
    const unregisterFns: (() => void)[] = [];

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

      // --- 为每个插件生成处理函数并注册到控制器 ---
      plugins.forEach(plugin => {
        const handler = (message: any) => {
          // 检查消息类型是否匹配
          if (plugin.messageTypes.includes(message.type)) {
            plugin.execute(message, app);
          }
          // 不匹配则忽略，让其他插件处理
        };
        const unregister = controller.registerPlugin(handler);
        unregisterFns.push(unregister);
      });

      // --- 向父组件发送用户输入消息（保持不变）---
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
        unregisterFns.forEach(fn => fn()); // 取消所有插件注册
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