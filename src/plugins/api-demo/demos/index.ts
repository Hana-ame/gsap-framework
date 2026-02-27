// ============================================================
// 文件: src/plugins/api-demo/demos/index.ts
// 用途: 导出所有演示函数，并提供消息类型到演示函数的映射。
// 上下文: 被主插件入口文件引用，用于在 execute 中根据消息类型调用对应函数。
//
// Outline:
// 1. 导入所有演示函数
// 2. 定义演示映射表：消息类型 -> 函数
// 3. 导出映射表，供插件使用
//
// 注意事项:
//   - 当新增演示时，需要在此文件中添加对应的导入和映射条目。
// ============================================================
import * as PIXI from 'pixi.js';

import { showBasicShapes } from './basicShapes';
import { showText } from './text';
import { showSprite } from './sprite';
import { showAnimation } from './animation';
import { showFilter } from './filter';
import { showInteraction } from './interaction';
import { showContainer } from './container';
import { showParticles } from './particles';

// 消息类型到演示函数的映射
export const demoMap: Record<string, (app: PIXI.Application) => void> = {
  'apiDemo/basicShapes': showBasicShapes,
  'apiDemo/text': showText,
  'apiDemo/sprite': showSprite,
  'apiDemo/animation': showAnimation,
  'apiDemo/filter': showFilter,
  'apiDemo/interaction': showInteraction,
  'apiDemo/container': showContainer,
  'apiDemo/particles': showParticles,
};

// 为了方便，也单独导出每个函数
export {
  showBasicShapes,
  showText,
  showSprite,
  showAnimation,
  showFilter,
  showInteraction,
  showContainer,
  showParticles,
};