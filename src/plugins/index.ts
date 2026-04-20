// ============================================================
// 文件: src/plugins/index.ts
// 用途: 插件统一导出入口，方便批量注册。
// 上下文: 被 App.tsx 或其他初始化代码使用，通过循环注册所有插件。
//
// 版本: 3.0.0
//    - 移除 physicsPlugin、apiDemoPlugin 等，只保留 clearPlugin 和新增的 gameOfLifePlugin。
//    - 使应用专注于康威生命游戏。
// ============================================================

import { clearPlugin } from './clear.plugin';
import { gameOfLifePlugin } from './gameOfLife.plugin'; // 新插件

// 所有插件列表，按需添加
export const plugins = [
  clearPlugin,
  gameOfLifePlugin,
];

// 也可以单独导出每个插件，供需要单独使用的场景
export {
  clearPlugin,
  gameOfLifePlugin,
};