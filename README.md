# GSAP Framework

PIXI v8 game UI framework with GSAP-powered animation.

`SubCanvas` is the core — a region of a shared `PIXI.Application` canvas with its own bounds, event routing, lifecycle, and drag behavior. Build complex UIs by nesting SubCanvases, each hosting any PIXI content.

## Install

```sh
npm install pixi.js gsap
```

## Quick start

```ts
import { startPixiApp } from './framework';
import { createWindow } from './components';

const stop = startPixiApp((proxy) => {
  const root = proxy.createRegion({ x: 0, y: 0, width: 800, height: 600 });

  const win = createWindow({
    parent: root,
    title: 'My Window',
    width: 320, height: 240,
    x: 40, y: 40,
  });

  win.content.stage.addChild(/* any PIXI display object */);
});
```

## Features

| | |
|---|---|
| **LayerManager** | Named z-ordered layers (`add`, `get`, `remove`, `bringToFront`, `sendToBack`, show/hide, alpha) — zero-overhead abstraction over PIXI.Container + zIndex |
| **InfiniteCanvas** | Plugin-based infinite pan/zoom canvas with chunked lazy loading, deceleration, zoom-to-pointer. `worldX/worldY` returns viewport-center world coordinates (stable during zoom). |
| **Component Registry** | `registerComponent` / `createComponent` — unified factory API for all UI components |
| **GSAP Integration** | `gsap-pixi.ts` — PixiPlugin pre-registered with PIXI, ready for `gsap.to(obj, { pixi: { ... } })` |
| **TXT style constants** | Centralized `TXT.btn`, `TXT.label`, `TXT.dim`, `TXT.coord`, `TXT.heading` — one place to change global font/color |
| **EventBus** | Pub-sub for cross-component communication — decoupled, typed, unsubscribe-safe |
| **Components** | Window / Confirm / Scrollable / Image / ClickableImage / FullscreenManager / TextInput / VideoPlayer / AVD (visual novel engine) |
| **Backend Control** | `MockBackend` + `WindowManager` + `ContentChannel` — backend-driven UI via command protocol, WS-ready |
| **Performance** | Bounds calc vs view sync separation, window-level pointer events for smooth drag, 80ms debounced resize |

## Structure

```
src/
  framework/    PIXI core + GSAP + EventBus + Component Registry + InfiniteCanvas + LayerManager
  components/   Window, Confirm, Scrollable, Image, FullscreenManager, AVD, etc.
  backend/      MockBackend + WindowManager + ContentChannel (backend-driven UI control)
  example/      47+ routes demonstrating everything
```

## Secondary Development Guide

### Adding a new component

Create your component in `src/components/` following this contract:

```ts
// src/components/MyPanel.ts
import { Container } from 'pixi.js';
import type { SubCanvas } from '../framework';

export interface MyPanelOptions {
  parent: SubCanvas;
  width: number;
  height: number;
  color?: number;
}

export function createMyPanel(opts: MyPanelOptions) {
  const { parent, width, height, color = 0x333333 } = opts;

  const stage = new Container();
  // ... build your PIXI content
  parent.stage.addChild(stage);

  return {
    stage,
    destroy: () => {
      stage.destroy({ children: true });
    },
  };
}
```

Then expose it from `src/components/index.ts`:

```ts
export { createMyPanel } from './MyPanel';
```

Optionally register it in `src/framework/register-components.ts` so it works with `createComponent()`.

### Extending with the Component Registry

```ts
import { registerComponent } from '../framework';

registerComponent<MyPanelOptions>('my-panel', (opts) => {
  const panel = createMyPanel(opts);
  return {
    type: 'my-panel',
    stage: panel.stage,
    destroy: panel.destroy,
    get destroyed() { return panel.stage.destroyed; },
  };
});

// Consumers use unified API:
const panel = createComponent('my-panel', { parent: root, width: 200, height: 100 });
```

### InfiniteCanvas plugins

```ts
import { InfiniteCanvas, type InfiniteCanvasPlugin } from '../framework';

const myPlugin: InfiniteCanvasPlugin = {
  name: 'grid',
  priority: 10,
  onTap(worldX, worldY) {
    console.log('tapped at', worldX, worldY);
  },
  onUpdate(elapsed) {
    // per-frame logic
  },
};

ic.addPlugin(myPlugin);
ic.removePlugin('grid');
```

### Using GSAP for animation

```ts
import { gsap } from '../framework';

// Animate any PIXI display object
gsap.to(sprite, {
  pixi: { x: 100, y: 200, scale: 1.5, alpha: 0.5, rotation: 360 },
  duration: 0.3,
  ease: 'power2.out',
});

// Timelines for sequenced animation
const tl = gsap.timeline();
tl.to(sprite, { pixi: { x: 100 }, duration: 0.3 })
  .to(sprite, { pixi: { alpha: 0 }, duration: 0.2 });
```

> `pixi: { rotation }` uses **degrees**. `pixi: { x, y, scale, alpha, tint }` map to PIXI properties directly.

### Backend-driven UI

Control the display via a mock or real backend:

```
MockBackend (JS commands)
    ↓
WindowManager (buffer layer — window lifecycle)
    ├── create/close/move/resize windows
    └── route content to windows
ContentChannel (WS-streamed content)
    ↓
Framework API → PIXI rendering
```

```ts
import { MockBackend, WindowManager, ContentChannel } from '../backend';

const backend = new MockBackend();
backend.connect();

const wm = new WindowManager(backend, rootSubCanvas);
const cc = new ContentChannel(backend);

// Backend sends commands — WindowManager executes them
backend.send('open-window', { id: 'w1', title: 'Demo', x: 100, y: 100, width: 400, height: 300 });

// WS-streamed content
cc.simulateStream('w1', ['[chunk 1/3]', '[chunk 2/3]', '[chunk 3/3]'], 300);
```

In production, replace `MockBackend` with a WebSocket connection. The command protocol (`BackendCommand`) maps 1:1.

### Communication patterns

| Method | When to use |
|--------|-------------|
| **EventBus** | Loose coupling, cross-component, multi-window |
| **Direct calls** | Tight coupling, parent-child within one component |
| **GSAP timeline** | Animation sequencing between related elements |

### TextInput — Overlay input field

Renders an HTML `<input>` element over the canvas, positioned to match the PIXI scene coordinates. Supports text, password, placeholder, maxLength, onChange, onSubmit.

```ts
import { createTextInput } from '../components';

const input = createTextInput(parent.stage, {
  x: 40, y: 100,
  width: 300, height: 34,
  placeholder: 'type something…',
  password: false,
  maxLength: 20,
  onChange: (v) => console.log(v),
  onSubmit: (v) => console.log('submitted:', v),
});

input.focus();
input.blur();
input.getValue();   // string
input.setValue('hi');
input.setEnabled(false);
input.destroy();
```

**How it works**: A transparent DOM overlay (`pointer-events: auto`, `opacity: 0`) is always positioned over the PIXI container via `requestAnimationFrame` + `getBounds()`. Clicking the overlay or the PIXI container focuses the input. On focus, GSAP fades the overlay in and positions the native `<input>` for actual typing. On blur, the overlay fades out but remains clickable — the PIXI `pointerdown` handler serves as backup for environments where SubCanvas routing bypasses PIXI events.

**PIXI container requirements**: `eventMode = 'static'` + `hitArea` + `cursor = 'text'` must be set for PIXI events to work (PixiJS v8 defaults to `'passive'`).

### FullscreenManager — Image viewer overlay

Full-viewport image viewer launched via EventBus `'fullscreen:show'` event. Supports click-to-open, double-click zoom, drag-to-pan (when zoomed), drag-down-to-close.

```ts
import { createFullscreenManager, createClickableImage } from '../components';

const fm = createFullscreenManager(proxy);

createClickableImage(panel, proxy.bus, {
  url: 'image.jpg',
  x: 0, y: 0,
  width: 180, height: 180,
  overlayColor: 0x000000,
  overlayAlpha: 0.6,
  zoomFactor: 2,
});
```

### PerfDisplay — On-screen performance HUD

Code-controlled FPS/frametime/object count overlay, created automatically by `startPixiApp` and exposed on the proxy:

```ts
import { startPixiApp } from '../framework';

const stop = startPixiApp((proxy) => {
  // Show performance HUD
  proxy.showPerfMeasure(true);

  // ... build your scene

  // Hide it later
  proxy.showPerfMeasure(false);
});
```

Displays:
- **FPS** — 60-frame rolling average
- **Frame time** — ms per frame
- **Object count** — recursive scene graph traversal
- **Resolution** — canvas logical size

Default position is top-left `(10, 10)` with monospace green text. Disabled by default; call `proxy.showPerfMeasure(true)` to enable.

Standalone usage outside `startPixiApp`:

```ts
import { PerfDisplay } from '../framework';

const perf = new PerfDisplay(app.ticker, () => app.stage, {
  x: 10, y: 10,
  fontSize: 11,
  color: 0x88ff88,
});
perf.enable();
```

### LayerManager — Named z-ordered layers

Zero-overhead abstraction over `PIXI.Container` + `zIndex`. No extra draw calls, no hidden traversal.

```ts
import { LayerManager } from '../framework';

const layers = new LayerManager(stage);
stage.sortableChildren = true;  // LayerManager requires this

const bg     = layers.add('bg',      0);    // name + zIndex
const game   = layers.add('game',   10);
const ui     = layers.add('ui',    100);
const overlay= layers.add('overlay',200);

// Use like any Container
bg.addChild(sprite);
ui.addChild(button);

// Visibility
ui.hide();
ui.show();

// Alpha
overlay.setAlpha(0.5);

// Reorder
layers.bringToFront('ui');
layers.sendToBack('bg');

// Query
const layer = layers.get('ui');
layer?.addChild(element);
layers.has('bg');       // true
layers.names();         // ['bg', 'game', 'ui', 'overlay']

// Remove
layers.remove('overlay');

// Destroy all
layers.destroy();
```

## 经验教训与收获

所有外部代码分析、架构决策、模式提炼记录在 [`src/LEARNINGS.md`](src/LEARNINGS.md)。涵盖：

| 来源 | 提炼模式 |
|------|----------|
| pixi-viewport | 插件系统架构、惯性滚动、zoom-to-pointer、坐标系映射 |
| learningPixi | 函数引用状态机、场景可见性切换、纯工具函数、Texture Atlas 别名 |
| GSAP | PixiPlugin 集成、Ticker lerp → GSAP tween 替换、动画状态简化、Graphics onUpdate 重绘 |
| Component Registry | 统一工厂适配器模式、`registerComponent` / `createComponent` API |
| InfiniteCanvas 拖拽响应 | 用 50ms 时间窗口计算速度代替最后两帧采样，避免鼠标静止后松手仍有惯性滑动 |
| InfiniteCanvas chunk sync | 缓存 chunk 范围 (minCx/maxCx/minCy/maxCy)，拖动时跨 chunk 时才执行 sync，大部分帧从 O(n) → O(1) |

## Conventions

- **Imports**: external code imports only from `framework/index.ts` and `components/index.ts` — no deep imports.
- **Ticker**: use GSAP for one-shot and looping animations; keep PIXI.Ticker only for physics simulations.
- **Performance**: separate expensive bounds recalculation from cheap view sync (see `Scrollable.ts` pattern).
- **Drag**: always pair PIXI pointer events with `window.addEventListener('pointermove', ...)` fallback for reliability.
- **Destroy**: always check `destroyed` guard in async callbacks.

## Deploy

Push to `sim` → Cloudflare Pages → `https://react.moonchan.xyz/`

CI: `.github/workflows/ci.yml` — lint → tsc → test → build
