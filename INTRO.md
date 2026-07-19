# GSAP Framework 介绍

## 这是什么

一个基于 PIXI v8 的游戏 UI 框架，用 GSAP 驱动动画。核心解决一个问题：

> **在 Canvas 上构建复杂 UI，像操作 DOM 一样自然。**

传统的 HTML/CSS 布局有浏览器排版引擎、事件冒泡、层叠上下文、滚动容器。到了 Canvas，这些全没了——只有 `drawRect` 和 `requestAnimationFrame`。GSAP Framework 把这些补回来，而且不只是"模拟"，是针对游戏 UI 场景重新设计的。

## 核心概念

### SubCanvas — 画布上的"div"

SubCanvas 是这个框架的原子单位。每个 SubCanvas 是一块独立的矩形区域，有自己的：

- **PIXI.Container**（stage）— 往里加任何 PIXI 内容
- **Bounds** — 位置和大小，可嵌套
- **Event routing** — pointerdown/move/up/tap 自动路由到正确的 region，坐标已转成 local
- **Drag behavior** — 内置拖拽，三种模式（标题栏 / 任意位置 / 禁用）
- **Lifecycle** — create / resize / destroy，资源自动清理

把它想象成 Canvas 上的 `<div>`。嵌套、定位、事件隔离都像 DOM 一样自然。

```
root (full viewport)
  ├── toolPanel (200px wide, left side)
  │     ├── color buttons
  │     └── brush size buttons
  ├── canvas (drawing area)
  │     └── strokes
  └── infoPanel (bottom-right)
```

### 组合 > 继承

所有组件都是工厂函数，返回统一接口：

```ts
{ stage: PIXI.Container, destroy(): void, destroyed: boolean }
```

没有基类继承链，没有 `super()`, 没有 `abstract method`。Window 是一个创建 SubCanvas 并附加标题栏的工厂；Confirm 是 Window 的变体加按钮层；Scrollable 是 Container + mask + 事件绑定。它们之间通过**组合**复用逻辑，不共享原型。

### 事件即数据

SubCanvas 的 pointer 事件（`onPress`/`onMove`/`onRelease`/`onTap`）把 PIXI 的 `FederatedPointerEvent` 翻译成框架内统一的 `SubPointerEvent`：

```ts
{ type, x, y, globalX, globalY, originalEvent }
```

`x/y` 已经是 region-local 坐标，不用手算 `getLocalPosition`。`globalX/globalY` 是 client 坐标，用于 window-level drag fallback。

跨组件通信走 EventBus——字符串 key + 泛型 payload，解耦发送方和接收方。

### 性能可预期

- **不逐帧重绘** — 状态变化主动触发渲染，不是每帧扫一遍全部对象
- **Bounds 计算分离** — 昂贵的 bounds 计算（`getBounds()`）只在必要时执行，跟 position/alpha/visible 这些廉价操作分开
- **Drag 稳定** — pointer event 同时绑定 PIXI stage + window，鼠标移出 canvas 也不会丢事件
- **InfiniteCanvas chunk cache** — 拖拽时不是每像素都遍历 chunk 集合，范围不变直接跳过

## 架构栈

```
React            ← 只用来挂载 canvas（`<div ref={...}>`），最多只做路由
PIXI v8          ← 渲染层，所有 UI 元素都在 canvas 内
GSAP             ← 动画层，预配置 PixiPlugin
├── SubCanvas    ← 画布分区 + 事件路由 + 拖拽
├── Components   ← Window / Confirm / Scrollable / AVD / ...
├── EventBus     ← 跨组件通信
├── LayerManager ← z-order 分层
└── InfiniteCanvas ← 无限画布（插件化）
```

React 的角色只到 `useEffect(() => startPixiApp(...), [])`。之后所有 UI 构建、更新、销毁都在 PIXI 内完成，不触发 React re-render。

## 不是什么

- **不是 UI 库** — 没有预制的按钮/滑块/下拉菜单主题。`makeButton` 是一个 20 行的工厂，你自己决定样式
- **不是引擎** — 没有物理、粒子、音频管理。跟 GSAP、Howler、PIXI 粒子各司其职
- **不是状态管理** — 没有 Redux/MobX。EventBus 解决跨组件通信，局部状态就在模块级变量里

## 为什么有 48 个 example

每个 example 对应一个 framework/component 特性。它们的作用：

- **开发时实时验证** — 改了 SubCanvas 的事件路由，打开 `single` / `multiple` 立刻看到效果
- **回归测试** — 新增功能后扫一遍所有 route，确保没 break 已有行为
- **文档即代码** — 每个 example 的 `makeInfoPanel` 写明目的和预期结果，代码就是使用说明书

Example 覆盖：基础画布分区、窗口系统、弹窗确认、滚动容器、图片加载、视频播放、游戏（贪吃蛇/2048/俄罗斯方块/打砖块/生命游戏）、粒子、滤镜、GSAP 动画、无限画布、文字输入、视觉小说引擎。

## 设计决策摘要

| 决策 | 选择 | 理由 |
|---|---|---|
| UI 渲染层 | PIXI v8 | GPU 加速，适合大量游戏对象；对比 DOM 重排开销不可控 |
| 动画引擎 | GSAP | 时间线、缓动、PixiPlugin 开箱即用；对比自己写 lerp + ticker |
| 组件模型 | 工厂函数 + 组合 | 无继承链，类型安全，tree-shakable |
| 状态管理 | 模块级 let + EventBus | 游戏 UI 状态集中可控，不需要响应式框架的 diff 开销 |
| 导入规范 | Barrel 禁止深导入 | 模块边界清晰，重构不影响 consumer |
| 画布分区 | SubCanvas 递归嵌套 | 事件隔离 + 坐标转换自动处理，复用 PIXI Container 的变换系统 |
