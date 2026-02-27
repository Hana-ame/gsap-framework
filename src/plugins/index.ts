// ============================================================
// 文件: src/plugins/index.ts
// 用途: 插件统一导出入口，方便批量注册。
// 上下文: 被 App.tsx 或其他初始化代码使用，通过循环注册所有插件。
//
// 版本: 2.0.0
//    - 移除 bouncePlugin 和 ballsPlugin，添加 physicsPlugin。
// ============================================================

import { circlePlugin } from './circle.plugin';
import { rectanglePlugin } from './rectangle.plugin';
import { clearPlugin } from './clear.plugin';
import { bouncePlugin } from './bounce.plugin';
import { fireworksPlugin } from './fireworks.plugin';
import { apiDemoPlugin } from './api-demo';
import { ballsPlugin } from './balls.plugin'; // 新增导入
import { physicsPlugin } from './physics'; // 新增导入

// 所有插件列表，按需添加
export const plugins = [
  circlePlugin,
  rectanglePlugin,
  clearPlugin,
  fireworksPlugin,
  apiDemoPlugin,
  physicsPlugin,
];

// 也可以单独导出每个插件，供需要单独使用的场景
export {
  circlePlugin,
  rectanglePlugin,
  clearPlugin,
  fireworksPlugin,
  apiDemoPlugin,
  physicsPlugin,
};