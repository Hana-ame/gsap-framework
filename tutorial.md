# Hana-ame (GSAP Framework) 学习文档阅读顺序

## 第一阶段：宏观理解

1. **`INTRO.md`** — 框架定位、核心概念（SubCanvas = 画布上的 div）、组合思想、架构栈
2. **`README.md`** — 功能总览、所有模块的快速 API 参考
3. **`SPEC.md`** — 架构分层、数据流、设计决策

## 第二阶段：核心源码

4. **`src/framework/README.md`** — framework 层文件职责总览
5. **`src/framework/PixiApp.ts`** — 启动入口 `startPixiApp`、WebGL 探测、resize
6. **`src/framework/SubCanvas.ts`** — 核心：AABB 区域划分、事件路由、拖拽、嵌套
7. **`src/framework/SubCanvasProxy.ts`** — 顶层编排器、多 canvas 路由
8. **`src/framework/EventBus.ts`** — 发布订阅、组件解耦

## 第三阶段：进阶模块

9. **`src/framework/InfiniteCanvas.ts`** — 无限画布、chunk 懒加载、插件系统
10. **`src/framework/component.ts`** — 组件注册表工厂模式
11. **`src/framework/gsap-pixi.ts`** — GSAP + PixiPlugin 集成
12. **`src/framework/Layer.ts`** — z-order 分层管理
13. **`src/components/ui-helpers.ts`** — 按钮、步进器、textPresets 样式常量
14. **`src/framework/text-effects.ts`** — GSAP 文字动效
15. **`src/framework/utils/`** — math / color / rect 纯函数工具

## 第四阶段：组件库

16. **`src/components/README.md`** + 各组件 `.md` 文件
17. **`src/framework/register-components.ts`** — 组件注册适配器

## 第五阶段：实践

18. **`API_USAGE.md`** — 完整 API 速查手册
19. **Example 路由**，推荐顺序：`single` → `multiple` → `window` → `pixi-confirm` → `component-scrollable` → `component-gsap` → `component-infinite` → `component-avd` → `component-2048`
20. **`src/framework/NOTES.md`** — 踩坑记录

---

## 关键设计哲学

- **SubCanvas = Canvas 上的 `<div>`**：独立 bounds、事件路由、拖拽，可递归嵌套
- **组合 > 继承**：工厂函数统一返回 `{ stage, destroy, destroyed }`
- **React 只挂载 canvas**：UI 全在 PIXI 内，不触发 React re-render
- **事件即数据**：`SubPointerEvent` 自带区域局部坐标 + client 坐标
