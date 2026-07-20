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
  showPerfMeasure(show: boolean): void
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
  readonly subRegions: readonly SubCanvas[]

  // event listeners (AABB routing)
  onPress(fn: Listener): this
  onMove(fn: Listener): this
  onRelease(fn: Listener): this
  onTap(fn: Listener): this
  onLeave(fn: Listener): this
  offPointer(type: SubPointerType, fn: Listener): this
  onResize(fn: (bounds: Rect) => void): this

  // lifecycle
  destroy(): void
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

type SubPointerType = 'pointerdown' | 'pointermove' | 'pointerup' | 'pointerleave' | 'tap'

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

function createScrollable(opts: ScrollableOptions): Scrollable
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

### createTextInput

HTML `<input>` overlaid on canvas, positioned via `requestAnimationFrame` + `getBounds()`.

```ts
interface TextInputOptions {
  x: number
  y: number
  width: number
  height: number
  placeholder?: string
  password?: boolean
  maxLength?: number
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
}

interface TextInputHandle {
  focus(): void
  blur(): void
  getValue(): string
  setValue(v: string): void
  setEnabled(enabled: boolean): void
  destroy(): void
}

function createTextInput(container: PIXI.Container, opts: TextInputOptions): TextInputHandle
```

---

### createVideoPlayer

PIXI-rendered video with playback controls.

```ts
interface PixiVideoPlayerOptions {
  url: string
  x?: number
  y?: number
  width: number
  height: number
  loop?: boolean
  muted?: boolean
  autoplay?: boolean
  showControls?: boolean
  hidePlayButton?: boolean
  onLoad?: () => void
  onError?: (e: Error) => void
  onEnded?: () => void
}

interface PixiVideoPlayerHandle {
  readonly stage: PIXI.Container
  play(): void
  pause(): void
  seek(time: number): void
  setControlsVisible(v: boolean): void
  destroy(): void
  readonly destroyed: boolean
}

function createVideoPlayer(parent: SubCanvas, opts: PixiVideoPlayerOptions): PixiVideoPlayerHandle
```

---

### Avd — Visual Novel Engine

Script-driven dialogue system with typewriter text, character portraits, fade transitions.

```ts
interface AvdOptions {
  boxWidth?: number
  boxHeight?: number
  boxX?: number
  boxY?: number
  bgColor?: number
  bgAlpha?: number
  speakerColor?: number
  textColor?: number
  fontSize?: number
  fontFamily?: string
  portraitLeftX?: number
  portraitRightX?: number
  portraitWidth?: number
  portraitHeight?: number
  fadeDuration?: number
  typewriterSpeed?: number
}

interface AvdState { speaker: string; text: string; portrait?: Texture; portraitPos?: 'left' | 'right' }

class Avd {
  constructor(stage: Container, screenW: number, screenH: number, ticker: Ticker, opts?: AvdOptions)
  setScript(script: AvdState[]): void
  next(): void
  goTo(index: number): void
  setTypewriterSpeed(speed: number): void
  getState(): 'typing' | 'between' | 'done'
  destroy(): void
}

// Parse from JSON
function parseAvdScriptJSON(json: string, resolveTexture: (name: string) => Texture | undefined): AvdState[]
```

---

### AvdController — `src/avd/`

Refactored visual novel engine with separated concerns.

```ts
import { AvdController, parseScript } from '../avd';

interface AvdOptions {
  screenW: number;                       // viewport width
  screenH: number;                       // viewport height
  boxWidth?: number;                     // dialogue box width
  boxHeight?: number;                    // dialogue box height
  boxX?: number;                         // dialogue box X
  boxY?: number;                         // dialogue box Y
  boxBg?: number;                        // background color
  boxBgAlpha?: number;                   // background alpha
  boxRadius?: number;                    // corner radius
  boxPadding?: number;                   // inner padding
  textColor?: number;                    // text color
  textSize?: number;                     // text font size
  fontFamily?: string;                   // font
  typewriterSpeed?: number;              // chars/sec (default 30)
  textFadeMs?: number;                   // fade in duration (default 200)
  nameColor?: number;                    // speaker name color
  nameSize?: number;                     // speaker name font size
  portraitMaxH?: number;                 // max portrait height
  portraitY?: number;                    // portrait Y position
  portraitFadeMs?: number;               // portrait fade duration (default 300)
  arrowColor?: number;                   // "next" arrow color
  boxEnterMs?: number;                   // box slide-in duration (default 400)
  boxEnterOffsetY?: number;              // box slide-in offset (default 80)
  onLineEnter?: (line: AvdLine, index: number) => void
  onLineExit?: (line: AvdLine, index: number) => void
  onComplete?: () => void
  onStateChange?: (state: AvdState) => void
}

interface AvdLine {
  speaker?: string
  text: string | AvdTextSegment[]
  portrait?: Texture | null
  portraitPos?: 'left' | 'center' | 'right' | null
}

type AvdTextSegment =
  | { kind: 'text'; text: string }
  | { kind: 'image'; texture: Texture; width?: number; height?: number }

type AvdState = 'typing' | 'between' | 'done'

class AvdController {
  constructor(parent: Container, ticker: Ticker, options: AvdOptions)
  setScript(lines: AvdLine[]): void
  next(): void
  applyOptions(partial: Partial<AvdOptions>): void
  setTypewriterSpeed(charsPerSec: number): void
  setRoster(roster: AvdRoster): void
  setRosterMode(mode: 'speaker-only' | 'persistent'): void
  getRoster(): AvdRoster
  getRosterMode(): 'speaker-only' | 'persistent'
  getState(): AvdState
  getLineIndex(): number
  getLineCount(): number
  destroy(): void
}
```

#### Supporting modules

```ts
// Pure FSM — no PIXI dependency
class DialogueStateMachine {
  constructor(callbacks: StateMachineCallbacks)
  setScript(lineCount: number): void
  advance(): void
  goTo(index: number): void
  reset(): void
  get state(): AvdState
  get lineIndex(): number
  get isComplete(): boolean
}

// Per-frame character reveal (uses framework/text-effects-layout)
class TypingEngine {
  start(text: AvdText, speed: number, style: TextStyle, maxWidth: number, lineHeight: number): Container
  update(deltaMS: number): void
  complete(): void
  destroy(): void
  get active(): boolean
  get progress(): number
  get container(): Container | null
}

// Roster data + highlight rules
class RosterManager {
  setRoster(roster: AvdRoster): void
  setMode(mode: AvdRosterMode): void
  setSpeaker(speaker: string | null): void
  getPortraitForSpeaker(speaker, linePortrait, linePortraitPos): { pos, texture }
  getActivePortraits(): ActivePortrait[]
}

// JSON script parser
async function parseScript(json: AvdScriptJSON, resolver: AvdAssetResolver): Promise<AvdParsedScript>
```

---



### createLoading

```ts
interface LoadingOptions {
  text?: string
  spinnerColor?: number
  showSpinner?: boolean
  overlayColor?: number
  overlayAlpha?: number
}

function createLoading(parent: SubCanvas, opts?: LoadingOptions): LoadingHandle
function showLoading(parent: SubCanvas, opts?: LoadingOptions | string): () => void
```

---

### PerfDisplay

On-screen FPS/frametime/object count HUD.

```ts
interface PerfDisplayOptions {
  x?: number
  y?: number
  fontSize?: number
  color?: number
}

class PerfDisplay {
  constructor(ticker: Ticker, getStage: () => Container, opts?: PerfDisplayOptions)
  enable(): void
  disable(): void
  toggle(): void
  destroy(): void
  readonly destroyed: boolean
}
```

---

## Event Bus Protocol

The bus carries these known events:

| Event | Payload | Emitter | Consumer |
|-------|---------|---------|----------|
| `'fullscreen:show'` | `FullscreenShowEvent` | ClickableImage | FullscreenManager |

Add new events here as the system grows. Event names use colon namespace (`domain:action`).
