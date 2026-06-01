# src/ 概览

## 入口

| 文件 | 作用 |
|---|---|
| `main.tsx` | 应用入口，将 `<App />` 挂载到 `#root` |
| `App.tsx` | 根组件，渲染 `<RouteSwitch />` |
| `index.css` | 全局 CSS reset（全屏、黑底、overflow hidden） |
| `vite-env.d.ts` | Vite 类型声明 + `.jsx` module 声明 |

## router/ — 路由

```
App → RouteSwitch → useHashRoute / routes → display components
```

| 文件 | 作用 |
|---|---|
| `routes.ts` | 路由注册表：定义 route 名称、default、type guard、route → component 映射 |
| `useHashRoute.ts` | Hook：监听 `hashchange`，返回当前 `Route` |
| `RouteSwitch.tsx` | 根据 hash 从 `routeMap` 取对应组件渲染 |

依赖链：`App → RouteSwitch → (routes + useHashRoute)`

## displays/ — PIXI 展示组件

```
routes.ts → DisplayComponents
```

| 文件 | 作用 | 依赖 |
|---|---|---|
| `single/SingleDisplay.tsx` | 全屏单区域 PIXI 画布 | `PixiApp → Displays` |
| `multiple/MultipleDisplay.tsx` | 2×2 四象限 PIXI 画布 | `PixiApp → Displays` |
| `window/WindowDisplay.tsx` | PIXI 窗口系统（Inventory + Chat） | `PixiApp → PixiWindow, Loading` |
| `Displays.ts` | 公用工具：挂载 PIXI 十字线、移动文字、点击涟漪 | `SubCanvas` |

## three-displays/ — Three.js 展示组件

```
routes.ts → ThreeDisplayComponents
```

| 文件 | 作用 | 依赖 |
|---|---|---|
| `three/ThreeDisplay.tsx` | Three.js 场景（icosahedron + 弹跳方块 + 点击生成） | `start3DApp` |
| `three-euler/ThreeEulerDisplay.tsx` | Three.js 飞船模型 Euler 角演示（mesh，YXZ 顺序 + pitch clamp） | 无内部依赖 |
| `two-3d/Two3DDisplay.tsx` | 两个 React Window 内嵌 Three.js 场景（TorusKnot + Icosahedron） | `window/Window` |
| `camera-euler/CameraEulerDisplay.tsx` | Three.js 相机 Euler 角演示（camera，YXZ 顺序 + pitch clamp） | 无内部依赖 |

## pixi/ — PIXI 基础设施层

```
PixiApp → SubCanvasProxy → SubCanvas
                      → EventBus
```

| 文件 | 作用 | 被依赖方 |
|---|---|---|
| `SubCanvas.ts` | **核心抽象**：PIXI 区域管理，bounds、pointer 路由、drag、grid/divide 布局、z-order | `Displays`, `PixiApp`, `SubCanvasProxy`, `Loading`, `PixiWindow`（5 处） |
| `SubCanvasProxy.ts` | 顶层 proxy，管理所有 SubCanvas 区域，路由 pointer 事件 | `PixiApp` |
| `EventBus.ts` | 类型化发布/订阅事件总线 | `SubCanvasProxy` |
| `PixiApp.ts` | 初始化全屏 PIXI Application，绑定全局事件，返回 cleanup | `SingleDisplay`, `MultipleDisplay`, `WindowDisplay` |

## three/ — Three.js 基础设施

| 文件 | 作用 | 被依赖方 |
|---|---|---|
| `start3DApp.ts` | 创建全屏 Three.js 场景（fog、OrbitControls、raycaster），返回 cleanup | `ThreeDisplay` |

## window/ — window 化层（**polish 重点**）

多窗口 UI 的兼容层。每个人都能用、都依赖的稳定 API 表面。详见 [`window/NOTES.md`](window/NOTES.md)。

| 文件 | 作用 | 被依赖方 |
|---|---|---|
| `Window.tsx` | HTML 可拖拽窗口（title bar、z-index via parent、focus、close、useId） | `Two3DDisplay` |
| `PixiWindow.ts` | PIXI 可拖拽窗口（title bar、close、content sub-region），继承 SubCanvas | `WindowDisplay` |
| `NOTES.md` | 踩过的坑、设计决策、polish checklist、破坏性变更检查 | — |

## 架构要点

- **两套独立渲染栈**：PIXI 栈（SubCanvas ← SubCanvasProxy ← PixiApp ← Displays/PixiWindow/Loading）和 Three.js 栈（start3DApp ← ThreeDisplay），互不依赖
- **路由**：基于 hash 的 SPA 路由，`useHashRoute` 监听 `hashchange`
- **核心模块**：`SubCanvas.ts` 被 5 个文件依赖，是整个 PIXI 体系的根基
- **无循环依赖**：依赖图是干净的 DAG
