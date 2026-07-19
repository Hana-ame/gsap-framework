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
| **SubCanvas** | Region-based canvas subdivision, recursive event routing, drag (`title` / `anywhere` / `none`) |
| **InfiniteCanvas** | Plugin-based infinite pan/zoom canvas with chunked lazy loading, deceleration, zoom-to-pointer |
| **Component Registry** | `registerComponent` / `createComponent` — unified factory API for all UI components |
| **GSAP Integration** | `gsap-pixi.ts` — PixiPlugin pre-registered with PIXI, ready for `gsap.to(obj, { pixi: { ... } })` |
| **EventBus** | Pub-sub for cross-component communication — decoupled, typed, unsubscribe-safe |
| **Components** | Window / Confirm / Scrollable / Image / ClickableImage / FullscreenManager / AVD (visual novel engine) |
| **Backend Control** | `MockBackend` + `WindowManager` + `ContentChannel` — backend-driven UI via command protocol, WS-ready |
| **Performance** | Bounds calc vs view sync separation, window-level pointer events for smooth drag, 80ms debounced resize |

## Structure

```
src/
  framework/    PIXI core + GSAP + EventBus + Component Registry + InfiniteCanvas
  components/   Window, Confirm, Scrollable, Image, FullscreenManager, AVD, etc.
  backend/      MockBackend + WindowManager + ContentChannel (backend-driven UI control)
  example/      32+ routes demonstrating everything
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

## 经验教训与收获

所有外部代码分析、架构决策、模式提炼记录在 [`src/LEARNINGS.md`](src/LEARNINGS.md)。涵盖：

| 来源 | 提炼模式 |
|------|----------|
| pixi-viewport | 插件系统架构、惯性滚动、zoom-to-pointer、坐标系映射 |
| learningPixi | 函数引用状态机、场景可见性切换、纯工具函数、Texture Atlas 别名 |
| GSAP | PixiPlugin 集成、Ticker lerp → GSAP tween 替换、动画状态简化、Graphics onUpdate 重绘 |
| Component Registry | 统一工厂适配器模式、`registerComponent` / `createComponent` API |

## Conventions

- **Imports**: external code imports only from `framework/index.ts` and `components/index.ts` — no deep imports.
- **Ticker**: use GSAP for one-shot and looping animations; keep PIXI.Ticker only for physics simulations.
- **Performance**: separate expensive bounds recalculation from cheap view sync (see `Scrollable.ts` pattern).
- **Drag**: always pair PIXI pointer events with `window.addEventListener('pointermove', ...)` fallback for reliability.
- **Destroy**: always check `destroyed` guard in async callbacks.

## Deploy

Push to `sim` → Cloudflare Pages → `https://react.moonchan.xyz/`

CI: `.github/workflows/ci.yml` — lint → tsc → test → build
