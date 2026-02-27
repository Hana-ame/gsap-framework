// ============================================================
// 文件: src/plugins/api-demo/state.ts
// 用途: 管理每个 PIXI.Application 实例的私有状态。
//       提供获取/创建演示容器、清除演示内容的方法。
// 上下文: 被所有演示函数调用，用于操作容器和清理旧内容。
//
// Outline:
// 1. 导入 PIXI 和类型
// 2. 使用 WeakMap 存储每个 app 的状态
// 3. 导出函数: getDemoContainer, clearDemo
//
// 注意事项:
//   - WeakMap 确保当 app 被销毁时，状态自动垃圾回收。
//   - 每个演示容器固定在舞台左上角 (50,50)，尺寸 400x250，带半透明背景。
// ============================================================

import * as PIXI from "pixi.js";
import { AppState } from "./types";

// 使用 WeakMap 存储每个 app 的状态，避免内存泄漏
export const appStates = new WeakMap<PIXI.Application, AppState>();

/**
 * 获取指定 app 的演示容器，如果不存在则创建并初始化
 * @param app - PIXI.Application 实例
 * @returns 该 app 对应的演示容器
 */
export function getDemoContainer(app: PIXI.Application): PIXI.Container {
  let state = appStates.get(app);
  if (state) {
    // 检查容器是否在舞台上
    if (!state.container.parent) {
      // 容器已被移除，销毁并重建
      state.container.destroy({ children: true });
      state = undefined; // 触发重新创建
    }
  }
  if (!state) {
    // 创建新的容器
    const container = new PIXI.Container();
    container.label = "apiDemoContainer";
    container.position.set(50, 50); // 固定在左上角，留出边距
    app.stage.addChild(container);

    // 添加一个半透明的背景矩形，使演示内容更清晰
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 400, 250);
    bg.fill({ color: 0x000000, alpha: 0.3 });
    bg.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
    container.addChild(bg);

    state = { container };
    appStates.set(app, state);
  }

  return state.container;
}

/**
 * 清除当前演示内容，并停止任何正在运行的动画
 * @param app - PIXI.Application 实例
 */
export function clearDemo(app: PIXI.Application) {
  const state = appStates.get(app);
  if (!state) return;

  // 移除之前添加的 ticker 回调
  if (state.tickerCallback) {
    app.ticker.remove(state.tickerCallback);
    state.tickerCallback = undefined;
  }

  // 移除之前的交互对象（如果有）
  if (state.interactiveObjects) {
    state.interactiveObjects.forEach((obj) => {
      obj.removeAllListeners(); // 移除所有事件监听
    });
    state.interactiveObjects = undefined;
  }

  // 清空容器，但保留背景（索引0）
  const container = state.container;
  while (container.children.length > 1) {
    container.removeChildAt(1).destroy({ children: true });
  }
}
