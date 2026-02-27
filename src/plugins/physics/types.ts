// ============================================================
// 文件: src/plugins/physics/types.ts
// 用途: 定义 physics 插件内部使用的类型。
// 上下文: 被其他模块文件引用，确保类型安全。
//
// Outline:
// 1. DVD 实体接口
// 2. 小球实体接口
// 3. 物理系统状态接口
// ============================================================

import * as PIXI from 'pixi.js';

/** DVD 实体 */
export interface DVDEntity {
  sprite: PIXI.Sprite;      // 精灵
  vx: number;               // 水平速度
  vy: number;               // 垂直速度
  speed: number;            // 固定速率（速度大小）
  radius: number;           // 碰撞半径（取宽高较大者的一半）
}

/** 小球实体 */
export interface BallEntity {
  graphics: PIXI.Graphics;  // 绘图形状
  x: number;                // 当前位置 x
  y: number;                // 当前位置 y
  vx: number;               // 水平速度
  vy: number;               // 垂直速度
  radius: number;           // 半径
  color: number;            // 颜色
}

/** 每个 app 实例对应的物理系统状态 */
export interface PhysicsState {
  dvd: DVDEntity | null;            // DVD 实体（可能不存在）
  balls: BallEntity[];              // 小球数组
  mouseX: number;                   // 最新鼠标位置 x（画布内坐标）
  mouseY: number;                   // 最新鼠标位置 y
  mouseRadius: number;              // 鼠标球半径
  tickerCallback: () => void;       // ticker 更新函数
  active: boolean;                  // 是否正在运行（有任一实体）
}