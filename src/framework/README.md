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
| `InfiniteCanvas.ts` | 泛化无限拖拽 + chunk 化加载/卸载系统。插件架构（drag/decelerate），帧率无关惯性，自动 chunk 创建/销毁。支持 `addPlugin`/`removePlugin`。内部 `_scrollX/_scrollY` 是屏幕像素偏移，`worldX/worldY` getter 返回视口中心世界坐标（zoom 稳定）。 |
| `component.ts` | Component 注册表工厂。`registerComponent('type', factory)` → `createComponent('type', opts)`。 |
| `ui-helpers.ts` | `makeButton` / `makeStepper` 通用 PIXI 控件。 |
| `gsap-pixi.ts` | GSAP 3.15 + PixiPlugin 注册。可直接 `gsap.to(sprite, { pixi: { alpha: 0 } })`。 |
| `utils/` | 纯函数工具集（math/color/rect），零 PIXI 依赖，59 个测试覆盖。 |
| `index.ts` | 公开 re-export。**外部只 import 此文件，不 deep import**。 |
| `NOTES.md` | drag / z-order / event-routing 设计笔记 & 踩坑记录。 |

## InfiniteCanvas 插件系统

借鉴 pixi-viewport 的插件架构：

| 生命周期 | 触发时机 |
|---------|---------|
| `onDown` | pointerdown 时 |
| `onMove` | pointermove 时 |
| `onUp` | pointerup 时 |
| `onUpdate(elapsed)` | 每帧（ticker） |
| `onResize` | viewport resize |
| `onDestroy` | canvas destroy |

内置插件按 `priority` 排序执行：
1. 输入插件（drag）
2. 物理插件（decelerate，priority=50）
3. 约束插件（clamp/snap）

```ts
class MyPlugin implements InfiniteCanvasPlugin {
  readonly name = 'my-plugin';
  priority = 100;
  parent!: InfiniteCanvas;
  onUpdate(elapsed: number) {
    this.parent.panBy(dx, dy);
  }
}
canvas.addPlugin(new MyPlugin());
```

## 关键约定

- `SubCanvas.addChild` 是 drag handle 安装的唯一路径。`win.stage.addChild` 绕开自动安装。
- Drag 双层监听：PIXI `app.stage.on('pointermove')` + window `addEventListener`，防快拖脱手。
- `app.stage.eventMode` 必须为 `'static'`（v8 默认 `'passive'` 不转发冒泡事件）。
