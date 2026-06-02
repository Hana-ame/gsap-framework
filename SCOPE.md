# Overall Scope — sim

## 是什么

一个 **2D/3D 渲染技术演示沙盒**，用 hash 路由切换不同展示页面。技术栈：Vite + React 19 + PixiJS v8 + Three.js。

## 做了什么

项目探索两套渲染管线在同一个 SPA 里的共存方式，同时构建了一套可复用的 **多窗口 UI 层**。

### PIXI 管线（2D）

| 展示 | 功能 |
|---|---|
| `#single` | 全屏画布 + 鼠标十字准星 + 点击涟漪 |
| `#multiple` | 2×2 四象限，每个象限独立画布 |
| `#window` | PIXI 窗口系统：Inventory 网格 + Chat 文字窗口 + 加载动画 |

核心抽象：`SubCanvas`（空间区域管理）→ `SubCanvasProxy`（顶层路由）→ `PixiApp`（初始化）。`EventBus` 在窗口间通信。

### Three.js 管线（3D）

| 展示 | 功能 |
|---|---|
| `#three` | Icosahedron + 8 个弹跳方块 + 点击地面生成新方块 |
| `#three-euler` | 飞船模型 Euler 角动画（YXZ 顺序 + pitch clamp，演示 gimbal lock） |
| `#two-3d` | 两个 HTML 拖拽窗口内嵌独立 Three.js 场景（TorusKnot + Icosahedron） |
| `#camera-euler` | 相机 Euler 角动画（camera 视角旋转，同样的 gimbal lock 演示） |

### 多窗口 UI 层

- `Window.tsx` — HTML DOM 可拖拽窗口（title bar、z-index 管理、focus、close）
- `PixiWindow.ts` — PIXI 可拖拽窗口（继承 SubCanvas 体系）

## 架构要点

```
                    ┌─ PIXI 栈 ─┐
route → display ────┤           ├── SubCanvas → SubCanvasProxy → PixiApp
                    └─ Three.js ─┘     ↘ EventBus
```

- 两套渲染管线**完全独立**，互不依赖
- 路由基于 `hashchange`，SPA 无需构建多页
- `SubCanvas` 是整个 PIXI 体系的根基，被 5 个文件依赖
- 无循环依赖，干净的 DAG
- 部署：push 到 `origin/sim` → Cloudflare Pages 自动构建
