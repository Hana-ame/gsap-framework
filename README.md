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
| **Component factories** | `createWindow` / `createConfirm` / `createScrollable` — direct factory calls, no registry indirection |
| **EventBus** | Pub-sub for cross-component communication — decoupled, typed, unsubscribe-safe |
| **GSAP Integration** | PixiPlugin pre-registered, ready for `gsap.to(obj, { pixi: { ... } })` |
| **textPresets** | Centralized `textPresets.btn`, `textPresets.label`, `textPresets.dim`, `textPresets.coord`, `textPresets.heading` |
| **PerfDisplay** | On-screen FPS/frametime/object count HUD |
| **Backend Control** | `MockBackend` + `WindowManager` + `ContentChannel` — backend-driven UI via command protocol |
| **Components** | Window / Confirm / Scrollable / Loading / Image / ClickableImage / FullscreenManager / TextInput / VideoPlayer / AVD |
| **AVD Framework** | `DialogueStateMachine` / `TypingEngine` / `RosterManager` / `DialogueBox` / `PortraitLayer` / `AvdController` |

## Structure

```
src/
  framework/    SubCanvas, InfiniteCanvas, EventBus, LayerManager, GSAP, PerfDisplay, UI helpers
  avd/          DialogueStateMachine, TypingEngine, RosterManager, DialogueBox, PortraitLayer, AvdController, AvdScript
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

During a drag, subsequent `pointermove`/`pointerup`/`pointerleave` are **consumed** by the dragging SubCanvas — sibling regions (e.g. an InfiniteCanvas behind a window) won't receive them. This prevents the "drag penetration" problem where dragging a window also pans the canvas beneath.

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
  dragMode: 'title',   // 'title' | 'anywhere' | 'none'
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

### AVD Framework — `src/avd/`

A dedicated framework layer for visual novel dialogue, built on top of `framework/`. Composed of independently testable modules replacing the monolithic `components/Avd`.

| Module | Responsibility |
|--------|---------------|
| `DialogueStateMachine` | typing → between → done FSM (zero PIXI dependency) |
| `TypingEngine` | Per-frame character reveal using `framework/text-effects-layout` |
| `RosterManager` | Roster data + highlight logic (zero PIXI dependency) |
| `DialogueBox` | Background box + speaker name + arrow renderer |
| `PortraitLayer` | Portrait renderer with fade / setAll bulk mode |
| `AvdController` | Thin orchestrator tying all modules together |
| `AvdScript` | JSON script parser with parallel texture loading |

```ts
import { AvdController } from '../avd';

const avd = new AvdController(parentContainer, ticker, {
  screenW: 800, screenH: 600,
});

avd.setScript([
  { speaker: 'Narrator', text: '...' },
  { speaker: 'Hero', text: 'Hello!' },
]);
avd.next();                    // advance/complete typewriter
avd.setTypewriterSpeed(60);
avd.getState();                // 'typing' | 'between' | 'done'
avd.setRoster({ Alice: { pos: 'left', texture: tex } });
avd.setRosterMode('persistent');
avd.destroy();
```

Compared to the legacy `components/Avd`:
- **TypingEngine** reuses `text-effects-layout.buildLayout` (eliminates `AvdInlineLayout` duplication)
- **DialogueStateMachine** is pure logic — testable without PIXI
- **RosterManager** decouples roster data from rendering
- **PortraitLayer.setAll()** handles persistent mode with one bulk call

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
import { textPresets } from '../components';

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
import { makeInfoPanel } from '../components';

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

Export from `src/components/index.ts`.

### Coding conventions

- **Imports**: external code imports only from `framework/index.ts` and `components/index.ts` — no deep imports
- **Ticker**: use GSAP for animations; PIXI.Ticker only for physics simulations
- **Performance**: separate expensive bounds recalculation from cheap view sync
- **Drag**: always pair PIXI pointer events with `window.addEventListener('pointermove', ...)` fallback
- **Destroy**: always check `destroyed` guard in async callbacks

---

## 经验教训与收获

## Text Effects — `text()`

一行创建文字动效：

```ts
import { text } from './framework';
text(canvas.stage, 'Hello World', 'typewriter');
```

支持 7 种动效：`typewriter` / `fadeInChars` / `fadeIn` / `slideIn` / `scaleBounce` / `charRain` / `scramble`。详见 [`SPEC.md`](SPEC.md#text-effects--text-一行动效)。

架构决策记录在 [`src/LEARNINGS.md`](src/LEARNINGS.md)。

| 来源 | 提炼模式 |
|---|---|
| pixi-viewport | 插件系统架构、惯性滚动、zoom-to-pointer、坐标系映射 |
| learningPixi | 函数引用状态机、场景可见性切换、纯工具函数、Texture Atlas 别名 |
| GSAP | PixiPlugin 集成、Ticker lerp → GSAP tween 替换、动画状态简化、Graphics onUpdate 重绘 |
| InfiniteCanvas 拖拽响应 | 50ms 时间窗口算速度代替最后两帧采样 |
| InfiniteCanvas chunk sync | 缓存 chunk 范围，拖动时 O(n) → O(1) |
| SubCanvas `clipToBounds` mask | PixiJS v8 的 stencil mask 用 `getGlobalBounds(mask)` 定位，mask Graphics **必须**是 stage 的子对象（`stage.addChild(mask)`），否则无父级变换，`getGlobalBounds` 始终返回 `(0,0)`，导致裁剪区域偏移 `(bounds.x, bounds.y)` |
| DragController handle/anywhere 冲突 | 重构提取 `DragController` 后，`SubCanvas.addChild` 在 `dragMode: 'anywhere'` 时也会为 `DRAG_HANDLE_LABEL` 子对象调用 `installHandle`。handle 的 `pointerdown` 立即设置共享的 `_isDragging=true`（而旧代码使用局部变量），导致 `handlePointer` 早早吞没后续 move/up 事件，内嵌 SubCanvas（如 InfiniteCanvas）收不到指针事件。修复：`addChild` 仅在 `mode === 'title'` 时安装 handle，且 `_applyAnywhereDrag` 改用 `getBounds()`（local）代替 `globalBounds()` 做位置基准，避免嵌套偏移误差。 |
| `SubCanvas.handlePointer` children-first | `'anywhere'` 模式下 `pointerdown` 先遍历子节点尝试消费事件，子节点消费后跳过父级 drag 激活但仍触发 `bringToFront`，避免内嵌 InfiniteCanvas 被窗口拖拽吞没。 |
| DragController title 坐标 | title 拖拽用 `getLocalPosition(parent)` 取鼠标坐标，parent 变换后坐标漂移；改为 `pixiEvent.clientX/clientY` 直接读屏幕坐标，避开所有本地变换 |
| PixiApp pointer listener 泄漏 | `makePointerHandler` 每次调返回新箭头函数，`removeEventListener` 永不命中；改用 `Map<type, handler>` 缓存引用 |
| Layer zIndex IEEE 754 溢出 | 频繁 `bringToFront` 使 zIndex 持续增长，超过 `2^24` (≈1.67e7) 后 float 精度不足，`sortChildren` 不再稳定。`_renormIfNeeded()` 在 ≥1e6 时统一归零 |
| text-effects 死代码 | `charToItem` 数组分配后未使用；`chars`/`fullChars` 拆分后只应在 scramble 分支计算，避免所有 effect 都做无用功 |
| PixiJS v8 removeEventListener | `removeEventListener` 要求传入**同一函数引用**；不能 inline lambda，不能包装工厂函数。必须保存引用到 Map 或类字段 |
| DragController handle `removed` 事件 | `_installOnHandle` 后监听 `handle.on('removed', uninstallHandle)`。手柄被子节点 `removeChild` 时自动清理，`SubCanvas.removeChild` 不再需要手动 `this._drag.uninstallHandle(child)`。清理函数优先 `off('removed')` 防止 re‑entry 导致二次 cleanup |
| PixiMixins 类型扩展 | PixiJS v8 通过 `declare global { namespace PixiMixins { interface ContainerOptions { ... } } }` 扩展 `Container` 构造函数选项。新增 `isDragHandle?: boolean` 并在 `SubCanvas.addChild` 中做 `child.isDragHandle` 检查。运行时通过 `Object.defineProperty(Container.prototype, 'isDragHandle', { get/set })` 映射到 `label` |
| DirtyPropagator 脏传播 | `mark()` O(1) 设脏标志并向上传播到根；`clean()` 从根递归遍历脏子树，自顶向下调用 `onFlush`。替代每帧全量 O(n) 遍历。LayerManager 已集成：`bringToFront/sendToBack` 改为 `layer.propagator.mark()`，`manager.flush()` 执行实际 `_renormIfNeeded()` |
| ZOrderManager 溢出保护 | 提取 `renormZIndices(parent)` 到 `ZOrderManager.ts`，`bringToFront`/`sendToBack` 末尾自动调用。此前 SubCanvas 的 zIndex 缺乏溢出防护 |
| gown.js invalidation 模式 | UI 控件设 `invalidState = true`，下一帧 `updateTransform` 钩子统一 `redraw()`。避免 prop setter 做昂贵计算。适配到 `WindowBorder`：`resize()` 设 `_dirty`，`redraw()` 在 Graphics.clear + rect/fill 重绘前用值比较去重 |
| gown.js layout 惰性求值 | `LayoutGroup` 组合 `_needUpdate` + `stage.onRender`。`addChild` 设脏，下一帧 `_arrange()` 自动排子元素位置。每帧最多一次，支持 vertical/horizontal、gap、padding、对齐方式。独立于容器，组合优于继承 |
| gown.js 9-slice → `WindowBorder` | Graphics 版 9-slice，`stroke` 画边框轮廓 + `fill` 填充背景。支持 `cornerRadius`、`borderWidth`、`borderColor`。在 `PixiWindow`/`PixiConfirm` 中用 `onResize` + `relayout()` 联动重绘 bg/bar/title/closeBtn/content，彻底修复窗口 resize 时装饰不更新 bug |
| pixi-tiledmap packed mesh | Tile 按纹理源+alpha 分组，每 batch 累计 quad pos/uv 后 finalize() 成一个 `Mesh`。同源同 alpha 编辑 O(1) buffer 原地 patch。可用策略：等 terrain 颜色固化后，将每个地形 chunk 的 `PIXI.Graphics` 替换为 packed Mesh，视口移动只需 chunk 可见性切换，无需任何 draw call 创建/销毁 |
| pixi-tiledmap 三层管线 | Parser（解析 TMJ/TMX）→ Resolver（归一化 GID 为 ResolvedTile）→ Renderer（构造场景图）。IR 边界清晰：无论从文件加载还是 `createMap()` 程序创建，都走同一渲染路径。当前 `InfiniteCanvas` 的 chunk 创建+销毁回调可类比 Resolver→Renderer 的分离模式 |
| antvis plugin 系统 | 功能分解为 `{ apply(context: PluginContext) => void }`，通过 Tapable hooks（init/beginFrame/endFrame/destroy/resize）组合。`InfiniteCanvas` 已预留 `InfiniteCanvasPlugin` 接口，后续 chunk loading、terrain、entity 可拆为独立插件 |
| antvis camera 矩阵分离 | 正交 2D Camera 维护 `projectionMatrix` / `viewMatrix` / `viewProjectionMatrix` / `viewProjectionMatrixInv`。Zoom-to-pointer：前后 zoom 各自通过 `viewProjectionMatrixInv` 将鼠标投到世界坐标算 camera offset。hit-testing 同理逆矩阵转换。`InfiniteCanvas` 可借鉴统一矩阵管线和 dirty-flag 控制渲染资源重建 |

## Known Issues

### Layer violations

| Issue | Details |
|-------|---------|
| `backend/WindowManager.ts` imports from `components/` and `example/` | Backend layer (`src/backend/`) depends on `createWindow` from `components/` and `mountDisplays` from `example/`. Production code should not depend on demo code. |

## Version bump

每次升版本号时，需要改以下地方：

| # | 位置 | 改什么 |
|---|------|--------|
| 1 | `package.json` | `"version": "x.y.z"` |
| 2 | `git checkout main && git merge --no-ff sim -m "merge sim into main"` | 把 `sim` 合入 `main` |
| 3 | `git tag vx.y.z` | 在 `main` 上打 tag |

## Deploy

Push to `sim` → Cloudflare Pages → `https://react.moonchan.xyz/`

CI: `.github/workflows/ci.yml` — lint → tsc → test → build
