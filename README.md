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
| **LayerManager** | Named z-ordered layers — zero-overhead abstraction over PIXI.Container + zIndex |
| **InfiniteCanvas** | Plugin-based infinite pan/zoom canvas with chunked lazy loading, deceleration, zoom-to-pointer |
| **Component Registry** | `registerComponent` / `createComponent` — unified factory API for all UI components |
| **EventBus** | Pub-sub for cross-component communication — decoupled, typed, unsubscribe-safe |
| **GSAP Integration** | PixiPlugin pre-registered, ready for `gsap.to(obj, { pixi: { ... } })` |
| **textPresets** | Centralized `textPresets.btn`, `textPresets.label`, `textPresets.dim`, `textPresets.coord`, `textPresets.heading` |
| **PerfDisplay** | On-screen FPS/frametime/object count HUD |
| **Backend Control** | `MockBackend` + `WindowManager` + `ContentChannel` — backend-driven UI via command protocol |
| **Components** | Window / Confirm / Scrollable / Loading / Image / ClickableImage / FullscreenManager / TextInput / VideoPlayer / AVD |

## Structure

```
src/
  framework/    SubCanvas, InfiniteCanvas, EventBus, LayerManager, Component Registry, GSAP, PerfDisplay, UI helpers
  components/   Window, Confirm, Scrollable, Loading, Image, FullscreenManager, VideoPlayer, AVD, TextInput
  backend/      MockBackend + WindowManager + ContentChannel (backend-driven UI control)
  example/      50 routes demonstrating everything
```

---

## SubCanvas

The atomic unit of canvas subdivision. Every SubCanvas has its own PIXI.Container (`stage`) with independent bounds, event routing, and drag behavior.

### Creating a SubCanvas

```ts
// Full-viewport root
const root = proxy.createRegion({ x: 0, y: 0, width: 800, height: 600 });

// Nested sub-region
const panel = root.createRegion({ x: 10, y: 10, width: 200, height: 300 }, {
  dragMode: 'title',      // 'title' | 'anywhere' | 'none'
  dragBounds: () => root.bounds,
  dragBringToFront: true,
  tapThreshold: 4,
});
```

### Pointer events

```ts
region.onPress((e: SubPointerEvent) => { /* pointerdown */ });
region.onMove((e: SubPointerEvent) => { /* pointermove */ });
region.onRelease((e: SubPointerEvent) => { /* pointerup */ });
region.onTap((e: SubPointerEvent) => { /* click (no drag) */ });
region.onLeave((e: SubPointerEvent) => { /* pointerleave */ });
region.offPointer('pointermove', fn);
```

`SubPointerEvent` fields: `type`, `x`, `y` (region-local), `globalX`, `globalY` (client), `originalEvent`.

### Lifecycle & transform

```ts
region.setBounds({ x, y, width, height });  // position + size
region.setPosition(x, y);                    // position only
region.setSize(width, height);               // size only
region.bringToFront();
region.sendToBack();
region.destroy();
region.destroyed;                            // boolean

// PIXI-style shortcuts
region.x; region.y; region.scale; region.rotation;
region.alpha; region.visible; region.tint;
region.eventMode; region.label;
```

### Drag modes

| Mode | Behavior |
|---|---|
| `'title'` | Only drag by children with `label === 'subcanvas-drag-handle'` |
| `'anywhere'` | Drag by clicking anywhere in the region |
| `'none'` | No drag |

Drag handlers are installed on **window-level** `pointermove`/`pointerup` for reliability (events fire even when pointer leaves the canvas). Bounds clamping and `bringToFront` on drag start are built in.

### Drag callbacks

```ts
root.createRegion(bounds, {
  onDragStart: (e) => { /* drag began */ },
  onDrag: (e) => { /* position changed */ },
  onDragEnd: (e) => { /* drag ended */ },
});
```

### Compositing

```ts
const parent = root.createRegion({ x: 0, y: 0, width: 400, height: 300 });
const child = parent.createRegion({ x: 20, y: 20, width: 100, height: 80 });
// Events route hierarchically. parent.onPress and child.onPress both fire appropriately.
```

### Resize observation

```ts
region.onResize((bounds: Rect) => {
  // Called whenever setBounds/setSize fires (debounced at 80ms for canvas resize)
});
```

---

## Components

All PIXI content lives in `src/components/`. Each component follows the `ComponentHandle` contract: `{ stage, destroy(), destroyed }`.

### Window — `createWindow`

Draggable window with title bar, optional close button, and a content SubCanvas.

```ts
import { createWindow } from '../components';

const win = createWindow({
  parent: root,
  title: 'Inventory',
  width: 280, height: 200,
  x: 40, y: 60,
  draggable: true,
  dragMode: 'anywhere',   // 'title' | 'anywhere' | 'none'
  closable: true,
  onClose: () => console.log('closed'),
});

win.setTitle('New Title');
win.content.stage.addChild(sprite);  // add content to the inner region
win.destroy();
```

**Return type**: `GameWindow` (extends `SubCanvas`). Inherits all SubCanvas methods + `setTitle()` and `.content` (inner SubCanvas).

### Confirm — `createConfirm`

Modal dialog with title, message, optional image, and configurable buttons.

```ts
import { createConfirm } from '../components';

const confirm = createConfirm({
  parent: root,
  title: 'Delete?',
  message: 'Are you sure?',
  width: 300, height: 180,
  okText: 'Yes',
  cancelText: 'No',
  onResult: (res) => console.log(res),  // 'ok' | 'cancel' | button label
  // Custom buttons:
  buttons: [
    { label: 'Save', primary: true, onClick: (c) => c.destroy() },
    { label: 'Discard', onClick: (c) => c.destroy() },
  ],
});

confirm.setTitle('New Title');
confirm.setMessage('Updated message');
confirm.setImage('https://example.com/pic.jpg');
```

### Scrollable — `createScrollable`

Masked scrollable container with drag-to-scroll, mouse wheel, and optional scrollbar.

```ts
import { createScrollable } from '../components';

const sc = createScrollable({
  parent: root,
  width: 300, height: 400,
  direction: 'vertical',    // 'vertical' | 'horizontal'
  scrollbar: true,
});

// Add content to the scrollable area (not stage directly)
sc.content.addChild(tallContent);

// Programmatic control
sc.scrollTo(0, 100);
sc.scrollBy(0, -20);
sc.recalc();     // recalculate content bounds
```

### Loading — `showLoading` / `createLoading`

Spinner overlay with configurable text and color.

```ts
import { showLoading, createLoading } from '../components';

// One-shot (auto-dismiss after timeout)
const dismiss = showLoading(root);
setTimeout(dismiss, 2000);

// With custom options
showLoading(root, {
  text: 'Loading...',
  spinnerColor: 0x44ff88,
  overlayAlpha: 0.7,
});

// Persistent handle (ComponentHandle — stage / destroy / destroyed)
const loader = createLoading(root);
// To update text, destroy and recreate with new opts
loader.destroy();
```

### Image — `createLoadingImage`

Image loader with loading spinner, success state, and error placeholder.

```ts
import { createLoadingImage } from '../components';

const img = createLoadingImage({
  parent: root,
  url: 'https://example.com/image.jpg',
  x: 0, y: 0,
  width: 200, height: 150,
});

// Replace URL later
img.load('https://other.com/pic.jpg');
img.destroy();
```

### ClickableImage — `createClickableImage`

Thumbnail that opens FullscreenManager overlay on click.

```ts
import { createClickableImage, createFullscreenManager } from '../components';

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

### VideoPlayer

Two variants:

**PIXI-rendered** (`PixiVideoPlayer`):

```ts
import { createVideoPlayer } from '../components';

const player = createVideoPlayer(parent, {
  url: 'https://example.com/video.mp4',
  width: 640, height: 360,
  autoplay: false,
  muted: true,
  loop: false,
  showControls: true,
  onEnded: () => console.log('done'),
});

player.play();
player.pause();
player.seek(30);
player.stage;     // PIXI Container
player.destroy();
```

**React DOM** (`VideoPlayer` component):

```tsx
import { VideoPlayer } from '../components';

<VideoPlayer
  url="video.mp4"
  width={640}
  height={360}
  controls
  autoplay
/>
```

### TextInput

HTML `<input>` overlaid on canvas, positioned via `requestAnimationFrame` + `getBounds()`.

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
input.getValue();     // string
input.setValue('hi');
input.setEnabled(false);
input.destroy();
```

Invisible overlay captures clicks; on focus GSAP fades in the native `<input>`. PIXI container needs `eventMode = 'static'` + `hitArea` + `cursor = 'text'`.

### FullscreenManager

Full-viewport image viewer launched via EventBus.

```ts
import { createFullscreenManager } from '../components';

const fm = createFullscreenManager(proxy);

// Emit anywhere via EventBus
proxy.bus.emit('fullscreen:show', {
  url: 'image.jpg',
  title: 'Photo',
  overlayColor: 0x000000,
  overlayAlpha: 0.6,
  zoomFactor: 2,
});
```

Supports double-click zoom, drag-to-pan (when zoomed), drag-down-to-dismiss.

### AVD — Visual Novel Engine

Script-driven dialogue system with typewriter text, character portraits, fade transitions.

```ts
import { Avd, parseAvdScriptJSON } from '../components';

const avd = new Avd(stage, screenW, screenH, ticker);

avd.setScript([
  { speaker: 'Narrator', text: 'Once upon a time…' },
  { speaker: 'Hero', text: 'Hello world!', portrait: heroTexture, portraitPos: 'left' },
]);

avd.next();               // advance to next line
avd.goTo(0);              // jump to line index
avd.setTypewriterSpeed(30); // chars/sec
avd.getState();           // 'typing' | 'between' | 'done'
avd.destroy();
```

Options control box dimensions, colors, font, portrait layout, fade durations. See `AvdOptions` for the full list (all fields optional with smart defaults).

Parse from JSON:

```ts
const script = parseAvdScriptJSON(jsonString, (assetName) => textureMap[assetName]);
avd.setScript(script);
```

---

## InfiniteCanvas

Plugin-based infinite pan/zoom canvas. World is divided into fixed-size chunks, loaded/unloaded on demand.

### Basic usage

```ts
import { InfiniteCanvas, type Chunk } from '../framework';

const ic = new InfiniteCanvas({
  parent: subCanvas,
  viewport: { x: 0, y: 0, width: 600, height: 400 },
  chunkSize: 200,
  chunkCreate: ({ cx, cy, container }: Chunk) => {
    // Draw content when chunk enters viewport
    const g = new PIXI.Graphics().rect(0, 0, 200, 200).fill({ color: 0x1a2a3a });
    container.addChild(g);
  },
  chunkDestroy: ({ container }: Chunk) => {
    container.destroy({ children: true });
  },
  onDrag: (worldX, worldY) => console.log(worldX, worldY),
  onTap: (worldX, worldY) => console.log('tap at', worldX, worldY),
  decelerate: true,
  zoom: 1,
  minZoom: 0.3,
  maxZoom: 5,
});
```

### Methods

| Method | Purpose |
|---|---|
| `panBy(dx, dy)` | Pan by screen pixels |
| `panTo(x, y)` | Jump to world coordinate (deprecated, prefer `centerOn`) |
| `centerOn(wx, wy)` | Center viewport on world coordinate |
| `setZoom(z, cx?, cy?)` | Zoom, optionally anchored at screen point (cx, cy) |
| `screenToWorld(sx, sy)` | Convert screen → world coordinates |
| `worldToScreen(wx, wy)` | Convert world → screen coordinates |
| `setViewport(rect)` | Update viewport dimensions |
| `getChunkAt(cx, cy)` | Get loaded chunk by grid index |
| `eachChunk(fn)` | Iterate all loaded chunks |

### Properties

| Property | Returns |
|---|---|
| `worldX`, `worldY` | Viewport center in world space (stable during zoom) |
| `zoom` | Current zoom level |
| `viewport` | Current viewport Rect |
| `loadedChunkCount` | Number of loaded chunks |
| `destroyed` | Boolean |

### Plugins

Extend behavior via `InfiniteCanvasPlugin`:

```ts
const myPlugin: InfiniteCanvasPlugin = {
  name: 'grid-overlay',
  priority: 10,
  onTap(worldX, worldY) { console.log('tapped', worldX, worldY); },
  onUpdate(elapsed) { /* per-frame logic */ },
  onDestroy() { /* cleanup */ },
};

ic.addPlugin(myPlugin);
ic.removePlugin('grid-overlay');
```

Built-in plugins: `DeceleratePlugin` (inertia), enabled by default (`decelerate: true`).

### Performance

- Chunks are synced only when the visible chunk range changes (`_lastChunkRange` cache avoids O(n) traversal on every pixel of drag)
- Deceleration velocity computed over a 50ms time window (avoids phantom fling when mouse stationary before release)

---

## Component Registry

Unified factory API: `registerComponent` / `createComponent`.

### Pre-registered types

| Type | Factory | Options |
|---|---|---|
| `'window'` | `createWindow` | `GameWindowOptions` |
| `'confirm'` | `createConfirm` | `PixiConfirmOptions` |
| `'scrollable'` | `createScrollable` | `ScrollableOptions` |

### Usage

```ts
import { createComponent } from '../framework';

// Dynamic creation from options map
const win = createComponent('window', {
  parent: root, title: 'Hello', width: 300, height: 200,
});
console.log(win.type);     // 'window'
console.log(win.stage);    // PIXI.Container
win.destroy();
```

### Registering a custom component

```ts
import { registerComponent, createComponent } from '../framework';

registerComponent<MyOptions>('my-panel', (opts) => {
  const panel = createMyPanel(opts);
  return {
    type: 'my-panel',
    stage: panel.stage,
    destroy: panel.destroy,
    get destroyed() { return panel.stage.destroyed; },
  };
});

// Anywhere in the app:
const panel = createComponent('my-panel', { parent: root, width: 200, height: 100 });
```

### ComponentHandle contract

Every component returns `{ stage: PIXI.Container, destroy(): void, destroyed: boolean }`. This is the `ComponentHandle` interface.

---

## EventBus

Typed pub-sub.

```ts
import { EventBus } from '../framework';

const bus = new EventBus();

const unsub = bus.on('item:click', (payload: { id: string }) => {
  console.log('clicked', payload.id);
});

bus.emit('item:click', { id: 'sword' });
unsub();  // remove listener
bus.clear();  // remove all
bus.listenerCount('item:click');  // number of handlers
```

Convention: events are namespaced (`component:action`). Handlers are called in registration order. Errors in handlers are caught and logged (one bad handler won't break others).

---

## LayerManager

Named z-ordered layers — zero-overhead abstraction over PIXI.Container + zIndex.

```ts
import { LayerManager } from '../framework';

const layers = new LayerManager(stage);
stage.sortableChildren = true;

const bg = layers.add('bg', 0);
const game = layers.add('game', 10);
const ui = layers.add('ui', 100);

bg.addChild(sprite);
ui.addChild(button);

ui.hide();
ui.show();
layers.bringToFront('game');
layers.sendToBack('bg');
layers.remove('ui');
layers.destroy();
```

---

## GSAP Integration

PixiPlugin pre-registered on import. Rotation in **degrees**.

```ts
import { gsap } from '../framework';

gsap.to(sprite, {
  pixi: { x: 100, y: 200, scale: 1.5, alpha: 0.5, rotation: 360 },
  duration: 0.3,
  ease: 'power2.out',
});

const tl = gsap.timeline();
tl.to(sprite, { pixi: { x: 100 }, duration: 0.3 })
  .to(sprite, { pixi: { alpha: 0 }, duration: 0.2 });
```

---

## textPresets — Style Constants

Centralized text style presets in `ui-helpers.ts`.

```ts
import { textPresets } from '../framework';

// Available presets:
textPresets.btn      // { fontSize: 12, fill: 0xccccee, fontFamily: 'monospace', fontWeight: 'bold' }
textPresets.label    // { fontSize: 11, fill: 0x8888aa, fontFamily: 'monospace' }
textPresets.dim      // { fontSize: 10, fill: 0x556688, fontFamily: 'monospace' }
textPresets.coord    // { fontSize: 10, fill: 0x6688aa, fontFamily: 'monospace' }
textPresets.heading  // { fontSize: 14, fill: 0x8888cc, fontFamily: 'monospace', fontWeight: 'bold' }

new PIXI.Text({ text: 'Hello', style: textPresets.label });
```

---

## PerfDisplay

On-screen FPS/frametime/object count overlay. The root PerfDisplay is created automatically by `startPixiApp`.

```ts
import { startPixiApp } from '../framework';

const stop = startPixiApp((proxy) => {
  proxy.showPerfMeasure(true);  // show HUD
  proxy.showPerfMeasure(false); // hide
});

// Toggle from anywhere:
import { enablePerfMeasure, disablePerfMeasure } from '../framework';
enablePerfMeasure();
disablePerfMeasure();
```

---

## makeInfoPanel

Compact info panel used in all example routes.

```ts
import { makeInfoPanel } from '../framework';

makeInfoPanel(root, {
  title: 'Example',
  lines: ['Description of the feature being demonstrated.'],
  x: 14, y: 14,
  maxWidth: 360,
});
```

---

## Backend-driven UI

MockBackend + WindowManager + ContentChannel — control the display programmatically.

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

backend.send('open-window', { id: 'w1', title: 'Demo', x: 100, y: 100, width: 400, height: 300 });
cc.simulateStream('w1', ['chunk 1', 'chunk 2', 'chunk 3'], 300);
```

Commands: `open-window`, `close-window`, `move-window`, `resize-window`, `set-window-content`, `focus-window`.

---

## Communication patterns

| Method | When to use |
|---|---|
| **EventBus** | Loose coupling, cross-component, multi-window |
| **Direct calls** | Tight coupling, parent-child within one component |
| **GSAP timeline** | Animation sequencing between related elements |

---

## Secondary Development Guide

### Adding a new component

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
  parent.stage.addChild(stage);

  return {
    stage,
    destroy: () => stage.destroy({ children: true }),
    get destroyed() { return stage.destroyed; },
  };
}
```

Export from `src/components/index.ts` and optionally register via `registerComponent`.

### Coding conventions

- **Imports**: external code imports only from `framework/index.ts` and `components/index.ts` — no deep imports
- **Ticker**: use GSAP for animations; PIXI.Ticker only for physics simulations
- **Performance**: separate expensive bounds recalculation from cheap view sync
- **Drag**: always pair PIXI pointer events with `window.addEventListener('pointermove', ...)` fallback
- **Destroy**: always check `destroyed` guard in async callbacks

---

## 经验教训与收获

架构决策记录在 [`src/LEARNINGS.md`](src/LEARNINGS.md)。

| 来源 | 提炼模式 |
|---|---|
| pixi-viewport | 插件系统架构、惯性滚动、zoom-to-pointer、坐标系映射 |
| learningPixi | 函数引用状态机、场景可见性切换、纯工具函数、Texture Atlas 别名 |
| GSAP | PixiPlugin 集成、Ticker lerp → GSAP tween 替换、动画状态简化、Graphics onUpdate 重绘 |
| Component Registry | 统一工厂适配器模式 |
| InfiniteCanvas 拖拽响应 | 50ms 时间窗口算速度代替最后两帧采样 |
| InfiniteCanvas chunk sync | 缓存 chunk 范围，拖动时 O(n) → O(1) |
| SubCanvas `clipToBounds` mask | PixiJS v8 的 stencil mask 用 `getGlobalBounds(mask)` 定位，mask Graphics **必须**是 stage 的子对象（`stage.addChild(mask)`），否则无父级变换，`getGlobalBounds` 始终返回 `(0,0)`，导致裁剪区域偏移 `(bounds.x, bounds.y)` |

## Deploy

Push to `sim` → Cloudflare Pages → `https://react.moonchan.xyz/`

CI: `.github/workflows/ci.yml` — lint → tsc → test → build
