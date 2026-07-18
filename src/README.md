# src/ 概览

```
src/
  main.tsx           createRoot → <ErrorBoundary><ExampleApp /></ErrorBoundary>
  index.css          100% reset + safe-area vars
  ErrorBoundary.tsx  red panel self-contained
  vite-env.d.ts      Vite types

  framework/         PIXI 核心层 (the layer)
  components/        PIXI 组件
  example/           6 个 SubCanvas 用法演示
```

## framework/ — PIXI 核心

```
PixiApp → SubCanvasProxy → SubCanvas
                      → EventBus (proxy.bus)
```

| 文件 | 作用 | 被依赖方 |
|---|---|---|
| `SubCanvas.ts` | **核心**。AABB 容器，bounds、event routing、tag-based drag、z-order、clipToBounds。 | `Displays`, `PixiApp`, `SubCanvasProxy`, `Loading`, `PixiWindow`, `PixiConfirm`, `PixiImage` (7 处) |
| `SubCanvasProxy.ts` | 顶层 proxy。`createRegion` / `createRegion` / `routePointer` / `destroyAll`。 | `PixiApp` |
| `EventBus.ts` | 类型化 pub-sub，跨 SubCanvas + 后台。 | `SubCanvasProxy` |
| `PixiApp.ts` | `startPixiApp(onReady?)`：全屏 PIXI.Application + 4 个 window pointer 监听 + 自动 `app.stage.eventMode='static'`。 | 所有 example |
| `index.ts` | 公开 re-export（**只 import 这个，不要 deep import**） | consumers |
| `NOTES.md` | drag / z-order / event-routing 设计与踩过的坑 | — |

## components/ — PIXI 组件

| 文件 | 作用 |
|---|---|
| `PixiWindow.ts` | `createWindow({ title, w, h, x, y, parent, dragMode })` — draggable GameWindow，title bar + close button + `content` sub-region。继承 SubCanvas。 |
| `PixiConfirm.ts` | `createConfirm({ title, message?, imageUrl?, buttons, parent })` — modal dialog。message/image 互斥（image 优先）。按钮总是关闭（默认 `keepOpen: false`）。 |
| `PixiImage.ts` | `createLoadingImage(parent, { url, ... })` — async PIXI image with placeholder + token-cancel。 |
| `Loading.ts` | `showLoading(sc, text?)` — 半透明遮罩 + 旋转环。返回 `() => void` 停止。 |
| `index.ts` | 公开 re-export |

## example/ — 6 个 SubCanvas 用法

```
hash 路由 → useHashExample → examples.ts → ExampleApp → display
```

| 路由 | 文件 | 演示什么 |
|---|---|---|
| (空 hash) | `launcher/LauncherDisplay.tsx` | tile grid 主页，带 filter |
| `#screen-size` | `screen-size/ScreenSizeDisplay.tsx` | viewport / device / canvas 尺寸读出 |
| `#window-mobile` | `window-mobile/WindowMobileDisplay.tsx` | 5 个 trigger 按钮弹 draggable Confirm 弹窗 |
| `#single` | `single/SingleDisplay.tsx` | 全屏 canvas + `mountDisplays` (click ring + crosshair) |
| `#multiple` | `multiple/MultipleDisplay.tsx` | 2×2 象限，每个一个 SubCanvas region |
| `#window` | `window/WindowDisplay.tsx` | 2 个 GameWindow (Inventory + Chat) + 模拟 backend + bus 事件 |
| `#pixi-confirm` | `pixi-confirm/PixiConfirmDisplay.tsx` | 5 个 trigger + HTML log overlay |
| (shared) | `_shared/Displays.ts` | `#single` 和 `#multiple` 共用的 click ring + crosshair visualizer |
| (entry) | `ExampleApp.tsx` | 路由分发（hash → component） |
| (router) | `useHashExample.ts`, `examples.ts` | hash 监听 + 路由表 |

## 关键约定

- **`framework/index.ts` 和 `components/index.ts` 是公开 API**。其他文件是 internal。如果某个类型没在 index.ts 导出，就别从内部用。
- **`SubCanvas.addChild` 是 drag 唯一可靠的安装路径**。`win.stage.addChild` 绕开自动安装。
- **drag 是双层** — PIXI `app.stage.on` + window `addEventListener`。详见 framework/NOTES.md。
- **依赖图是干净 DAG**：framework ← components ← example，无循环。
