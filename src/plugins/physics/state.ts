// ============================================================
// 文件: src/plugins/physics/state.ts
// 用途: 管理每个 PIXI.Application 实例的物理系统状态。
//       提供获取/创建状态的方法，以及清理功能。
// 上下文: 被主插件和其他模块调用。
//
// Outline:
// 1. 使用 WeakMap 存储每个 app 的状态
// 2. 导出 getState, setState, clearState 等函数
// ============================================================

import * as PIXI from 'pixi.js';
import { PhysicsState } from './types';

// WeakMap 存储每个 app 的状态，键为 app 实例，值为状态对象
const appStates = new WeakMap<PIXI.Application, PhysicsState>();

/**
 * 获取指定 app 的物理状态，如果不存在则创建一个新的默认状态
 */
export function getState(app: PIXI.Application): PhysicsState {
  let state = appStates.get(app);
  if (!state) {
    state = {
      dvd: null,
      balls: [],
      mouseX: -1000,  // 初始无效位置
      mouseY: -1000,
      mouseRadius: 30,
      tickerCallback: undefined, // 修改为 undefined
      active: false,
    };
    appStates.set(app, state);
  }
  return state;
}

/**
 * 设置指定 app 的状态（通常用于替换整个状态）
 */
export function setState(app: PIXI.Application, state: PhysicsState): void {
  appStates.set(app, state);
}

/**
 * 清除指定 app 的状态（移除 WeakMap 中的条目）
 */
export function clearState(app: PIXI.Application): void {
  appStates.delete(app);
}