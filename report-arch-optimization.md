# 架构优化报告

## 1. Orphan 路由注册

| 问题 | 修复 |
|------|------|
| `component-colony` 379 行代码已实现但不可达 | `examples.ts` 加入 import/route/map 注册；`LauncherDisplay.tsx` APPS 数组添加入口 |

## 2. 代码修复

| 文件 | 问题 | 修复 |
|------|------|------|
| `PixiConfirm.ts:86` | 标题栏光标始终 `'move'`，不检查 `dragMode === 'none'` | 改为 `bar.cursor = dragMode === 'none' ? 'default' : 'move'` |
| `ClickableImage.ts:136` | `PIXI.Assets.load` 的 `.catch(() => {})` 静默吞错误 | 改为 `console.warn('[ClickableImage] load failed:', url, err)` |
| `manifest.webmanifest:5` | `start_url` 指向不存在的 `/#launcher` hash | 改为 `"/"` |
| `vite-env.d.ts` | 重复 `declare module '*.jsx'` 区块 + `any` 滥用 | 合并为单区块，用 `ComponentType<unknown>` 替代 `any` |
| `ErrorBoundary.tsx:68` | `<pre>` 点击复制无键盘操作 | 添加 `role="button"` `tabIndex={0}` `onKeyDown` (Enter/Space) |
| `Displays.ts:81` | `setStrokeStyle` (v7 deprecated API) + ring/label 对象动画结束未清理 | 改为 `stroke()` API + 动画结束 `removeFromParent` + `destroy()` |

## 3. 架构改进 — decoupled 测试工具模块

新增 `src/framework/utils/` — 纯函数工具集，零依赖（无 PIXI/React/DOM）：

| 模块 | 文件 | 导出函数数 |
|------|------|-----------|
| `math.ts` | 数学工具 | `clamp` `lerp` `invLerp` `mapRange` `degToRad` `radToDeg` `distance` `distanceSq` `normalizeAngle` `snapToGrid` `randomInt` `randomFloat` (12) |
| `color.ts` | 色彩工具 | `hexToRgb` `rgbToHex` `rgbaToHex` `parseHexString` `formatHexString` `blendColors` `alphaBlend` `luminance` `isLight` `contrastTextColor` (10) |
| `rect.ts` | 矩形工具 | `rectContains` `rectIntersects` `rectCenter` `rectExpand` `rectShrink` `rectFit` `rectClamp` `rectSnap` (8) |
| `index.ts` | barrel export | |

## 4. 测试基础设施

- 安装 **vitest 4.1.10**
- 配置整合入 `vite.config.ts`（`test.include`）
- `package.json` 添加 `test` / `test:watch` 脚本
- 测试文件在 `src/framework/utils/__tests__/`

| 测试文件 | 用例数 | 覆盖函数 |
|---------|-------|---------|
| `math.test.ts` | 26 | 11 个函数 |
| `color.test.ts` | 15 | 9 个函数 |
| `rect.test.ts` | 18 | 8 个函数 |

**总计: 59 测试用例, 305ms 运行, 全部通过。**

测试约定：
- 纯函数测试，无 PIXI/DOM/React 依赖
- 每个 `describe` 对应一个导出函数
- 优先测试边界情况（edge values, zero inputs, negative values）

## 5. 文档覆盖

新增 19 个 README.md 文件：

| 路径 | 内容 |
|------|------|
| `src/framework/README.md` | SubCanvas 核心层架构 & 文件职责 |
| `src/components/README.md` | 15 个组件一览表 & 导出说明 |
| `src/example/launcher/README.md` | 主页 tile grid 说明 |
| `src/example/screen-size/README.md` | 尺寸信息读出 |
| `src/example/window-mobile/README.md` | 移动端 confirm 流 |
| `src/example/single/README.md` | 全屏 canvas visualizer |
| `src/example/multiple/README.md` | 2x2 象限 |
| `src/example/window/README.md` | GameWindow + chat |
| `src/example/pixi-confirm/README.md` | confirm 触发演示 |
| `src/example/component-video-player/README.md` | PIXI 视频播放器 |
| `src/example/component-video-player-dom/README.md` | DOM 视频播放器 |
| `src/example/component-cutscene/README.md` | 过场动画状态机 |
| `src/example/component-cutscene-minimal/README.md` | 视频 sanity test |
| `src/example/component-2048/README.md` | 2048 游戏 |
| `src/example/component-conway/README.md` | Conway's Game of Life |
| `src/example/component-avd/README.md` | 视觉小说引擎 |
| `src/example/component-life-map/README.md` | 环形世界 Conway |
| `src/example/component-colony/README.md` | 菌落模拟 |
| `src/example/_shared/README.md` | 共享工具说明 |
| `src/framework/utils/__tests__/README.md` | 测试运行指南 |

## 6. 待改进（未做）

| 项目 | 原因 |
|------|------|
| `tsconfig.app.json` 开启 `strict: true` | 会导致大量类型错误，需逐文件修复，建议分阶段进行 |
| `head` 属性模式类型定义 | 需统一设计元数据注入方案后再加类型 |
| barrel 导出拆分 (VideoPlayer 移出 PIXI barrel) | 属 API 变更，需确认 consumer |
| deep import 修复 | 多处违反 README rule #13，需逐个改 |
| 代码注释清理 (PixiVideoPlayer 等) | README rule #1 违反，但功能相关注释建议保留 |
