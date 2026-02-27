// ============================================================
// 文件: src/plugins/index.ts
// 用途: 插件统一导出入口，方便批量注册。
// 上下文: 被 App.tsx 或其他初始化代码使用，通过循环注册所有插件。
//
// 版本: 1.1.0
//    - 新增导出 fireworksPlugin，并整合所有插件到 plugins 数组。
// ============================================================

import { circlePlugin } from './circle.plugin';
import { rectanglePlugin } from './rectangle.plugin';
import { clearPlugin } from './clear.plugin';
import { bouncePlugin } from './bounce.plugin';
import { fireworksPlugin } from './fireworks.plugin';
import { apiDemoPlugin } from './api-demo'; // 注意路径


// 所有插件列表，按需添加
export const plugins = [
  circlePlugin,
  rectanglePlugin,
  clearPlugin,
  bouncePlugin,
  fireworksPlugin,
  apiDemoPlugin, // 添加到数组
];

// 也可以单独导出每个插件，供需要单独使用的场景
export {
  circlePlugin,
  rectanglePlugin,
  clearPlugin,
  bouncePlugin,
  fireworksPlugin,
  apiDemoPlugin, // 添加到数组
};