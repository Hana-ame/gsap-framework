# Full API Manual

Consolidated reference for all public exports from `framework/` and `components/`.

---

## framework/

### startPixiApp

```ts
function startPixiApp(onReady?: (proxy: SubCanvasProxy) => void): () => void
```

Entry point. Creates `PIXI.Application` (async init), mounts canvas to body, creates `SubCanvasProxy`, then calls `onReady`. Returns destroy function.

---

### SubCanvasProxy

```ts
class SubCanvasProxy {
  // properties
  readonly canvas: HTMLCanvasElement           // app.canvas
  readonly ticker: PIXI.Ticker                 // app.ticker
  readonly renderer: PIXI.Renderer             // app.renderer
  readonly stage: PIXI.Container               // app.stage
  readonly bus: EventBus                       // shared pub-sub

  // methods
  createRegion(bounds: Rect): SubCanvas
  getTopCanvases(): SubCanvas[]
  destroyAll(): void
  onWindowResize(fn: () => void): () => void
}
```

---

### SubCanvas

```ts
class SubCanvas {
  // properties
  readonly stage: PIXI.Container
  readonly bounds: Rect
  readonly globalBounds: Rect                   // recursive getter
  readonly parent: SubCanvas | null
  readonly rootApp: PIXI.Application
  readonly ticker: PIXI.Ticker
  readonly renderer: PIXI.Renderer
  readonly canvas: HTMLCanvasElement
  readonly destroyed: boolean
  readonly subRegions: readonly SubCanvas[]

  // PIXI proxy
  get position(): ObservablePoint
  get scale(): ObservablePoint
  get pivot(): ObservablePoint
  get rotation(): number
  get angle(): number
  get alpha(): number
  get visible(): boolean
  get tint(): number
  get x(): number
  get y(): number
  get eventMode(): PIXI.EventMode
  get label(): string
  get children(): readonly Container[]

  // children
  addChild<T extends Container>(child: T): T        // auto-installs drag handles
  removeChild<T extends Container>(child: T): T
  removeChildren(): Container[]
  getChildAt(index: number): Container
  getChildByLabel(label: string): Container | null

  // bounds
  setBounds(bounds: Rect): void                      // triggers onResize
  setPosition(x: number, y: number): void            // no onResize
  setSize(width: number, height: number): void       // triggers onResize

  // z-order
  bringToFront(): void                                // sibling zIndex scan
  sendToBack(): void

  // sub-regions
  createRegion(bounds: Rect, opts?: SubRegionOpts): SubCanvas
  getChildren(): SubCanvas[]

  // event listeners (AABB routing)
  onPress(fn: Listener): this
  onMove(fn: Listener): this
  onRelease(fn: Listener): this
  onLeave(fn: Listener): this
  offPointer(type: SubPointerType, fn: Listener): this
  onResize(fn: (bounds: Rect) => void): this

  // lifecycle
  destroy(options?: { children?: boolean; texture?: boolean }): void
}
```

#### SubRegionOpts

```ts
interface SubRegionOpts {
  clipToBounds?: boolean
  dragMode?: SubDragMode           // 'title' | 'anywhere' | 'none'
  dragBounds?: () => Rect | null
  dragBringToFront?: boolean
  onDragStart?: (p: { x: number; y: number }) => void
  onDrag?: (p: { x: number; y: number }) => void
  onDragEnd?: (p: { x: number; y: number }) => void
}
```

#### Supporting Types

```ts
interface Rect {
  x: number
  y: number
  width: number
  height: number
}

type SubPointerType = 'pointerdown' | 'pointermove' | 'pointerup' | 'pointerleave'

interface SubPointerEvent {
  type: SubPointerType
  x: number                                          // local, relative to this SubCanvas
  y: number
  globalX: number                                    // canvas-relative (same as clientX)
  globalY: number
  originalEvent: PointerEvent
}

type Listener = (e: SubPointerEvent) => void

type SubDragMode = 'title' | 'anywhere' | 'none'
```

---

### EventBus

```ts
class EventBus {
  on<T>(event: string, fn: (payload: T) => void): () => void    // returns cleanup
  off(event: string, fn: (payload: unknown) => void): void
  emit<T>(event: string, payload?: T): void
  clear(): void
  listenerCount(event: string): number
}
```

---

## components/

### createWindow

```ts
type PixiDragMode = SubDragMode     // 'title' | 'anywhere' | 'none'

interface GameWindowOptions {
  parent: SubCanvas
  title: string
  width: number
  height: number
  x?: number                         // default 60
  y?: number                         // default 60
  draggable?: boolean                // default true
  dragMode?: PixiDragMode            // default 'title'
  closable?: boolean                 // default true
  onClose?: () => void               // default win.destroy()
}

interface GameWindow extends SubCanvas {
  setTitle(title: string): void
  content: SubCanvas                  // user puts children here
}

function createWindow(opts: GameWindowOptions): GameWindow
```

---

### createConfirm

```ts
type PixiConfirmResult = 'ok' | 'cancel' | string

interface PixiConfirmButton {
  label: string
  onClick?: (confirm: PixiConfirm) => void
  primary?: boolean                  // highlight color
  keepOpen?: boolean                 // button-level: don't auto-destroy after click
}

interface PixiConfirmOptions {
  parent: SubCanvas
  title: string
  message?: string                   // text content (mutually exclusive with image)
  image?: string                     // image URL (takes priority over message)
  imageMaxWidth?: number
  imageMaxHeight?: number
  width: number
  height: number
  x?: number
  y?: number
  draggable?: boolean                // default true
  dragMode?: 'title' | 'anywhere' | 'none'  // default 'title'
  closable?: boolean                 // default true (X = cancel)
  keepOpen?: boolean                 // options-level: prevent auto-destroy on any button
  onClose?: () => void
  okText?: string                    // default 'OK'
  cancelText?: string                // default 'Cancel'
  buttons?: PixiConfirmButton[]      // default [cancel, ok]
  onResult?: (result: PixiConfirmResult, confirm: PixiConfirm) => void
}

interface PixiConfirm extends SubCanvas {
  setTitle(title: string): void
  setMessage(message: string): void
  setImage(url: string): void
  content: SubCanvas
}

function createConfirm(opts: PixiConfirmOptions): PixiConfirm
```

---

### createLoadingImage

```ts
interface PixiImageOptions {
  url: string
  x: number
  y: number
  width: number
  height: number
  maxWidth?: number                  // default width (contain-fit cap)
  maxHeight?: number                 // default height
  placeholderText?: string           // default 'loading...'
  placeholderBg?: number             // default 0x1a1a2a
  placeholderBorder?: number         // default 0x2a2a3a
  placeholderTextColor?: number      // default 0x888888
  showErrorHint?: boolean            // default false; show specific error message
  onLoad?: (texture: PIXI.Texture) => void
  onError?: (err: Error) => void
}

interface PixiImageHandle {
  setUrl(url: string): void                    // token-cancellation safe
  setErrorHintVisible(visible: boolean): void
  destroy(): void
  readonly destroyed: boolean
  readonly container: PIXI.Container
}

function createLoadingImage(parent: SubCanvas, opts: PixiImageOptions): PixiImageHandle
```

---

### showLoading

```ts
interface LoadingOptions {
  text?: string                      // default 'Loading...'
  spinnerColor?: number              // default 0xffffff
  showSpinner?: boolean              // default true; false = text + overlay only
  overlayColor?: number              // default 0x000000
  overlayAlpha?: number              // default 0.5
}

function showLoading(sc: SubCanvas, opts?: LoadingOptions | string): () => void
// opts as string = { text: thatString }
// returns hide() — MUST call it
```

---

### createScrollable

```ts
interface ScrollableOptions {
  width: number
  height: number
  direction?: 'vertical' | 'horizontal'   // default 'vertical'
  scrollbar?: boolean                      // default true
  accept?: { x?: number; y?: number }      // initial scroll position
}

interface Scrollable {
  readonly stage: PIXI.Container
  readonly content: PIXI.Container
  readonly bounds: { width: number; height: number }
  scrollTo(x: number, y: number): void
  scrollBy(dx: number, dy: number): void
  recalc(): void                           // re-measure content bounds
  destroy(): void
  readonly destroyed: boolean
}

function createScrollable(parent: SubCanvas, opts: ScrollableOptions): Scrollable
```

---

### createClickableImage

```ts
interface ClickableImageOptions {
  url: string
  x: number
  y: number
  width: number
  height: number
  overlayColor?: number              // passed to FullscreenManager, default 0x000000
  overlayAlpha?: number              // passed to FullscreenManager, default 0.6
  zoomFactor?: number                // passed to FullscreenManager, default 2
}

interface ClickableImage {
  readonly stage: PIXI.Container
  destroy(): void
  readonly destroyed: boolean
}

// Emits 'fullscreen:show' via EventBus on click
function createClickableImage(parent: SubCanvas, bus: EventBus, opts: ClickableImageOptions): ClickableImage
```

---

### createFullscreenManager

```ts
interface FullscreenManager {
  destroy(): void
}

interface FullscreenShowEvent {
  texture: PIXI.Texture
  texW: number
  texH: number
  thumbGlobalX: number                // thumbnail's global position (for animation)
  thumbGlobalY: number
  thumbW: number
  thumbH: number
  overlayColor?: number
  overlayAlpha?: number
  zoomFactor?: number
}

// Listens for 'fullscreen:show' on bus. Singleton — only one overlay at a time.
function createFullscreenManager(proxy: SubCanvasProxy): FullscreenManager
```

---

## Event Bus Protocol

The bus carries these known events:

| Event | Payload | Emitter | Consumer |
|-------|---------|---------|----------|
| `'fullscreen:show'` | `FullscreenShowEvent` | ClickableImage | FullscreenManager |

Add new events here as the system grows. Event names use colon namespace (`domain:action`).
