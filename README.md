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
- **`showLoading` 的 cleanup 必须幂等**：原 cleanup 没 `if (overlay.parent)` 守卫，二次调用（React strict mode / 用户双击）触发 `removeChild on non-parent` PIXI 内部 crash。**修法**：(1) `if (removed) return;` 早出；(2) `if (overlay.parent) overlay.parent.removeChild(overlay);` 守卫。
- **PixiConfirm/PixiWindow 的 setTitle/setMessage/setImage 必须守卫 `win.destroyed`**：dialog 销毁后外部仍持有 `win` 引用（`keepOpen: true` / async await 后用户调 setMessage），访问 `titleText.text = ...` 会触发 PIXI 内部对已 destroy DisplayObject 的 `eventMode` 读写 → undefined error。**修法**：每个 setter 首行 `if (win.destroyed) return;`。
- **Scrollable/ClickableImage 的 mask 和 hitArea 不随 resize 自动更新**：因为它们是独立的 PIXI.Container，不是 SubCanvas。resize 后要手动重建或调用 recalc()。

### 视频播放 (PixiVideoPlayer)
- **Chrome 对极小/隐藏 video 元素降帧解码**：`width:1px; height:1px; opacity:0` 风格的 off-screen 视频，Chrome 视为"不可见"，解码 FPS 暴跌 → 画面卡顿。**修法**：off-screen 定位（`left:-9999px`）+ 合理尺寸（用播放器实际 width/height，不是 1px），Chrome 看到的是一个"真实尺寸"的元素，正常解码。**症状**：能放但是很卡，FPS 远低于视频源帧率。
- **`updateFPS: 30` 在 60Hz 屏上引起抖动**：VideoSource 的 `updateFPS` 限定每 N 帧采一次视频帧入纹理；60Hz 屏渲染时，固定 30Hz 采样和 60Hz 渲染不同步 → 帧间隔不均匀。**修法**：`updateFPS: 0`（每 tick 检查新帧，跟渲染同频）。
- **VideoSource 纹理在 video pause 时不更新帧**：`autoplay=false` 时纹理始终显示创建时的空帧，**黑屏直到用户按 play**。**修法**：创建 VideoSource 后短暂 play/pause/seekt0 primer：临时把 `muted` 设 true 绕过 autoplay policy，`play().then(() => { pause(); currentTime = 0; muted = 原始值 })`，捕获首帧入纹理。`destroyed` 守卫防竞态。
- **VideoSource.destroy() 必须在 DOM removeChild 之前调用**：VideoSource 内部 `addEventListener` 绑在 video 上（`play/pause/seeked/error` 等）。`destroy()` 时内部 `removeEventListener` 摘掉，并 `pause() + src="" + load()` 杀解码管线。**顺序错了**会导致 video 抛出的 event 触达 PIXI 已 null 的内部对象。**修法**：destroy 顺序 — 摘自家监听 → `videoTexture.destroy(true)`（**原子**销毁 texture+source，cascade）→ `removeAttribute('src') + load()` → DOM removeChild → `URL.revokeObjectURL` → `root.destroy({ children: true })`。
- **destroy 中 texture 和 source 必须原子销毁**（critical，导航离开播放中视频崩溃）：原顺序 `videoSource.destroy()` → ... → `videoTexture.destroy(true)` 中间存在窗口：source 已被 PIXI 置 null（`_resourceBounds`/`_sourceRect` 等内部状态被 null 化），texture 仍引用它。PIXI renderer 下一帧调 `texture.source.update()`（minified `Ce`）→ 读 `null.x` → `TypeError: Cannot read properties of null (reading 'x') at HTMLVideoElement.Ce`。**修法**：(1) `videoTexture.destroy(true)` 一次性 cascade 销毁（PIXI v8 `Texture.destroy(true)` 调 `source.destroy()`），不留窗口；(2) 销毁后 `videoSource = null; videoTexture = null;` 断引用；(3) `destroy()` 首行 `htmlVideo.pause()` 阻止 video 继续抛事件。
- **sprite.scale 必须在 `loadedmetadata` 之后设**：`canplay` 触发时 `htmlVideo.videoWidth/videoHeight` 通常已可用（`initVideoSource` 内调 `adjustSpriteScale` 加了 `vw > 0 && vh > 0` 守卫），但 `loadedmetadata` 才是 100% 可靠的时机。**修法**：双保险 — `initVideoSource` 里和 `onLoadedMeta` 里都调 `adjustSpriteScale()`。
- **`<video>` 必须挂到 DOM**：Chrome/Safari 不在 DOM 中的 video 不解帧（"省电"行为）。**修法**：`document.body.appendChild(htmlVideo)` + off-screen 定位。详见上条 1px 尺寸陷阱。
- **空 src 时建 VideoSource 触发 Firefox error 事件**：PixiJS 官方 `loadVideoTextures` 流程：先设 src → 等 `canplay` → 再建 VideoSource。反过来（空 src 建 VideoSource）Firefox 会触发 error 事件导致 PIXI listener 被移除。**修法**：先 addEventListener('canplay') / 检查 readyState，再 set src / load()。
- **`MEDIA_ERR_SRC_NOT_SUPPORTED` / `MEDIA_ERR_NETWORK` → fetch blob fallback**：部分 CDN 不支持 Range/streaming 或 CORS 配置错误时，native video element 直接抛 SRC_NOT_SUPPORTED。`PIXI.Assets.load()` 错误粒度只到 `ErrorEvent`，`MediaError.code` 不可读。**修法**：手动 `<video>` + `VideoSource`（不是 Assets.load），监听 `error` 事件读 `htmlVideo.error?.code`，是 SRC_NOT_SUPPORTED / NETWORK 就 `fetch(url) → URL.createObjectURL(blob) → 替换 src → load/play`。
- **HUD/debug 面板必须用 PIXI 而非 React DOM**：React DOM 跟 PIXI canvas 走不同的合成器层，事件路由/z-order 都不互通。在 PIXI canvas 上盖 React DOM 元素会破坏子画布 AABB 事件路由。**修法**：HUD 做成独立 SubCanvas region + Scrollable + PIXI.Text（见 `component-video-player` 例子的右上角 debug log）。
- **`PIXI.VideoSource` v8 API**：`new PIXI.VideoSource({ resource, autoPlay, updateFPS })`，`resource` 是 `<video>` 元素（不是 URL）。Texture 单独建：`new PIXI.Texture({ source: videoSource })`。`updateFPS: 0` = 每 tick 同步（最平滑）。`videoSource.destroy()` 必须自己调，PIXI 不会 GC。
- **canplay 监听器在 destroy 时漏移除 → 幽灵内存泄漏（critical）**：组件挂载后视频还在加载（canplay 未触发），用户切走触发 destroy()。`videoSource` 仍是 null，`videoSource?.destroy()` 的 src="" 内部清理不会执行。destroy() 摘了其它监听，**唯独漏了 canplay**。结果：`<video>` 离 DOM 后还在后台拉流，下载完成触发 canplay → 调 `initVideoSource` → 在已销毁组件上重新创建 PIXI.VideoSource / Texture → 严重的幽灵内存泄漏。**修法**：(1) `initVideoSource` 首行 `if (destroyed || videoReady) return;` 防御；(2) `destroy()` 显式 `removeEventListener('canplay', initVideoSource)`；(3) `videoSource?.destroy()` 之后兜底 `htmlVideo.removeAttribute('src'); htmlVideo.load();` 截断后台下载。
- **Prime 与用户真实播放的竞态条件**：Prime 逻辑是 `play().then(() => pause() + currentTime=0)`，这个 Promise resolve 属微任务。如果用户手速快，在 Prime 启动后立刻点了真实播放按钮（或者外部调 `handle.play()`），真实的 `htmlVideo.play()` 触发；之后 Prime 的 then 触发 → 无差别强制 pause 并把进度拽回 0 → **视频播了零点几秒后硬生生卡回 0**。**修法**：引入 `userPlayRequested` 标志，`doPlayAction` / `handle.play` / `handle.toggle` 主动播放时设 true；Prime.then 开头 `if (userPlayRequested) return;` 跳过强制 pause/seek。
- **readyState 提前校验是死代码**：原代码先 `if (htmlVideo.readyState >= HAVE_FUTURE_DATA)` 再 `set src / load()`，但 `createElement('video')` 出来的元素 `readyState=0` 永远为 0，上面的 if 永远 false。**修法**：**先注册 canplay listener**（防同步 canplay 漏事件）→ **`set src / load()`** → **最后再 `readyState` 检查**（针对浏览器缓存命中，canplay 不会再触发的极端情况）。
- **Fetch fallback 硬编码 `video/mp4` MIME**：原 `new Blob([rawBlob], { type: 'video/mp4' })` 把 WebM/MOV 视频也封成 mp4，Chromium 头部解析失败 → 又抛 `MEDIA_ERR_SRC_NOT_SUPPORTED`。**修法**：动态继承 `resp.headers.get('content-type') || 'video/mp4'`。
- **Autoplay 策略阻截导致 UI 状态假死**：`autoplay=true` + `muted=false` 时现代浏览器必定拦截 `play()`，reject。但视频没播 → `pause` 事件不触发 → `onPause` 不执行 → UI 永远显示"正在播放"（暂停图标隐藏、大播放按钮隐藏），但画面不动。**修法**：(1) UI 初始化一律 `drawPlayIcon(false); cpb.visible = true;` 强制暂停态；(2) `VideoSource` 的 `autoPlay: false`，自己控；(3) `if (autoplay) { userPlayRequested = true; htmlVideo.play().catch(dbg) }` 自己调，失败时 UI 保持暂停态等待用户点击。
- **React Strict Mode 二次挂载触发 Chromium 媒体 Cache Lock 死锁**（critical，dev 模式重复进入视频不显示 / 真路由切换 + 返回第二次播放黑屏）：Strict Mode `Mount → Unmount → Mount` 同步序列中（或路由切换 + 返回触发的真实二次挂载），cleanup 调 `player.destroy()` → 内部 `htmlVideo.removeAttribute('src') + load()`（**以及** `videoTexture.destroy(true)` cascade 到 PIXI `VideoSource.destroy()` 内部的 `source.src = "" + source.load()`）→ 同步向浏览器网络栈发 Abort 信号截断第一道媒体流。几乎同时 Mount 2 发起对**同一 URL** 的新请求。Chromium 网络缓存因上次 Abort 产生竞态闭塞，第二道请求永远 Pending，`readyState=0`，`canplay` 不触发，`initVideoSource` 不跑，`videoTexture` 没建，画面死寂。**修法**（v4，完全不 Abort + 全部同步）：`destroy()` 同步执行 8 步——(1) `pause()`；(2) `removeEventListener × 7`；(3) `clearTimeout(hideTimer) + removeEventListener('pointermove/up') × 2`；(4) 手动 `cancelVideoFrameCallback(oldSource._videoFrameRequestCallbackHandle)` 断 rVFC 循环（private 字段，runtime 访问 `as unknown as { _videoFrameRequestCallbackHandle?: number | null }`）；(5) `parentNode.removeChild(oldVideo)` 摘 DOM；(6) `URL.revokeObjectURL(oldUrl)`；(7) `root.parent.removeChild(root) + root.destroy({ children: true })` 摘 scene graph；(8) `oldTexture.destroy(false)`。**关键**：(a) PIXI v8 `VideoSource.destroy()` 内部 `source.src = ""; source.load()` 是 Abort 源头，**必须**用 `destroy(false)` 跳过 cascade；(b) 上述 4/5/6/7/8 步**不**触发 Abort（cancelVideoFrameCallback 是方法调用、removeChild 走 GC 路径、revokeObjectURL 只释放内存、destroy(false) 不 cascade），所以全部可以同步执行，不需要 `setTimeout(0)`；(c) 同步执行保证 cleanup 在 destroy() 返回前完成，下一次 mount 启动时旧资源已全部释放，无跨挂载竞态。old htmlVideo 脱离 DOM 后被 GC，浏览器自动取消网络请求，无 Abort 信号 → 无 Cache Lock。source 变 orphan，listener 闭包随 htmlVideo 一起 GC，无泄漏。**反面教材**：裸 `PIXI.Texture.from(video) + app.destroy(true, {texture: true})` 在 Strict Mode 下必坏——见 `src/example/component-cutscene-minimal/` 注释为什么必须用 `createVideoPlayer`。
- **同步 `seek(0) + play()` 触发 phantom ended 事件**（critical，cutscene 黑屏直接根因）：如果视频由于之前的播放或 primer `play(); pause();` 停留在了 sticky ended 状态，同步调用 `htmlVideo.currentTime = 0; htmlVideo.play()` 会导致浏览器在异步 `seeked` 清完 ended flag 前，**基于过期的 ended 内部状态派发一个幽灵 ended 事件**。`htmlVideo.currentTime` 是同步更新没错，但底层 media engine 重置 ended 标记是异步的；`play()` 立即调度时浏览器仍认为视频 ended → 立即派发 phantom ended → 用户 `onEnded` 回调 fire → cutscene 提前进入 fading-out → 300ms 后 `backToIdle` → 画面黑。**症状**：cutscene 一开始就黑屏 / 视频播了 0.1s 立刻进 fade-out / 状态机直接跳到 `idle`。**修法**（v2，三处协同）：(1) `onEndedEvt` 内 `if (duration > 0 && htmlVideo.currentTime < duration - 0.5) { dbg('ignored phantom ended event at currentTime=...'); return; }` —— **必须**读 `htmlVideo.currentTime` 而非闭包 `curTime`，因为此时 `seeked` 事件尚未触发，`curTime` 是旧值（用户看 `player.currentTime` 仍 = duration，误以为"真播完了"）。(2) `seek(t)` 内部乐观更新 `curTime = t`，让外部 `player.currentTime` 即刻准确（用户代码可以信任 `currentTime` 做决策）。(3) 调用方在 `onEnded` 回调里可加同样的 `currentTime < duration - 0.5` 二次防御（示例见 `ComponentCutsceneDisplay.onVideoEnded`）。**阈值 `0.5` 的意义**：HTML5 视频 ended 事件触发时 `currentTime` 通常恰好 = `duration`（有 fp 误差），容差 0.5s 兼容 rounding；正常播完的 ended `currentTime === duration`，会通过阈值；phantom 事件的 `currentTime` 仍是 seek 前的旧位置（duration 或其它），会被拦截。
- **过场动画 cutscene 模式设计模式**：`createVideoPlayer` 的 `root: PIXI.Container` 句柄 getter 让你能**直接对 player 的整个 sprite tree 做 alpha 动画**，不需要新建一个 `cutsceneLayer` 容器把 player 装进去再淡。直接用 `player.root.alpha` 做 fade-in/out 避免 z-order 脆弱性（player 自己 addChild 到 stage 时的位置 / `SubCanvas.stage.addChild` 顺序之争）。**两个 UI 隐藏选项**：`showControls: false`（底部控件条不显示）+ `hidePlayButton: true`（中心播放按钮不显示）。**关键陷阱**：即使 `cpb.visible = false`，**它的 hit-area 仍在 stage 事件层**——用户点屏幕想 skip 时，PIXI 把事件路由到 cpb 而不是上层的 skipLayer。**修法**：`createVideoPlayer` 内部对 cpb/ctrl 在 UI 隐藏时设 `eventMode = 'none'`，让事件穿透到 skipLayer 透明 hit-catcher。**16:9 fit-contain** 算法：`vw = W; vh = W*9/16; if (vh > H) { vh = H; vw = H*16/9 }` —— 视频永远完整可见，剩余区域黑底。**State machine 由 `SubCanvas.ticker` 驱动**：tickerFn 60fps 检查 `state`，按 `performance.now() - fadeStart` 算 alpha t；不要用 `setTimeout` 触发 fade（GC / 长任务会卡时间）。**完整示例**：`src/example/component-cutscene/`。**反面教材**：裸 `PIXI.Texture.from(videoElement)` + `app.destroy(true, {texture: true})` 在 Strict Mode 下会触发上面那条 Cache Lock 死锁——见 `src/example/component-cutscene-minimal/` 注释为什么必须用 `createVideoPlayer`。
- **视频在 primer 完成前被 render → lazy GPU texture alloc 竞态**（critical，**PIXI v8 视频黑屏真正根因**）：PIXI v8 的 `TextureSource` 是 lazy-alloc 的——`new PIXI.VideoSource({...})` 时 `_glTextures: []` 空数组，**GPU texture storage 不分配**，要等 sprite 第一次被 renderer render 时才走 `renderer.texture.initTexture(source)` → 调 WebGL `gl.copyTexSubImage2D` 之类的 API 分配。视频 primer 是 async 的（canplay → initVideoSource → play().then(pause+seek(0))），需要 100-500ms 完成。**关键洞察**：(1) primer 跑完前，**sprite 绝对不能被 render**，否则 renderer 试图 `glCopySubTextureCHROMIUM` 复制 video 帧到 unallocated 的 GL texture → `GL_INVALID_OPERATION: The destination level of the destination texture must be defined` 报 64+ 次/秒 → 错误状态下的 texture 永远不被填充 → sprite 黑。(2) **`mipLevelCount = 1` 修复（commit `400924a`）部分有效但不够**——setter 在 CPU 侧生效，log 确认，但 PIXI 内部 `_initSource` 读 mipLevelCount 是在 lazy alloc **过程中**，这时如果已经触发了一次失败的 copy，后续 alloc 也可能继承错误状态。**真正的修法**（commit `d505cc3`）：**在 `createVideoPlayer` 之后立刻 `player.root.visible = false`**，让 renderer 跳过这个 sprite → primer 在 sprite 隐藏期间跑完 → 用户 click 时设 `visible = true` → 第一次 render 时干净 alloc + copy，无 race。**cpb / start button 必须在 player 之外**（`root.stage` 直接 add），因为 `cpb` 是 `player.root` 的子节点，hide root 必 hide cpb。**cutscene 例子一直工作**就是遵循这个模式（line 176 `player.root.visible = false` + 外部 `buttonLayer`），但我没意识到这是关键。**`component-cutscene-minimal` 之前黑屏**就是漏了这一步。**反面教材**：在 PIXI 视频组件里把"start UI"放在 `player.root` 内部（cpb）然后依赖 autoplay=false 等用户点 cpb 的模式——**永远不工作**，因为 cpb 被 hide 的同时整个 player 也被 hide 了。**保持 `mipLevelCount = 1` 作为防御层**（commit `400924a`）——单独不够但配合 hide 是双保险。

### 部署 / 缓存
- **Cloudflare Pages 灰度 deploy**：HTML 立即更新，子 bundle（`assets/xxx-[hash].js`）还在旧 hash 状态。**症状**：页面报 `Failed to fetch dynamically imported module`。**修法**：等 1-2 分钟；不要 push 完立即 playwright 测。
- **SW cache 撞 stale**：SW 已 bump 到 `sim-v3`（commit `116c501`）。`networkFirst` for navigation + `cacheFirst` for assets；`skipWaiting` + `controllerchange` 强制刷新。**症状**：`index.html` 引用最新 `index-XXX.js` hash，但 SW 仍返回旧 `index-YYY.js` 资源。**修法**：硬刷新（Cmd/Ctrl+Shift+R）一次；如仍撞，DevTools → Application → Service Workers → Unregister 再 reload。

### React 桥接 PIXI
- **`useEffect([state])` 销毁/重建 PIXI app = 黑屏闪一下**（critical，**只允许 1 个 useEffect**）：本项目原则：example/component 文件里**只能有 1 个 useEffect**（用来挂载/卸载 PIXI app），**禁止**用第二个 `useEffect([rows, cols])` 之类响应游戏状态变化。**原因**：(1) 任何 `useEffect` 的 dep 数组里放状态变量 → 该变量变化时 React 先跑旧 effect cleanup（`destroyApp()` 销毁整个 canvas）→ 再跑新 effect body（`startPixiApp()` 重建 canvas）。两步之间 canvas 是空的，body 背景穿透 → **黑屏闪一下**。肉眼可见、对体验破坏大。(2) 状态变化应该走 PIXI 内部，React 只管 mount/unmount 一次。**修法**：(a) 游戏状态（rows/cols/score/board/tileNodes 等）放**模块级 `let state`** 或 `useRef`，**绝不放** `useState`。(b) 状态变更函数（setRows / setCols / tryMove / reset）也是**模块级函数**，直接 mutate state + 调 `buildBoard` 原地重画 PIXI scene，**完全绕过 React re-render**。(c) React 组件体只剩 `useEffect(() => { startPixiApp(...); return destroyApp; }, [])` + `return <></>`。**反面教材**（已废弃）：第一版用 `useState` + 两个 useEffect 调试一晚上还以为是布局公式问题；撤 useState 改 useRef 单 useEffect 还是没消掉黑屏；最后才意识到是 useEffect 重跑本身销毁了 canvas。**正确实现**：`src/example/component-2048/`。
- **整块屏幕只允许 canvas 出现**（critical UI 原则）：example/component 的 React 组件体 `return <></>` 即可，**不要**返回任何 React DOM 元素（div / button / input 等）。所有 UI（按钮、文本、滑块、菜单、对话框、debug log）必须在 PIXI canvas 里用 `PIXI.Text` / `PIXI.Graphics` / `PIXI.Container` 实现。**原因**：(1) React DOM 跟 PIXI canvas 走不同的合成器层，z-order / 事件路由 / hit-test 都不互通；(2) DOM 元素在 canvas 上会破坏 SubCanvas AABB 事件路由（canvas pointer 事件先过 SubCanvas AABB，再过 PIXI hit-test，DOM 元素在中间会拦截）；(3) PI canvas 是 `position: fixed; inset: 0` 全屏盖住，DOM 元素如果没 z-index 会被盖。**例外**：video 元素（必须有 DOM `<video>` tag 才能解帧）+ launcher home（路由入口，不是 example）。所有 example/component 文件遵循此原则。HUD/debug 面板也用 PIXI 区域（见 `component-video-player` 右上角）。

## 视频黑屏 — 全部尝试过的方案（**已解决**）

**状态**：✅ **截至 `d505cc3`，minimal test 和 cutscene 都工作**。**根因**：视频在 primer 完成前被 render → lazy GPU texture alloc 竞态。**修法**：`createVideoPlayer` 之后立刻 `player.root.visible = false` → primer 在 hide 期间跑完 → 用户 click 时设 `visible = true` → 第一次 render 时干净 alloc + copy。详见上方 gotcha #20。`mipLevelCount = 1`（commit `400924a`）保留作为防御层。

### 时间线（每个 commit 改了什么、修了什么观察、又暴露了什么）

| # | Commit | 尝试 | 观察 | 结论 |
|---|---|---|---|---|
| 1 | `3becdd3` | `texture.destroy(true)` cascade → PIXI 内部 `source.src = "" + source.load()` | 触发 `play() rejected: AbortError`；Strict Mode 二次挂载直接死锁 | cascade 路径有毒，弃 |
| 2 | `7e36972` | v1 推迟到 `setTimeout(0)` 试图绕过 Chromium Cache Lock | Abort 仍 fire（`setTimeout` 推迟不能阻止同步 Abort） | 推迟 ≠ 不触发 |
| 3 | `b142144` | `texture.destroy(false)` 跳过 cascade + `setTimeout(0)` 异步清理 rVFC / DOM / URL | 第一次进入能看，但**第二次**进入仍黑屏 | destroy 路径 OK，但 strict 模式二次挂载还有别的 race |
| 4 | `a626e47` | 把 v3 经验写进 README gotcha #17 | 文档化 | — |
| 5 | `09fee85` | 写 cutscene state machine（idle → fading-in → playing → fading-out） | 初始就黑屏 | UI 层没问题，texture 就有问题 |
| 6 | `e687a0c` | 用 `player.root.alpha` 直接 fade，不用单独 `cutsceneLayer` | 仍黑 | 跟 z-order 无关 |
| 7 | `5f8f0e2` | phantom ended 防护：`onEndedEvt` 读 `htmlVideo.currentTime < duration - 0.5` 拦截幽灵 ended | 修了「cutscene 0.1s 后立刻 fade out」症状 | 不是黑屏根因，是单独的 bug |
| 8 | `aeea8cf` | ticker 在 `onReady` async `.then` 内注册（之前在 mount 时同步检查 `root` 但 `app.init()` 是 promise） | alpha 不再 stuck 在 0 | 不是黑屏根因，是单独的 bug |
| 9 | `d017e92` | 写 `component-cutscene-minimal`：裸 `PIXI.Texture.from(video) + app.destroy(true, {texture: true})` 还原 strict mode 死锁 | **重现 Abort 错误** | 证实 destroy cascade 是死因之一 |
| 10 | `7c709b0` | minimal 改用 `createVideoPlayer` | 报同样的 GL 错误 | 跟 API 无关，是 PIXI/Chromium 层 |
| 11 | `93f5328` | 声音修：minimal 用 `autoplay: false + muted: false + showControls: true` + click-to-start 模式 | 跟黑屏无关，但需要 | — |
| 12 | `c683bba` | destroy 全同步（v4）：8 步全在 destroy() 内同步，不 setTimeout | 第一次进入 OK，**第二次**进入仍黑 | sync destroy OK，根因不在 destroy 路径 |
| 13 | `f06ef11` | 文档化 v4 | 文档化 | — |
| 14 | `05fff38` | 加 verbose `dbg()` 链路 + consumer `onDebug` plumb | 看清所有事件顺序：canplay → initVideoSource → onPlay → primer → onPause → GL 错误洪流 | GL 错误是**渲染时**的，不是 destroy 时的 |
| 15 | `116c501` | SW bump `sim-v2` → `sim-v3` 修 stale bundle | 部署对齐 | — |
| 16 | `400924a` | 修 PIXI v8 VideoSource `mipLevelCount` 默认 0 猜想：设 `mipLevelCount = 1` + `videoSource.update()` 强制首帧 | **GL 错误仍出现，黑屏仍在** | 猜想部分有效但**不够**——PIXI 在 lazy alloc 期间 setter 来得太晚 |
| 17 | `d7b9cca` | 文档化 #19 标 "hypothesized but fix did not work" | 文档化 | — |
| 18 | `d3cc1f5` | README 老实记录 17 个失败尝试 | 文档化 | — |
| 19 | `d505cc3` | **cutscene-minimal 加外部 start button + `player.root.visible = false`**：参照 `component-cutscene` 模式，primer 在 hide 期间跑完，click 时 visible=true。**根因解决。** | 待用户硬刷 + 浏览器确认 | — |

### 关键洞察（之前盲点）

- **cutscene 一直工作**，我没意识到原因 → `player.root.visible = false`（line 176）+ 外部 `buttonLayer`（line 158）
- **minimal 一直黑屏**，因为它依赖 cpb 作为 start UI，cpb 是 `player.root` 的子节点，hide root 必 hide cpb → 没法 hide
- **cutscene 模式下 start UI 在 player 之外**，所以可以独立 hide
- **`mipLevelCount = 1` 是必要但非充分条件**——配合 `visible = false` 才完整

### 实用工作模式（**PIXI 视频必须遵循**）

1. **永远不要让 video sprite 在 primer 完成前被 render**。`createVideoPlayer` 创建后立即 `player.root.visible = false`。
2. **Start UI 必须在 player 之外**（PIXI stage 直接 add，不通过 `player.root`），否则 hide player 同时 hide start UI。
3. **在 click handler 里**设 `player.root.visible = true` + `player.play()`，顺序无关（都同步）。
4. **`mipLevelCount = 1` 保留**（commit `400924a`）作为防御层——单独不够但配合 hide 是双保险。
5. **如果需要视频**显示 PIXI Filter / 与 scene 合成，必须走这个模式。**如果只是播视频**，直接用 `VideoPlayer.tsx`（commit `2f4a21d`）DOM wrapper。

### 调试日志基础设施（已就位）

`createVideoPlayer` 当前已 plumb `onDebug: (msg: string) => void` 到 consumer。cutscene 和 minimal test 都 `console.log` 全部 dbg 调用。遇到新症状时打开 console 即可看完整事件流。



### 事件架构 / 设计辩论
- **FullscreenManager 点击穿透 → bus 守卫方案替代 `stopPropagation`**：FM 的 overlay 在 PIXI 层叠最上层（`eventMode='static'`），足以拦截 PIXI FederatedEvent 传到下方 ClickableImage。但 SubCanvas AABB 路由走独立的 `window.addEventListener` 监听同一份原生 PointerEvent，PIXI 的 `e.originalEvent?.stopPropagation()` 不可靠 — PIXI v8 部分事件路径下 `originalEvent` 可能为 null。**结论**：FM 发射 `'fullscreen:active'` / `'fullscreen:inactive'` 总线事件，ClickableImage 订阅并设置 `fullscreenActive` 标志，在 `onPress`/`onRelease` 中守卫。完全解耦 DOM 事件传播。（commit dc391c1）
- **`show()` 覆盖 `hide()` 的 onAnimDone 竞争**：当 `show()` 在 `hide()` 动画进行中被调用时，旧的 `onAnimDone` 回调仍会触发 → 销毁新 sprite → 损坏 `active`/`isDragging` 状态。**结论**：`show()` 开头必须 `animating → proxy.ticker.remove(tick); onAnimDone = null` 清除所有待处理动画回调后再创建新内容。
- **FullscreenManager globalpointermove 无按钮检测**：`globalpointermove` 对所有指针移动触发，不要求按钮按下。`pointerup` 重置 `isDragging=false` 后，一次无辜的 move 就可以超过阈值重新进入拖拽模式。**结论**：`globalpointermove` 开头 `if (!(e.buttons & 1)) { isDragging = false; return; }`。（commit 63a5d67）
- **Graphics.clear() 防御的三种模式**：PIXI v8 下 Graphics 被 destroy 后 context=null，任何 `.clear()` 调用 crash。
  1. **Scrollable 风格**：`destroyed` 布尔 flag + public 方法入口守卫（`if (destroyed) return;`）。适合有明确生命周期的长寿命组件。
  2. **Loading/Displays 风格**：tick 函数内 `try { graphics.clear() } catch { /* 已销毁 */ }`。适合 tick 驱动的临时图形，父销毁不通知。
  3. **SubCanvas.updateMask 风格**：try-catch + catch 内重建。适合框架内部必须持续工作的对象。
  参见 commit 9607c33 / c4372d3。

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
- **PWA**: `public/manifest.webmanifest` + `public/sw.js` (`sim-v3` — network-first nav, cache-first assets, skipWaiting + controllerchange reload)

## Tags / milestones

| tag | state |
|---|---|
| `v0.1.0-pre-restruct` | Pre-restruct archive (PIXI+HTML mix, fast-drag fix landed). |
| `v0.2.3` | Lifecycle audit: Loading cleanup now idempotent (parent check + early return); PixiConfirm/PixiWindow setTitle/setMessage/setImage guard against `win.destroyed`; example refs (`wins`, `lastPos`, `btns`, `scrolls`) moved from `useRef` to effect-local for correctness + lint cleanliness. |
| `v0.2.2` | PixiVideoPlayer stability: Chrome decode throttling fix (off-screen + reasonable size, `updateFPS: 0`), first-frame primer for non-autoplay, VideoSource destroy-before-DOM ordering, sprite scale from `videoWidth`, HUD in SubCanvas, fetch blob fallback. |
| `v0.2.0` | Stability round: browser-back crash, ClickableImage destroy order, innerCleanup, Graphics lifecycle guards. |
