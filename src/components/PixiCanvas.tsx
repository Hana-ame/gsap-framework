// ============================================================
// 文件: src/components/PixiCanvas.tsx
// 用途: PixiJS 画布 React 组件，管理 Pixi 应用生命周期，
//       监听画布上的鼠标/触摸事件，并通过 Controller 发送带时间戳的消息。
//       初始化完成后通过 onAppInit 回调将 app 实例传出。
// 上下文: 应在 React 应用中使用，作为画布容器。接收 PixiController 实例，
//        并将用户交互转换为统一格式的消息发送给 Controller。
//
// 版本: 2.1.0 (修复销毁错误)
//    - 添加 isMounted 标志，防止在卸载后执行初始化回调
//    - 在清理时先停止 ticker，再用 try-catch 包裹 destroy，避免未捕获异常
//    - 在 then 回调中也检查挂载状态，确保只有挂载时才操作 DOM 和回调
//
// Outline:
// 1. 导入依赖与类型定义
// 2. PixiCanvasProps 接口定义
// 3. PixiCanvas 组件
//    a. 状态管理 (containerRef, appRef)
//    b. 初始化 Pixi 应用与事件绑定 (useEffect)
//    c. 组件卸载清理
//    d. 渲染容器 div
// 4. 辅助函数: 生成带时间戳的事件对象
// ============================================================

// ============================================================
// 文件: src/components/PixiCanvas.tsx
// 用途: PixiJS 画布 React 组件，管理 Pixi 应用生命周期，
//       监听画布上的鼠标/触摸事件，并通过 Controller 发送带时间戳的消息。
// 版本: 2.2.0
//    - 修复剧烈闪烁和绘图失效问题
//    - 添加挂载状态和 app 引用检查，防止异步竞态
//    - 确保每次重建前彻底清理旧 canvas
//    - 使用 useCallback 稳定回调函数
// ============================================================

import React, { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { PixiController } from '../controllers/PixiController';

interface PixiCanvasProps {
  controller: PixiController;
  width?: number;
  height?: number;
  backgroundColor?: number;
  onAppInit?: (app: PIXI.Application) => void;
}

export const PixiCanvas: React.FC<PixiCanvasProps> = ({
  controller,
  width = 800,
  height = 600,
  backgroundColor = 0x1099bb,
  onAppInit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const isMountedRef = useRef(true);

  // 稳定 onAppInit 回调，避免因父组件重传新函数导致重建
  const handleAppInit = useCallback((app: PIXI.Application) => {
    onAppInit?.(app);
  }, [onAppInit]);

  useEffect(() => {
    isMountedRef.current = true;
    const container = containerRef.current;
    if (!container) return;

    // 彻底清理容器内残留的 canvas（防止多个 canvas 叠加）
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // 销毁已有的 Pixi 应用（如果有）
    if (appRef.current) {
      try {
        appRef.current.ticker?.stop();
        appRef.current.destroy(true);
      } catch (e) {
        console.warn('销毁旧 Pixi 应用时出错:', e);
      } finally {
        appRef.current = null;
      }
    }

    // 创建新应用
    const app = new PIXI.Application();
    appRef.current = app;

    app.init({
      width,
      height,
      backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })
      .then(() => {
        // 如果组件已卸载，直接销毁并返回
        if (!isMountedRef.current) {
          app.destroy(true);
          return;
        }

        // 检查 appRef.current 是否还是当前这个 app
        // 如果不是，说明在异步过程中已经被新 app 替代，当前 app 应废弃
        if (appRef.current !== app) {
          app.destroy(true);
          return;
        }

        if (container && app.canvas) {
          container.appendChild(app.canvas);
          handleAppInit(app);

          // 事件处理函数（使用 app 闭包，确保始终操作当前 app）
          const handlePointerEvent = (eventType: string) => (event: MouseEvent | TouchEvent) => {
            event.preventDefault();

            let clientX = 0, clientY = 0;
            if (event instanceof MouseEvent) {
              clientX = event.clientX;
              clientY = event.clientY;
            } else if (event instanceof TouchEvent && event.touches.length > 0) {
              clientX = event.touches[0].clientX;
              clientY = event.touches[0].clientY;
            }

            const canvas = app.canvas;
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            const message = {
              type: eventType,
              x: Math.max(0, Math.min(x, canvas.width)),
              y: Math.max(0, Math.min(y, canvas.height)),
              timestamp: Date.now(),
              originalEvent: event,
            };

            controller.sendToParent(message);
          };

          // 绑定事件
          app.canvas.addEventListener('mousedown', handlePointerEvent('pointerdown'));
          app.canvas.addEventListener('mousemove', handlePointerEvent('pointermove'));
          app.canvas.addEventListener('mouseup', handlePointerEvent('pointerup'));
          app.canvas.addEventListener('mouseleave', handlePointerEvent('pointerleave'));
          app.canvas.addEventListener('touchstart', handlePointerEvent('pointerdown'), { passive: false });
          app.canvas.addEventListener('touchmove', handlePointerEvent('pointermove'), { passive: false });
          app.canvas.addEventListener('touchend', handlePointerEvent('pointerup'));
          app.canvas.addEventListener('touchcancel', handlePointerEvent('pointerleave'));
          app.canvas.addEventListener('click', handlePointerEvent('click'));
        }
      })
      .catch(error => {
        console.error('PixiJS 初始化失败:', error);
      });

    // 清理函数
    return () => {
      isMountedRef.current = false;

      // 销毁当前 app
      if (appRef.current) {
        try {
          appRef.current.ticker?.stop();
          appRef.current.destroy(true);
        } catch (e) {
          console.warn('销毁 Pixi 应用时出错:', e);
        } finally {
          appRef.current = null;
        }
      }

      // 再次确保容器内无残留 canvas
      if (container) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }
    };
  }, [controller, width, height, backgroundColor, handleAppInit]);

  return <div ref={containerRef} style={{ width, height }} />;
};