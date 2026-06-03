# subcanvas

PIXI 8 game-UI shell. SubCanvas is the core abstraction: a region of a shared `PIXI.Application` canvas with its own bounds, event routing, and lifecycle.

```
src/
  framework/    PIXI core. SubCanvas is the star. Public API: index.ts.
  components/   PIXI components (Window, Confirm, Image, Loading, Scrollable, ClickableImage, FullscreenManager). Public API: index.ts.
  example/      16 routes demonstrating SubCanvas usage. Launcher is the home.
```

Deploy: `https://react.moonchan.xyz/` (Cloudflare Pages auto on push to `sim`).

## Quick start

```ts
import { startPixiApp } from './framework';
import { createWindow } from './components';

const stop = startPixiApp((proxy) => {
  const root = proxy.createRegion({
    x: 0, y: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const win = createWindow({
    title: 'Inventory',
    width: 320, height: 240,
    x: 40, y: 40,
    parent: root,
  });
  win.content.stage.addChild(/* your PIXI display objects */);
});

// later
stop();
```

## Layout

### `src/framework/` — PIXI core (the layer)

| file | role |
|---|---|
| `SubCanvas.ts` | AABB container. Owns `stage` / `bounds` / `ticker` / event listeners / drag. |
| `SubCanvasProxy.ts` | Top-level orchestrator. `createRegion` / `createSubRegion` / `routePointer` / `destroyAll`. |
| `EventBus.ts` | Pub-sub for cross-window + future backend integration. `proxy.bus` is shared. |
| `PixiApp.ts` | `startPixiApp(onReady?)` — boots a `PIXI.Application`, mounts canvas to body, wires 4 pointer events. |
| `index.ts` | Public re-exports. |
| `NOTES.md` | Drag/z-order/event-routing design notes (the most-edited file). |

### `src/components/` — PIXI components

| file | role |
|---|---|
| `PixiWindow.ts` | `createWindow({ title, width, height, parent, dragMode })` → draggable GameWindow with content sub-region. |
| `PixiConfirm.ts` | `createConfirm({ title, message?, image?, buttons, parent, keepOpen? })` → modal dialog with text/image + multi-button. |
| `PixiImage.ts` | `createLoadingImage(parent, { url, ... })` → async PIXI image with placeholder + token-cancel + error hint. |
| `Loading.ts` | `showLoading(sc, text?)` → semi-transparent overlay + spinning ring. Returns `() => void` to stop. |
| `Scrollable.ts` | `createScrollable(parent, { width, height, direction, scrollbar })` → scrollable content region with wheel/drag/touch. |
| `ClickableImage.ts` | `createClickableImage(parent, bus, { url, ... })` → thumbnail that emits `'fullscreen:show'` on click. |
| `FullscreenManager.ts` | Singleton overlay manager, listens for `'fullscreen:show'` on bus, handles zoom/drag/close. |
| `index.ts` | Public re-exports. |

### `src/example/` — 16 routes

| route | what it shows |
|---|---|
| `#screen-size` | Viewport + device + canvas size readout. |
| `#window-mobile` | Trigger bar spawns draggable Confirm dialogs (mobile-flow). |
| `#single` | Full-viewport canvas with `mountDisplays` (click ring + crosshair). |
| `#multiple` | 2×2 quadrants, each a SubCanvas region, same `mountDisplays` per region. |
| `#window` | Two GameWindows (Inventory + Chat) + simulated backend + bus events. |
| `#pixi-confirm` | Five trigger buttons spawn Confirms; HTML log overlay. |
| `#component-window` | Three windows: title-drag, anywhere-drag, non-draggable; open/close/preset controls. |
| `#component-confirm` | Four variants: text, image, 3-button, keepOpen. |
| `#component-image` | Four image slots: proxy image, direct upload, 404, connection refused; error hint toggle. |
| `#component-loading` | Default spinner, custom color, text-only (no spinner). |
| `#component-bus` | Sender + Receiver windows communicating via EventBus pub-sub. |
| `#component-scrollable` | Vertical (50 lines), horizontal (20 cards), no-scrollbar vertical. |
| `#component-clickable-image` | Four thumbnails + FullscreenManager singleton overlay (zoom/drag/close). |
| `#component-scrollable-image` | 16 thumbnails in scrollable panel, clickable images + FullscreenManager (zoom/drag/close). |
| `#component-picture-drag` | Draggable SubCanvas with an image, click-threshold detection via window listeners, bus emit. |
| `#component-text-input` | Text input component (pending implementation). |

`_shared/Displays.ts` is the visualizer shared by `#single` and `#multiple`.

### `src/` root (entry)

| file | role |
|---|---|
| `main.tsx` | `createRoot(...).render(<ErrorBoundary><ExampleApp /></ErrorBoundary>)`. |
| `ExampleApp` (in `example/`) | Hash-based router; renders Launcher home or one of the six demos. |
| `ErrorBoundary.tsx` | Self-contained red panel with Retry. |
| `index.css` | 100% reset + safe-area variables. |

## SubCanvas API surface

```ts
class SubCanvas {
  readonly stage: PIXI.Container;   // child of stage.parent at position=bounds
  readonly bounds: Readonly<Rect>;   // private setter via setBounds / setPosition / setSize
  readonly globalBounds: Rect;       // recursive getter → absolute canvas position
  readonly ticker: PIXI.Ticker;      // alias to rootApp.ticker
  readonly subRegions: readonly SubCanvas[];  // child sub-regions

  setBounds(rect: Rect): void;       // update position+size + trigger onResize
  setPosition(x, y): void;           // position only, no onResize
  setSize(w, h): void;               // size only + trigger onResize
  bringToFront(): void;              // sibling zIndex scan + parent.sortableChildren
  sendToBack(): void;

  // event listeners (SubCanvas AABB routing)
  onPress(fn): this;  onMove(fn): this;  onRelease(fn): this;  onLeave(fn): this;
  offPointer(type, fn): this;
  onResize(fn): this;                // called on setBounds / setSize

  // PIXI proxy
  addChild<T extends PIXI.Container>(child: T): T;  // THE drag install path
  removeChild<T>(c: T): T;

  // create sub-region (drag configured here)
  createSubRegion(bounds: Rect, opts?: {
    clipToBounds?: boolean;
    dragMode?: SubDragMode;          // 'title' | 'anywhere' | 'none'
    dragBounds?: () => Rect | null;
    dragBringToFront?: boolean;
  }): SubCanvas;

  destroy(): void;
}
```

## Key decisions (full list)

1. **No comments in code** unless asked. Inline reasoning goes in `NOTES.md` and per-file `.md`.
2. **No emoji** anywhere — not in code, not in commit messages, not in responses.
3. **Single PIXI canvas** — `assertSingleBodyCanvas()` in `PixiApp` throws on duplicates.
4. **SubCanvas is a `PIXI.Container`**, not a real `PIXI.Application`. Sharing the GPU context keeps the canvas count at 1.
5. **EventBus shared on `proxy.bus`** — pub-sub for cross-window + future backend.
6. **Tag-based drag** — children with `label === 'subcanvas-drag-handle'` are drag handles. `'anywhere'` mode auto-adds a transparent bg child if none.
7. **`SubCanvas.addChild` is the only reliable drag install path** — `win.stage.addChild` (PIXI native) bypasses auto-install. Constructor's initial scan runs before any children exist.
8. **`bringToFront` uses sibling zIndex scan** + `parent.sortableChildren = true`. No static counters.
9. **Drag is dual-path** — PIXI `app.stage.on('pointermove')` for in-canvas events + `window.addEventListener('pointermove')` for fast-jump (single-event) drags. See "fast drag" in 踩过的坑.
10. **`app.stage.eventMode` MUST be `'static'`** — default `'auto'` doesn't receive bubbled events from descendants.
11. **PIXI v8 `Container` has no `setPointerCapture`** — that is a DOM Element method. Use the window-level listener approach.
12. **PIXI v8 `Graphics` hit-area is unstable** for clickable UI. Use `Container` + explicit `hitArea = new Rectangle(...)`.
13. **Public API: `framework/index.ts` and `components/index.ts`** — never deep-import from these folders. If a type isn't re-exported, it's internal.

## 踩过的坑 (curated)

### PIXI drag
- **drag 装好了但不响应**：`SubCanvas.addChild` 才是安装拖拽的入口；`win.stage.addChild` 绕开。（规则 #12）
- **pointerdown 触发了，pointermove 没反应**：`app.stage.eventMode` 没设成 `'static'`。default v8 eventMode = `'passive'`，stage 收不到冒泡事件。
- **PIXI v8 Graphics hit-area 不稳**：用 `Container` + 显式 `hitArea = new Rectangle(...)`。PixiWindow/PixiConfirm 关闭按钮统一用此模式。
- **快拖脱手（fast drag drop，第二次踩）**：PIXI v8 FederatedEvent 每次 move 都过 hit-test；指针跳到无 interactive child 位置时，事件 **既不发给 handle 也不发给 `app.stage`**。`onDown` 触发，`onMove` 一次都不打，`onUp.target=undefined`。**修法**：双层监听 — PIXI `app.stage.on('pointermove')`（命中区在时同步）+ `window.addEventListener('pointermove')`（DOM event 不过 hit-test，永远触发）。位置直接读 `e.clientX/clientY`（canvas 是 `position: fixed; inset: 0`，`client == canvas-relative == PIXI coord`）。详见 `framework/NOTES.md` 1.6。

### PIXI v8 坑
- **Graphics destroy 后 immediate recreate 在同一 callstack 报 `_callContextMethod → clear` null**：PIXI v8 的 render batch 在帧末 flush；若 `destroy()` 释放了 GraphicsContext，然后同一事件处理中 `new Graphics()` 再 `.fill()`，renderer flush 旧 frame 时尝试访问已 null 的 context，报 `TypeError: Cannot read properties of null (reading 'clear')`。**修法**：复用 object 用 `.clear().rect().fill()` 而不是 destroy+new。FullscreenManager `show()` 已踩过。
- **父级 SubCanvas destroy → 子 Graphics context null → tick/event handler 仍调用 `.clear()` 报相同 null 错**：`sc.destroy()` 通过 `stage.destroy()` 连带销毁所有 Graphics 子对象（context=null）。但 `Ticker` 上的 tick 函数或 PIXI event handler 若未及时移除，后续帧仍尝试 `.clear()` → crash。**修法**：(1) destroy 前 `off()` 所有 listener；(2) public 方法（如 `scrollTo` / `recalc`）加 `if (destroyed) return` 守卫；(3) tick 内 `try { graphics.clear() } catch { /* 已销毁，停止 tick */ }`。Scrollable/Loading/Displays 已统一修。
- **Graphics mask 不 `.fill()` 则全隐藏**：PIXI v8 要求 `new Graphics().rect(...).fill({ color: 0xffffff })` — 空 path 的 Graphics 作为 mask 会 **隐藏所有内容**。这个 bug 在 Scrollable 和 PixiImage 的 mask 上都出现过。
- **`eventMode='passive'` 是 v8 默认值**（不同于 v7 的 `'auto'`）。不设 `'static'` 的 Container 不响应 PIXI FederatedEvent，也不转发给子级。
- **`Container` 没有 `setPointerCapture/releasePointerCapture`**：那是 DOM Element 方法。PIXI 需要 window 级 listener 替代。
- **`PIXI.Assets.load` 的 texture 可能 width/height=0**：即使 `.then` 进了，也可能拿到空纹理。PixiImage 加 `texture.width === 0 || texture.height === 0` 检测 → 进 `buildError('empty texture')`。
- **动态 import renderer 可能 hash 不匹配**：Vite build 后 `WebGLRenderer-[hash].js` 可能跟 HTML 引用的 hash 不同。Cloudflare 灰度 deploy + SW cache 导致不同步。

### 组件交互
- **X 关闭按钮在 `opts.keepOpen=true` 时不产生任何效果**（不是"永远关"）。PixiConfirm 的 `closeBtn.on('pointerdown')` 在 `opts.keepOpen` 时直接 `return`，既不调 onResult 也不调 onClose 也不 destroy。需要 X 永远关的 dialog 不要设 `opts.keepOpen`，改用按钮级 `keepOpen: true`。
- **FullscreenManager singleton 竞争条件**：`singletonCollapse` 是模块级变量，被所有 ClickableImage 共享。`goFullScreen()` 先调 `singletonCollapse()` 再创建新 overlay。`collapse()` 设置 `expanded=false` 后 destroy overlay，原子操作。详见 FullscreenManager.md。
- **`showLoading` 的 hide 必须调**：否则 `ticker` 上的 `tick` 永远跑（每帧 clear + 8×fill）。React 里用 `useEffect cleanup` + `try/finally`。
- **Scrollable/ClickableImage 的 mask 和 hitArea 不随 resize 自动更新**：因为它们是独立的 PIXI.Container，不是 SubCanvas。resize 后要手动重建或调用 recalc()。

### 部署 / 缓存
- **Cloudflare Pages 灰度 deploy**：HTML 立即更新，子 bundle（`assets/xxx-[hash].js`）还在旧 hash 状态。**症状**：页面报 `Failed to fetch dynamically imported module`。**修法**：等 1-2 分钟；不要 push 完立即 playwright 测。
- **SW cache 撞 stale**：SW 是 `sim-v2`，network-first nav 仍然可能命中旧 cache。**修法**：`unregister` 一次 SW 再 reload。

### 销毁时序 / 浏览器后退
- **`startPixiApp` 忽略 `onReady` 返回值**：route 组件在 `onReady` 里返回的清理函数（删除 window 监听器、destroy imgs/fm 等）从未被调用。后退时 `proxy.destroyAll()` 先销毁所有 Graphics → 残留的 `window 'pointermove'` 监听器触发 → 在已销毁 Graphics 上调 `.clear()` → `_callContextMethod` crash。**修法**：`startPixiApp` 捕获 `onReady` 返回值并存在 `innerCleanup` 闭包里，`stop()` 时 `innerCleanup?.(); proxy?.destroyAll();` 顺序执行。PixiApp.ts line 266。
- **canvas 双重 DOM removeChild**：`stop()` 手工 `c.parentNode.removeChild(c)` + `app.destroy(true, ...)` 再次移除同一 canvas → `NotFoundError: Failed to execute 'removeChild' on 'Node'`。**修法**：移除手工删除，全部交给 `app.destroy(true, ...)` 统一处理。
- **route 内部清理函数不执行 = window 监听器泄漏**：`onWindowDown/onWindowMove/onWindowUp` 挂在 `window.addEventListener` 上，受作用域闭包保护，永远不会 GC。后退重进同一 route 时重复注册，前一实例的 listener 在旧 scope 上永久残留。**根因**同上（`startPixiApp` 忽略返回值）。
- **ClickableImage placeholder destroy 后仍在 stage.children 中**：`Assets.load()` 的 `.then` 里调 `placeholder.destroy()` 但未先 `removeFromParent()`。PIXI 下帧渲染遍历 children 时访问 null GraphicsContext → crash（`_callContextMethod: clear` on null）。**修法**：`placeholder.removeFromParent(); placeholder.destroy();`（placeholderText 同理）。
- **`SubCanvas.removeChildren()` 泄漏 `_mask` 和 `_bg`**：原实现 `return this.stage.removeChildren()` 把框架内部的 mask Graphics 和 drag 背景 container 也返回给外部。外部代码调 `.destroy()` 会永久删除内部遮罩和拖拽背景。**修法**：过滤 `${this._mask}` 和 `${this._bg}`，只返回业务子对象。
- **`Loading.ts` catch 后 ticker 泄漏**：`spinner.clear()` 在 `try` 中，catch 设 `removed=true` 但没 `sc.ticker.remove(tick)` → tick 函数驻留在 ticker 上每帧跑还占内存。**修法**：catch 块加 `sc.ticker.remove(tick)`。
- **`Displays.ts` crosshair 无 destroy guard**：`sc.onMove` 回调直接 `crosshair.clear()`，`mountDisplays` 返回的 cleanup 销毁 crosshair 后，`onMove` 仍可能触发 → crash。**修法**：`let crosshairAlive = true` + `if (!crosshairAlive) return;`。

### v8 PIXI 怪事
- **`Container.position` setter 是 `this._position.copyFrom(value)`**：外部 observer 会被丢弃。**修法**：用 `setBounds` / `setPosition` / `setSize` 同步。
- **`getLocalPosition(parent)` 在 `'auto'` eventMode 上不可靠**：必须 `eventMode='static'`。
- **`pointerup` on 子 Container vs on stage 不一样**：`proxy.stage.on('pointerup')` 捕获所有 canvas 上的 pointerup，包括 sibling 子树冒泡来的。`container.on('pointerup')` 只捕获直接在 container 或其 children 上的。FM 用 stage-level 时，点击缩略图触发的 bus emit → show() 之后，同一个 pointerup 冒泡进 stage handler 消费了 `justOpened`。修法：`container.on('pointerup')` + 移除 `justOpened`。

## CI / Deploy

- **Cloudflare Pages** auto on push to `sim` → `https://react.moonchan.xyz/`
- **GitHub Actions** (`.github/workflows/`): `ci.yml` (lint + typecheck + build), `codeql.yml`, `dependency-review.yml`, `labeler.yml`, `stale.yml`
- **Dependabot**: weekly Monday 09:00
- **PWA**: `public/manifest.webmanifest` + `public/sw.js` (`sim-v2` — network-first nav, cache-first assets, skipWaiting + controllerchange reload)

## Tags / milestones

| tag | state |
|---|---|---|
| `v0.1.0-pre-restruct` | Pre-restruct archive (PIXI+HTML mix, fast-drag fix landed). |
| `v0.2.0` | Stability round: browser-back crash, ClickableImage destroy order, innerCleanup, Graphics lifecycle guards. |
