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
| `SubCanvas.ts` | 核心。AABB 容器，含 stage/bounds/ticker/event-routing/tag-based-drag/z-order/clip-to-bounds/子区域管理。727 行。 |
| `SubCanvasProxy.ts` | 顶层 orchestrator。`createRegion` / `destroyAll` / `routePointer` / `getTopCanvases`。暴露 `bus` / `ticker` / `renderer` / `showPerfMeasure`。 |
| `EventBus.ts` | 带类型的 pub-sub。`on` / `off` / `emit` / `clear`。handler 自带 try-catch 防止单 handler 拖垮全链。 |
| `InfiniteCanvas.ts` | 泛化无限拖拽 + chunk 化加载/卸载系统。插件架构（drag/decelerate），帧率无关惯性，自动 chunk 创建/销毁。支持 `addPlugin`/`removePlugin`。内部 `_scrollX/_scrollY` 是屏幕像素偏移，`worldX/worldY` getter 返回视口中心世界坐标（zoom 稳定）。 |
| `component.ts` | Component 注册表工厂。`registerComponent('type', factory)` → `createComponent('type', opts)`。 |
| `ui-helpers.ts` | `makeButton` / `makeStepper` / `makeInfoPanel` / `textPresets` 通用 PIXI 控件。 |
| `gsap-pixi.ts` | GSAP 3.15 + PixiPlugin 注册。可直接 `gsap.to(sprite, { pixi: { alpha: 0 } })`。 |
| `perf.ts` | `PerfDisplay` + `enablePerfMeasure` / `disablePerfMeasure` — 屏幕 FPS / frametime / 对象数 HUD。 |
| `Layer.ts` | `LayerManager` / `LayerImpl` — 命名 z-order 层抽象。 |
| `text-effects.ts` | `runTextEffect` — GSAP 驱动的文字动效（typewriter / fadeIn / slideIn / scramble 等 7 种）。 |
| `utils/` | 纯函数工具集（math/color/rect），零 PIXI 依赖。 |
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

## 变更记录

### `dragMode: 'anywhere'` 重写（2026-07-20）

**原因**：PIXI v8 的 `EventSystem` 在 hit-test 时会跳过 `eventMode = 'none'` 的容器及其子树。SubCanvas 的 `stage` （`PIXI.Container`）默认 `eventMode` 为 `undefined`（PIXI 视作 `'none'`），导致 PIXI 永远找不到内部的 `_bg`（`eventMode = 'static'`），`pointerdown` 不触发，`anywhere` 拖拽完全失效。

**改动**：
- 不再创建 `_bg` 容器 + PIXI `pointerdown`，改为在 `SubCanvas.handlePointer` 内直接处理拖拽逻辑
- 拖拽走框架的 AABB 事件路由（`proxy.routePointer` → `handlePointer`），不依赖 PIXI EventSystem 做命中检测
- `SubCanvas.stage.eventMode` 设为 `'static'`，确保 PIXI 事件能穿透到子对象（按钮、标题栏、`dragMode: 'title'` 的 handle 等）
- `_bg` 相关字段保留但不再创建，`dragMode: 'title'` 行为不变

**粘手 bug（第二阶段修复）**：重写后拖拽完全依赖 `proxy.routePointer`，但 PixiApp 在 `makePointerHandler` 中有 `e.target !== proxy.canvas` 过滤。鼠标快速移出 canvas 后，`pointerup` 的 `target` 不再是 canvas → 被过滤 → `handlePointer` 收不到 up → `_isDragging` 永不重置 → 粘手。修复：拖拽启动时挂 `window.addEventListener('pointermove'/'pointerup')` 作为 fallback（DOM 级事件不检查 `e.target`），结束自动解绑。
