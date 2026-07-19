# Learning Notes — Patterns from External Repos

Continuously updated. Every time we clone and analyze a repo, add patterns here.

---

## pixi-viewport (pixijs-userland/pixi-viewport, 1216★)

### Plugin System Architecture

**File structure**: `src/PluginManager.ts` + `src/plugins/*.ts`

Each plugin extends a base class with lifecycle hooks:

| Hook | When | Return |
|------|------|--------|
| `down(event)` | pointerdown | `true` to stop propagation |
| `move(event)` | pointermove | `true` to stop propagation |
| `up(event)` | pointerup | `true` to stop propagation |
| `wheel(event)` | wheel | `true` to stop propagation |
| `update(elapsed)` | every frame | void |
| `resize()` | viewport resize | void |
| `reset()` | manual move (`moveCenter`, setter) | void |
| `pause()` / `resume()` | toggle paused | void |
| `destroy()` | plugin removed | void |

**Execution order is hardcoded** (`PLUGIN_ORDER`):
```
drag → pinch → wheel → follow → mouse-edges → decelerate → animate → bounce → snap-zoom → clamp-zoom → snap → clamp
```
Input plugins first → physics → constraints last. Sorted after every add/remove.

**PluginManager** stores plugins in a `Record<string, Plugin>` map and a sorted `Plugin[]` list. `update()` iterates sorted list. Event handlers (`down/move/up/wheel`) iterate sorted list, stop on first `true`.

**Key insight**: Plugins directly mutate `this.parent.x`, `this.parent.y`, `this.parent.scale.x/y`. No indirection, no event bus for transforms. Event bus only for plugin↔plugin communication.

**Adopted in**: `InfiniteCanvasPlugin` interface + `addPlugin`/`removePlugin` + priority-sorted execution.

### Decelerate (Inertia)

**Velocity estimation**: During drag `move()`, record `{x, y, time}` snapshots into a `saved` array (max 60, prune old). On `up()`, look back 100ms to find the last relevant snapshot. Compute:
```
velocity = (finalPosition - pastPosition) / timeDelta
```

**Frame-rate independent decay**: Using integrated exponential decay formula:
```ts
factor = Math.pow(friction, elapsed / 16)  // 16ms = 1 frame at 60fps
velocityX *= factor
velocityY *= factor
positionX += velocityX * (elapsed / 16)
```

This prevents jank on variable frame rates. Stops when `|velocity| < minSpeed`.

**Bounce interaction**: Bounce plugin can increase Decelerate's friction when out of bounds (sticky edge feel).

**Adopted in**: `DeceleratePlugin` in InfiniteCanvas.ts.

### Zoom-to-Pointer

Critical pattern for keeping the world point under the cursor stationary during zoom:

```
// Before scaling, save world point under cursor:
oldPoint = parent.toLocal(screenPoint)

// Apply scale change:
parent.scale.x *= change

// After scaling, convert oldPoint back to screen space:
// Convert screenPoint to oldPoint's parent space, then back:
targetParent.toLocal(oldPoint, parent, oldPoint)
comparePoint = targetParent.toLocal(screenPoint)
parent.x += comparePoint.x - oldPoint.x
parent.y += comparePoint.y - oldPoint.y
```

Used identically in both `Wheel.ts` and `Pinch.ts`.

**Adopted in**: InfiniteCanvas.setZoom().

Simplified for our coord system (no PIXI toLocal calls — we own the transform):
```
// Save world point under zoom center:
worldPoint = screenToWorld(cx, cy)  // = (cx - worldX) / zoom

// Apply scale change:
zoom *= factor
worldContainer.scale.set(zoom)

// Adjust worldX/Y so worldPoint stays under (cx, cy):
worldX = cx - worldPoint.x * zoom
worldY = cy - worldPoint.y * zoom
```

### Smooth Wheel Zoom

Distribute zoom change over N frames instead of jumping:
```
smoothing.x = ((scale.x + remaining) * change - scale.x) / smooth
```
In `update()`, apply `scale.x += smoothing.x` each frame until count reaches `smooth`.

### Coordinate System Duality

Viewport tracks both screen-space and world-space. Conversion formulas:
```
left = -x / scale.x
right = left + screenWidth / scale.x
top = -y / scale.y
bottom = top + screenHeight / scale.y
```

### Underflow Handling

When world is smaller than screen, control positioning via `underflowX`/`underflowY`:
- `-1` = left/top
- `0` = center
- `1` = right/bottom

### Event-Driven Plugin Coordination

Plugins communicate through viewport events (not direct refs):
- Decelerate listens to `'moved'` to record position history
- Bounce checks decelerate state
- Clamp reads decelerate velocity to zero it

### forceHitArea

Dynamically update hitArea each frame to match visible world bounds. For infinite canvas, use a fixed large area instead.

---

## learningPixi (kittykatattack/learningPixi, 4419★)

### Function-Reference State Machine

```js
let state = play;

function gameLoop(delta) {
  state(delta);  // dispatch to current state function
}

function play(delta) {
  // gameplay logic
}
state = end;  // switch state
```

Lightweight, no dependencies. Swap states by simple assignment.

### Scene Container with Visibility Toggle

```js
gameScene = new Container();
gameOverScene = new Container();
app.stage.addChild(gameScene);
app.stage.addChild(gameOverScene);
gameOverScene.visible = false;  // toggle scenes

// Later:
gameScene.visible = false;
gameOverScene.visible = true;
```

Relevant to: SubCanvas-based screen management.

### Input as Factory + Strategy

```js
function keyboard(keyCode) {
  const key = { isDown: false, isUp: true, press: () => {}, release: () => {} };
  // ... event listeners set key.isDown, call key.press/release
  return key;
}

// Usage:
const left = keyboard(37);
left.press = () => { cat.vx = -5; };
left.release = () => { cat.vx = 0; };
```

Clean separation of input capture from game logic.

### Pure Utility Functions

```js
function hitTestRectangle(a, b) { /* AABB overlap */ }
function contain(sprite, container) { /* clamp + return side string */ }
function randomInt(min, max) { /* range random */ }
```

No side effects, no dependencies. Directly applicable pattern already adopted in `framework/utils/`.

### Container with Custom Properties

```js
healthBar = new Container();
healthBar.outer = outerBar;  // custom reference for fast access
```

Simple composition pattern — no need for complex OOP.

### Texture Atlas Alias

```js
const id = resources["atlas.json"].textures;
const sprite = new Sprite(id["explorer.png"]);
```

Concise alias pattern worth canonizing in an asset manager.

---

## Greensock GSAP (greensock/GSAP, 26727★)

### GSAP + PixiPlugin

```ts
import gsap from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
gsap.registerPlugin(PixiPlugin);

// Animate PIXI display object:
gsap.to(sprite, {
  pixi: { alpha: 0, x: 100, scale: 1.5 },
  duration: 0.3,
  ease: 'power2.out',
});
```

### GSAP Ticker Integration

By default GSAP uses requestAnimationFrame. For PIXI integration:
```ts
gsap.ticker.lagSmoothing(0);  // disable lag smoothing
```
GSAP's ticker and PIXI's ticker both run on rAF — they coexist. No special sync needed for basic usage.

### Key GSAP Concepts for PIXI UI

| Concept | Usage |
|---------|-------|
| `gsap.to(target, vars)` | Animate from current state |
| `gsap.from(target, vars)` | Animate from specified state to current |
| `gsap.fromTo(target, fromVars, toVars)` | Full control |
| `gsap.timeline()` | Sequence multiple tweens |
| `ease: 'power2.out'` | Common UI ease |
| `onComplete` | Callback when tween finishes |
| `{ pixi: { ... } }` | PixiPlugin special properties |

---

### GSAP Integration Patterns (Applied Jul 2026)

#### Pattern: Replace Ticker Lerp → GSAP Tween

**Before** (FullscreenManager.ts):
```ts
const tick = (ticker) => {
  const f = Math.min(LERP * ticker.deltaTime, 1);
  sprite.x += (targetX - sprite.x) * f;
  sprite.y += (targetY - sprite.y) * f;
};
proxy.ticker.add(tick);
```

**After**:
```ts
gsap.to(sprite, {
  pixi: { x: targetX, y: targetY, scale: targetScale },
  duration: 0.3,
  ease: 'power2.out',
  onComplete: () => { /* cleanup */ },
});
```

**Key decisions**:
- Use `gsap.to(sprite, { pixi: { x, y, scale } })` for PIXI objects (PixiPlugin)
- Use `gsap.to({ t: 0 }, { t: 1, onUpdate })` for Graphics redraw (spinner, ripple)
- Track active tween with `let currentTween: gsap.core.Tween | null`, call `currentTween.kill()` before starting new
- `gsap.killTweensOf(target)` on destroy to prevent orphan animations
- `overwrite: 'auto'` for multiple tweens on same target (PortraitLayer slot sprites)

#### Pattern: Remove `update(now)` Coupling

**Before**: `AvdPortraitLayer` had `update(now)` called every frame from `Avd._tick`, manually lerping alpha.

**After**: Each slot fade is an independent GSAP tween. No per-frame update needed. `Avd._tick` is simplified.

#### Pattern: Animation State Simplification

Removed `animating`, `onAnimDone`, `boxEnterActive`, `textFading` booleans and their associated timers. GSAP manages completion via `onComplete` callback. Less state = fewer bugs.

#### What Stayed as Ticker (not GSAP)

| Concern | Reason |
|---------|--------|
| DeceleratePlugin | Physics simulation, indefinite duration |
| Typewriter reveal | Character-by-character logic, not visual animation |
| Arrow bob | Phase accumulation + Graphics redraw |
| CA step timers | Logic timing, not visual animation |

---

## Component Registry Pattern

Unify all `create*` / `make*` factory functions under a single `registerComponent(name, factory)` → `createComponent(name, opts)` API.

### Architecture

```
framework/component.ts    — base types + registry Map<string, Factory>
framework/register-components.ts — side-effect module that registers adapters
framework/index.ts        — imports register-components.ts to trigger registration
components/index.ts       — barrel, re-exports original factories + types
```

### Adapter Pattern

Each adapter wraps an existing factory function to conform to `Component<T>` interface:

```ts
registerComponent<WindowComponentOptions>('window', (opts) => {
  const win = createWindow({ /* map opts */ });
  return {
    type: 'window',
    stage: win.stage,
    destroy: () => win.destroy(),
    get destroyed() { return win.destroyed; },
  };
});
```

---



---

## TextInput — Canvas Text Input with DOM Overlay (Jul 2026)

### Problem

之前的 `TextInput` 在 focus 时创建一个隐藏的 `<input>`，用 `container.getBounds() * dpr + canvasRect` 定位。在 `autoDensity: true` + DPR > 1 时坐标翻倍偏移，输入框出现在屏幕外，无法 input。

### Solution: Always-visible DOM Overlay + PIXI Dual Path

```ts
// 1. PIXI container 负责 "静止态" 视觉 + 事件兜底
container.eventMode = 'static';
container.hitArea = new PIXI.Rectangle(0, 0, width, height);

// 2. DOM overlay 始终定位在 PIXI 容器上方，始终可点击
overlay.style.pointerEvents = 'auto';  // 即使 opacity: 0 也拦截点击
requestAnimationFrame(() => reposition());

// 3. GSAP 控制 focus/blur 透明度过渡
// focus:  overlay 淡入 (0→1) + borderColor 过渡
// blur:   overlay 淡出 (1→0)，但保持 pointer-events: auto
```

### Positioning Fix

不能用 `dpr` 缩放坐标。`autoDensity: true` 时 `getBounds()` 已经返回 CSS 像素值：
```ts
// ❌ 错误
input.style.left = (rect.x * dpr + canvasRect.left) + 'px';

// ✅ 正确
overlay.style.left = (cr.left + bounds.x) + 'px';
```

### PixiJS v8 Event Mode Requirement

Container 默认 `eventMode = 'passive'`，不会接收事件。需要显式设置 `'static'` + `hitArea`：
```ts
container.eventMode = 'static';
container.hitArea = new PIXI.Rectangle(0, 0, width, height);
```

否则点击永远不会触发 `pointerdown`。

### Dual Click Path

两层点击拦截，保证在任何场景下都能 focus：
1. **DOM overlay `pointerdown`** — 覆盖在 PIXI 容器上方，即使透明也拦截点击
2. **PIXI container `pointerdown`** — 当 SubCanvas 事件路由不影响 PIXI 事件系统时生效

---

## PerfDisplay — On-Screen Performance HUD (Jul 2026)

### API Design

```ts
// 通过 proxy 控制（推荐）
proxy.showPerfMeasure(true);   // 显示
proxy.showPerfMeasure(false);  // 隐藏

// 独立使用
const perf = new PerfDisplay(ticker, () => stage, { x, y, fontSize, color });
perf.enable();
```

### Metrics

| 指标 | 实现 |
|------|------|
| FPS | 60 帧滚动平均，`1000 / avgFrameTime` |
| Frame time | `ticker.deltaMS` 的 60 帧平均 |
| Object count | 递归遍历 `stage.children`，含 RenderGroup |
| Resolution | `stage.width × stage.height` |

### Integration

`startPixiApp` 自动创建 `PerfDisplay`，传入 `SubCanvasProxy` 的 `perfDisplay` 属性。`showPerfMeasure()` 调用 `PerfDisplay.enable/disable` 控制添加到 `app.stage`。

---

## makeInfoPanel — Floating Info Panel Placement (Jul 2026)

### Problem

`makeInfoPanel` 默认位置 `(14, 14)` 且 `zIndex: 2147483647`，覆盖了其他 UI 控件（如 ComponentDrawingDisplay 的工具面板、ComponentWavesDisplay 的控件区）。

### Rule of Thumb

放置信息面板时：
- **左侧有工具面板** → 放底部 `y: window.innerHeight - 120`
- **全屏画布** → 放右上角或右下角
- 明确传入 `x`、`y` 参数，不要依赖默认值

---

## makeStepper — Live Parameter Control Pattern (Jul 2026)

为 `ComponentWavesDisplay` 添加了三个 `makeStepper` 控件（amplitude / speed / frequency），演示了如何将硬编码常量变为运行时可调的实时参数：

```ts
let amplitude = 30;
const ampStepper = makeStepper('amplitude', () => amplitude, (v) => { amplitude = v; }, 5, 80);
```

波形计算中直接引用变量（非常量），GSAP ticker 每帧读取最新值。

---

---

## SubCanvas clipToBounds mask 坐标

PixiJS v8 中 `container.mask = graphics` 时：

1. **mask 必须是 container 的孩子**，否则不继承 container 的 transform，stencil 位置和内容对不上。PixiJS v8 的 StencilMaskPipe 会自动设置 `mask.includeInBuild = false`，mask 不渲染到 color buffer。
2. **mask 局部坐标必须在 `(0, 0)`**。如果 mask 已经作为孩子继承了 container 的 position 变换，再设 `mask.x = bounds.x` 会导致 stencil 在世界空间双重偏移。
3. 修正：`this._mask` 为 `this.stage` 的孩子，`rect(0, 0, w, h)` 不设 `x/y`。

---

## PixiWindow / PixiConfirm 不设 clipToBounds

窗口的 content 子区域已有自己的 `clipToBounds: true`，窗口本身不需要。窗口的 `dragBounds` 已经将位置钳在父级边界内，不会溢出。

---

## Future Topics (to investigate)

- [ ] **pixi-viewport ClampPlugin** — bounding box constraints that interact with decelerate
- [ ] **pixi-viewport SnapPlugin** — snap-to-grid after drag
- [ ] **Three.js + PIXI hybrid rendering** — 3D background with 2D UI overlay
- [ ] **PIXI v8 Mesh** — custom geometry for image distortion effects
- [ ] **WebGPU renderer** — how `preference: 'webgpu'` changes the rendering pipeline
- [ ] **CocosCreator / Unity UI patterns** — anchor-based layout system for PIXI
