# framework/ — PIXI 核心层

SubCanvas 体系的基础。单 PIXI canvas 上做 AABB 区域划分、事件路由、拖拽、生命周期。

## 架构

```
PixiApp.startPixiApp()
  → SubCanvasProxy (proxy)
      → SubCanvas (region / sub-region)
      → EventBus (proxy.bus)
```

## 文件

| 文件 | 职责 |
|------|------|
| `PixiApp.ts` | `startPixiApp(onReady?)` 启动 `PIXI.Application`，挂 canvas 到 body，监听 4 种 pointer 事件馈入 SubCanvasProxy。含 WebGL probe / dev-mode 调试栏 / single-canvas 断言。 |
| `SubCanvas.ts` | 核心。AABB 容器，含 stage/bounds/ticker/event-routing/tag-based-drag/z-order/clip-to-bounds/子区域管理。610 行。 |
| `SubCanvasProxy.ts` | 顶层 orchestrator。`createRegion` / `destroyAll` / `routePointer` / `getTopCanvases`。暴露 `bus` / `ticker` / `renderer`。 |
| `EventBus.ts` | 带类型的 pub-sub。`on` / `off` / `emit` / `clear`。handler 自带 try-catch 防止单 handler 拖垮全链。 |
| `index.ts` | 公开 re-export。**外部只 import 此文件，不 deep import**。 |
| `NOTES.md` | drag / z-order / event-routing 设计笔记 & 踩坑记录。 |

## 关键约定

- `SubCanvas.addChild` 是 drag handle 安装的唯一路径。`win.stage.addChild` 绕开自动安装。
- Drag 双层监听：PIXI `app.stage.on('pointermove')` + window `addEventListener`，防快拖脱手。
- `app.stage.eventMode` 必须为 `'static'`（v8 默认 `'passive'` 不转发冒泡事件）。
