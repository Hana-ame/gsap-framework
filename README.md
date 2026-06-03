# subcanvas

PIXI 8 game-UI shell. SubCanvas is the core abstraction: a region of a shared `PIXI.Application` canvas with its own bounds, event routing, and lifecycle.

```
src/
  framework/    PIXI core. SubCanvas is the star. Public API: index.ts.
  components/   PIXI components (Window, Confirm, Image, Loading, Scrollable, ClickableImage, FullscreenManager). Public API: index.ts.
  example/      14 routes demonstrating SubCanvas usage. Launcher is the home.
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

### `src/example/` — 14 routes

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

### v8 PIXI 怪事
- **`Container.position` setter 是 `this._position.copyFrom(value)`**：外部 observer 会被丢弃。**修法**：用 `setBounds` / `setPosition` / `setSize` 同步。
- **`getLocalPosition(parent)` 在 `'auto'` eventMode 上不可靠**：必须 `eventMode='static'`。

## CI / Deploy

- **Cloudflare Pages** auto on push to `sim` → `https://react.moonchan.xyz/`
- **GitHub Actions** (`.github/workflows/`): `ci.yml` (lint + typecheck + build), `codeql.yml`, `dependency-review.yml`, `labeler.yml`, `stale.yml`
- **Dependabot**: weekly Monday 09:00
- **PWA**: `public/manifest.webmanifest` + `public/sw.js` (`sim-v2` — network-first nav, cache-first assets, skipWaiting + controllerchange reload)

## Tags / milestones

| tag | state |
|---|---|
| `v0.1.0-pre-restruct` | Pre-restruct archive (PIXI+HTML mix, fast-drag fix landed). |
| (current `sim` HEAD) | 3-folder restructure (`framework` / `components` / `example`). |
