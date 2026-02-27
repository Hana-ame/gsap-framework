// ============================================================
// 文件: src/components/PixiCanvas.tsx
// 用途: PixiJS 画布 React 组件，管理 Pixi 应用生命周期，
//       监听画布上的鼠标/触摸事件，并通过 Controller 发送带时间戳的消息。
//       初始化完成后通过 onAppInit 回调将 app 实例传出。
// 上下文: 应在 React 应用中使用，作为画布容器。接收 PixiController 实例，
//        并将用户交互转换为统一格式的消息发送给 Controller。
//
// 版本: 2.3.0
//    - 修复严格模式下二次销毁 app 实例导致的错误
//    - 引入 Symbol 标记 _DESTROYED，确保每个 app 只销毁一次
//    - 封装 safeDestroy 函数统一处理销毁逻辑
//    - 保留 isMountedRef 和 appRef 检查，增强稳定性
//
// 处理逻辑:
// 1. 组件挂载时，创建 PIXI.Application 并异步初始化。
// 2. 初始化完成后，将 canvas 挂载到容器，绑定事件监听，并通过 onAppInit 回调通知父组件。
// 3. 组件卸载或依赖项变化时，清理当前 app 实例：
//    - 停止 ticker
//    - 调用 safeDestroy 销毁 app（附带标记检查）
//    - 清空容器内的 canvas
// 4. 异步初始化过程中，若组件已卸载或 app 已被替换，则安全销毁新创建的 app。
//
// 使用方法:
//   <PixiCanvas
//     controller={controller}
//     width={800}
//     height={600}
//     backgroundColor={0x1099bb}
//     onAppInit={(app) => controller.setApp(app)}
//   />
//
// 注意事项:
//   - 必须确保 controller 在组件生命周期内保持稳定引用。
//   - 使用 isMountedRef 防止异步操作更新已卸载的组件。
//   - safeDestroy 中的标记 Symbol 可防止同一个 app 被多次销毁。
// ============================================================

import React, { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { PixiController } from '../controllers/PixiController';

interface PixiCanvasProps {
  controller: PixiController;          // 外部传入的控制器实例，用于发送事件
  width?: number;                       // 画布宽度（像素）
  height?: number;                      // 画布高度（像素）
  backgroundColor?: number;             // 背景色（十六进制数，如 0x1099bb）
  onAppInit?: (app: PIXI.Application) => void; // 初始化完成后的回调，通常将 app 注入 controller
}

/**
 * 用于标记 app 实例是否已被销毁的私有 Symbol
 * 每个 app 对象上会添加这个 Symbol 属性，值为 true 表示已销毁。
 * 这样可以防止在严格模式或异步操作中对同一个 app 多次调用 destroy 导致错误。
 */
const DESTROYED = Symbol('pixi-app-destroyed');

/**
 * 安全销毁 app 实例，避免重复销毁
 * @param app PIXI.Application 实例（可能为 null 或 undefined）
 * 
 * 内部细节：
 * - 首先检查 app 是否存在以及是否已被标记销毁，若已销毁则直接返回。
 * - 调用 ticker.stop() 显式停止动画循环（虽然 destroy 内部也会做，但提前停止更安全）。
 * - 调用 app.destroy(true) 销毁所有资源，包括 stage、渲染器等。
 * - 销毁后通过 (app as any)[DESTROYED] = true 打上标记，防止后续再次销毁。
 * - 捕获可能出现的异常并打印警告，避免导致整个组件崩溃。
 */
function safeDestroy(app: PIXI.Application | null | undefined) {
  if (!app) return;
  // 检查自定义标记，若已销毁则跳过
  if ((app as any)[DESTROYED]) return;

  try {
    // 先停止 ticker，确保销毁时不再触发任何更新
    app.ticker?.stop();
    // 第二个参数 true 表示移除 canvas 并销毁所有子项
    app.destroy(true);
    // 标记为已销毁
    (app as any)[DESTROYED] = true;
  } catch (e) {
    console.warn('销毁 Pixi 应用时出错:', e);
  }
}

/**
 * PixiCanvas React 函数组件
 * 
 * 内部逻辑详解：
 * - 使用 containerRef 引用包裹画布的 <div> 元素。
 * - 使用 appRef 保存当前活跃的 PIXI.Application 实例，确保在多次渲染中引用一致。
 * - 使用 isMountedRef 标记组件是否仍处于挂载状态，用于防止异步初始化完成后对已卸载组件的状态更新。
 * - 使用 useCallback 稳定 onAppInit 回调，避免因父组件传递的新函数导致 useEffect 重复执行。
 * - useEffect 是核心：负责创建、初始化和销毁 Pixi 应用，并绑定事件。
 *   - 首先清除容器内可能残留的 canvas（防止因快速刷新或热更新导致多个 canvas 叠加）。
 *   - 若已有 appRef.current，则安全销毁（通常是上一个渲染周期遗留的实例）。
 *   - 创建新的 PIXI.Application 实例，调用其 init 方法异步初始化。
 *   - 初始化完成后进行一系列检查：
 *     - 组件是否仍然挂载 (isMountedRef.current)
 *     - 当前 appRef.current 是否仍然指向这个 app（防止在异步过程中又被新的 app 替换，例如依赖项变化导致 useEffect 重新执行）
 *     - 若检查不通过，则调用 safeDestroy 销毁此 app 并返回。
 *   - 检查通过后，将 app.canvas 挂载到容器，并通过 handleAppInit 回调通知父组件（通常是将 app 设置到 controller 中）。
 *   - 然后绑定各种鼠标/触摸事件，将事件转换为统一格式的消息，通过 controller.sendToParent 发送。
 *   - 在清理函数（return）中，标记组件已卸载，安全销毁 app，并再次清空容器。
 */
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

  /**
   * 使用 useCallback 稳定化 onAppInit 回调，避免因父组件重传新函数导致 useEffect 重新执行。
   * 注意：如果父组件每次渲染都传递一个新的箭头函数，useCallback 并不能完全避免，
   * 但此处将 onAppInit 作为依赖项，当它变化时回调会更新，这是合理的。
   */
  const handleAppInit = useCallback((app: PIXI.Application) => {
    onAppInit?.(app);
  }, [onAppInit]);

  useEffect(() => {
    // 标记组件已挂载
    isMountedRef.current = true;
    const container = containerRef.current;
    if (!container) return;

    // --- 清理容器内残留的 canvas ---
    // 在某些情况（如热更新、快速刷新）下，容器内可能已有 canvas，手动清除以防多个 canvas 叠加
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // --- 销毁之前的 Pixi 应用（如果有）---
    // 当依赖项变化（如 width, height 等）导致 useEffect 重新执行时，需要销毁旧 app
    if (appRef.current) {
      safeDestroy(appRef.current);
      appRef.current = null;
    }

    // --- 创建新应用并初始化 ---
    const app = new PIXI.Application();
    appRef.current = app;

    // 注意：init 是异步方法，返回 Promise
    app.init({
      width,
      height,
      backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1, // 适配高 DPI 屏幕
      autoDensity: true,                        // 自动调整 canvas CSS 尺寸以匹配分辨率
    })
      .then(() => {
        // --- 初始化成功后的检查 ---
        // 1. 如果组件已卸载，则直接销毁并返回
        if (!isMountedRef.current) {
          safeDestroy(app);
          return;
        }

        // 2. 检查 appRef.current 是否仍然指向当前 app
        //    若在异步过程中，useEffect 因依赖变化再次执行，创建了新 app 并赋值给 appRef.current，
        //    此时 appRef.current 不再是这个 app，说明当前 app 已被取代，应当废弃。
        if (appRef.current !== app) {
          safeDestroy(app);
          return;
        }

        // --- 将 canvas 挂载到 DOM 容器 ---
        if (container && app.canvas) {
          container.appendChild(app.canvas);

          // 通知父组件 app 已初始化，通常父组件会调用 controller.setApp(app)
          handleAppInit(app);

          // --- 事件处理函数（使用 app 闭包，确保始终操作当前 app）---
          // 注意：由于事件绑定是在此 then 块内，且 app 变量引用当前实例，事件处理中使用的 app 始终是当前 app，
          // 即使 appRef.current 后来被替换，这些事件处理器仍然引用旧的 app，但此时旧的 app 已经被销毁或废弃，
          // 而且事件监听器也会在组件卸载或 app 替换时被移除（因为 canvas 元素会被移除），所以不会造成内存泄漏。
          const handlePointerEvent = (eventType: string) => (event: MouseEvent | TouchEvent) => {
            event.preventDefault(); // 防止默认行为（如触摸滚动）

            // 获取客户端坐标（相对于视口）
            let clientX = 0, clientY = 0;
            if (event instanceof MouseEvent) {
              clientX = event.clientX;
              clientY = event.clientY;
            } else if (event instanceof TouchEvent && event.touches.length > 0) {
              clientX = event.touches[0].clientX;
              clientY = event.touches[0].clientY;
            }

            // 将视口坐标转换为 canvas 局部坐标（考虑 canvas 在页面上的偏移）
            const canvas = app.canvas;
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            // 构建标准消息对象，包含坐标（限制在 canvas 范围内）、时间戳和原始事件
            const message = {
              type: eventType,
              x: Math.max(0, Math.min(x, canvas.width)),  // 确保坐标不超出画布边界
              y: Math.max(0, Math.min(y, canvas.height)),
              timestamp: Date.now(),
              originalEvent: event, // 可选，保留原始事件以备高级用途
            };

            // 通过 controller 将事件发送给父组件
            controller.sendToParent(message);
          };

          // --- 绑定事件监听器 ---
          // 鼠标/触摸事件统一转换为 pointer 系列事件，便于上层统一处理
          app.canvas.addEventListener('mousedown', handlePointerEvent('pointerdown'));
          app.canvas.addEventListener('mousemove', handlePointerEvent('pointermove'));
          app.canvas.addEventListener('mouseup', handlePointerEvent('pointerup'));
          app.canvas.addEventListener('mouseleave', handlePointerEvent('pointerleave'));
          // touch 事件需注意 passive 选项：对于 touchstart 和 touchmove，设置 { passive: false } 以便调用 preventDefault 阻止滚动
          app.canvas.addEventListener('touchstart', handlePointerEvent('pointerdown'), { passive: false });
          app.canvas.addEventListener('touchmove', handlePointerEvent('pointermove'), { passive: false });
          app.canvas.addEventListener('touchend', handlePointerEvent('pointerup'));
          app.canvas.addEventListener('touchcancel', handlePointerEvent('pointerleave'));
          app.canvas.addEventListener('click', handlePointerEvent('click'));
        }
      })
      .catch(error => {
        // 初始化失败时的处理：打印错误，并尝试销毁 app（safeDestroy 会处理未完全初始化的状态）
        console.error('PixiJS 初始化失败:', error);
        safeDestroy(app);
      });

    // --- 清理函数（组件卸载或依赖变化时执行）---
    return () => {
      // 标记组件已卸载
      isMountedRef.current = false;

      // 安全销毁当前 app（如果有）
      if (appRef.current) {
        safeDestroy(appRef.current);
        appRef.current = null;
      }

      // 再次确保容器内无残留 canvas（防止清理不完全）
      if (container) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }
    };
  }, [controller, width, height, backgroundColor, handleAppInit]); // 依赖项：当这些 props 变化时重新创建 Pixi 应用

  // 渲染一个占位 div，作为画布容器，样式设置为指定宽高
  return <div ref={containerRef} style={{ width, height }} />;
};