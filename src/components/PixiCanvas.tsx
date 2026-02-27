// src/components/PixiCanvas.tsx
import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as PIXI from 'pixi.js';
import { PixiController } from '../controllers/PixiController';

//==============================================================================
// PixiCanvas 组件（PixiJS v8 兼容版，支持控制器就绪 Promise）
// 用途：在 React 中创建并管理 PixiJS 应用实例，处理画布点击事件，
//       通过 ref 暴露控制器就绪状态，确保外部调用时控制器已可用。
// 上下文：应作为 PixiJS 相关功能的根组件，建议配合 ErrorBoundary 使用。
// 
// 使用方法：
//   const canvasRef = useRef<{ ready: () => Promise<PixiController> }>();
//   <PixiCanvas ref={canvasRef} ... />
//   const controller = await canvasRef.current.ready();
//   controller.handleMessage(...);
// 
// 注意事项：
//   - 使用异步初始化（app.init()）以符合 PixiJS v8 规范
//   - 通过 ref.ready() 获取控制器，确保初始化完成
//==============================================================================

export interface PixiCanvasHandle {
  ready: () => Promise<PixiController>;
}

interface PixiCanvasProps {
  width?: number;
  height?: number;
  backgroundColor?: number;
  onCanvasClick?: (x: number, y: number) => void;
}

export const PixiCanvas = forwardRef<PixiCanvasHandle, PixiCanvasProps>(({
  width = 800,
  height = 600,
  backgroundColor = 0x1099bb,
  onCanvasClick,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const controllerRef = useRef<PixiController | null>(null);
  const clickHandlerRef = useRef<((event: PointerEvent) => void) | null>(null);
  
  // 控制器就绪的 Promise 及其 resolve 函数
  const readyPromiseRef = useRef<Promise<PixiController>>(null);
  const resolveReadyRef = useRef<(controller: PixiController) => void>(null);

  // 初始化 ready Promise
  if (!readyPromiseRef.current) {
    readyPromiseRef.current = new Promise((resolve) => {
      resolveReadyRef.current = resolve;
    });
  }

  // 暴露给父组件的句柄
  useImperativeHandle(ref, () => ({
    ready: () => readyPromiseRef.current!,
  }), []);

  //--------------------------------------------------------------------------
  // 创建点击处理器
  //--------------------------------------------------------------------------
  const createClickHandler = useCallback(
    (app: PIXI.Application) => {
      return (event: PointerEvent) => {
        const canvas = app.canvas;
        const rect = canvas.getBoundingClientRect();

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = (event.clientX - rect.left) * scaleX;
        const canvasY = (event.clientY - rect.top) * scaleY;

        const boundedX = Math.max(0, Math.min(canvas.width, canvasX));
        const boundedY = Math.max(0, Math.min(canvas.height, canvasY));

        const margin = 30;
        const randomX = Math.floor(margin + Math.random() * (canvas.width - 2 * margin));
        const randomY = Math.floor(margin + Math.random() * (canvas.height - 2 * margin));

        console.log('========== 画布点击信息 ==========');
        console.log(`点击位置: (${boundedX.toFixed(2)}, ${boundedY.toFixed(2)})`);
        console.log(`画布尺寸: ${canvas.width} x ${canvas.height}`);
        console.log(`可见范围内的测试点: (${randomX}, ${randomY})`);
        console.log('==================================');

        const redPoint = new PIXI.Graphics();
        redPoint.beginFill(0xff0000);
        redPoint.drawCircle(boundedX, boundedY, 5);
        redPoint.endFill();
        app.stage.addChild(redPoint);

        const bluePoint = new PIXI.Graphics();
        bluePoint.beginFill(0x0000ff);
        bluePoint.drawCircle(randomX, randomY, 3);
        bluePoint.endFill();
        app.stage.addChild(bluePoint);

        onCanvasClick?.(boundedX, boundedY);
      };
    },
    [onCanvasClick]
  );

  //--------------------------------------------------------------------------
  // 初始化 PixiJS 应用（异步）
  //--------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    let app: PIXI.Application | null = null;

    const initApp = async () => {
      if (!containerRef.current) return;

      app = new PIXI.Application();
      await app.init({
        width,
        height,
        backgroundColor,
      });

      if (!isMounted) {
        app.destroy(true);
        return;
      }

      containerRef.current.appendChild(app.canvas);
      appRef.current = app;

      const controller = new PixiController(app);
      controllerRef.current = controller;

      // 通知 ready Promise 已就绪
      if (resolveReadyRef.current) {
        resolveReadyRef.current(controller);
      }

      const clickHandler = createClickHandler(app);
      clickHandlerRef.current = clickHandler;
      app.canvas.addEventListener('pointerdown', clickHandler);
    };

    initApp().catch(console.error);

    return () => {
      isMounted = false;
      if (appRef.current) {
        const currentApp = appRef.current;
        if (clickHandlerRef.current) {
          currentApp.canvas.removeEventListener('pointerdown', clickHandlerRef.current);
        }
        currentApp.destroy(true, { children: true });
        appRef.current = null;
        controllerRef.current = null;
      }
    };
  }, [width, height, backgroundColor, createClickHandler]);

  return <div ref={containerRef} style={{ width, height }} />;
});

PixiCanvas.displayName = 'PixiCanvas';