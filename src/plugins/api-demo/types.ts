// ============================================================
// 文件: src/plugins/api-demo/types.ts
// 用途: 定义 API 演示插件所需的 TypeScript 类型。
// 上下文: 被 state.ts 和各个演示文件引用，确保类型安全。
//
// Outline:
// 1. 导入 PIXI 类型
// 2. 定义 AppState 接口，用于存储每个应用实例的私有状态
// 3. 导出类型
//
// 注意事项:
//   - 这些类型仅用于内部状态管理，不对外暴露。
// ============================================================

import * as PIXI from 'pixi.js';

/**
 * 每个应用实例的私有状态
 */
export interface AppState {
  /** 用于放置所有演示内容的容器 */
  container: PIXI.Container;
  /** 当前正在运行的动画 ticker 回调（如果有），切换演示时需要移除 */
  tickerCallback?: () => void;
  /** 当前正在运行的交互对象（如可点击的图形），切换演示时需要清理事件监听 */
  interactiveObjects?: PIXI.Graphics[];
}

export const appStates = new WeakMap<PIXI.Application, AppState>();