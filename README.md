# subcanvas

PIXI 8 game-UI shell. SubCanvas is the core abstraction: a region of a shared `PIXI.Application` canvas with its own bounds, event routing, and lifecycle.

```
src/
  framework/    PIXI core. SubCanvas is the star. Public API: index.ts.
  components/   PIXI components (Window, Confirm, Image, Loading). Public API: index.ts.
  example/      Six demos of SubCanvas usage. Launcher is the home.
```

Deploy: `https://react.moonchan.xyz/` (Cloudflare Pages auto on push to `sim`).

## Quick start

```ts
import { startPixiApp } from './framework';
import { createWindow } from './components';

const stop = startPixiApp((proxy) => {
  const win = createWindow({
    title: 'Inventory',
    w: 320, h: 240,
    x: 40, y: 40,
    parent: proxy.root,
  });
  win.content.addChild(/* your PIXI display objects */);
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
| `PixiWindow.ts` | `createWindow({ title, w, h, x, y, parent, dragMode, dragBounds })` → draggable GameWindow. |
| `PixiConfirm.ts` | `createConfirm({ title, message?, imageUrl?, buttons, parent })` → modal dialog with text/image. |
| `PixiImage.ts` | `createLoadingImage(parent, { url, ... })` → async PIXI image with placeholder + token-cancel. |
| `Loading.ts` | `showLoading(sc, text?)` → semi-transparent overlay + spinning ring. Returns `() => void` to stop. |
| `index.ts` | Public re-exports. |

### `src/example/` — six demos

| route | what it shows |
|---|---|
| `#screen-size` | Viewport + device + canvas size readout. |
| `#window-mobile` | Trigger bar spawns draggable Confirm dialogs (mobile-flow). |
| `#single` | Full-viewport canvas with `mountDisplays` (click ring + crosshair). |
| `#multiple` | 2×2 quadrants, each a SubCanvas region, same `mountDisplays` per region. |
| `#window` | Two GameWindows (Inventory + Chat) + simulated backend + bus events. |
| `#pixi-confirm` | Five trigger buttons spawn Confirms; HTML log overlay. |

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
  readonly ticker: PIXI.Ticker;      // alias to rootApp.ticker
  readonly bus: EventBus;            // shared on proxy

  setBounds(x, y, w, h): void;      // single set, no extra updates
  setPosition(x, y): void;
  setSize(w, h): void;
  bringToFront(): void;             // sibling zIndex scan + parent.sortableChildren
  sendToBack(): void;
  clipToBounds: boolean;            // opt-in: stage.mask = full-bounds rect

  // event listeners (typed)
  onPress(fn): this;  onMove(fn): this;  onRelease(fn): this;  onLeave(fn): this;
  offPointer(type, fn): this;  oncePointer(type, fn): this;

  // drag (config via setDraggable)
  setDraggable({ mode, getBounds, onStart, onDrag, onEnd, bringToFront }): void;
  //  SubDragMode = 'title' | 'anywhere' | 'none'
  //  tagged children: Container.label === 'subcanvas-drag-handle'
  //  'anywhere' auto-adds a transparent bg child if no tagged child exists

  addChild<T extends PIXI.Container>(child: T): T;   // THE drag install path
  createSubRegion(opts: { x, y, width, height }): SubCanvas;
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
- **drag 装好了但不响应**：`SubCanvas.addChild` 才是安装拖拽的入口；`win.stage.addChild` 绕开。
- **pointerdown 触发了，pointermove 没反应**：`app.stage.eventMode` 没设成 `'static'`。
- **PIXI v8 Graphics hit-area 不稳**：用 `Container` + 显式 `hitArea = new Rectangle(...)`。
- **快拖脱手（fast drag drop，第二次踩）**：PIXI v8 FederatedEvent 每次 move 都过 hit-test；指针跳到无 interactive child 位置时，事件 **既不发给 handle 也不发给 `app.stage`**。`onDown` 触发，`onMove` 一次都不打，`onUp.target=undefined`。**修法**：双层监听 — PIXI `app.stage.on('pointermove')`（命中区在时同步）+ `window.addEventListener('pointermove')`（DOM event 不过 hit-test，永远触发）。位置直接读 `e.clientX/clientY`（canvas 是 `position: fixed; inset: 0`，`client == canvas-relative == PIXI coord`）。详见 `framework/NOTES.md` 1.6 + 框架决策 #9。

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
