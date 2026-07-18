# SubCanvas Framework

PIXI v8 游戏 UI 框架。组件可拖动，支持无限画布。

---

## 架构总览

```
┌──────────────────────────────────────────────────┐
│  Framework Layer (src/framework/)                │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
│  │ PixiApp  │─▶│SubCanvas │─▶│ SubCanvasProxy │ │
│  │ (init/   │  │ (区域/   │  │ (多画布路由)    │ │
│  │  resize/ │  │  事件/   │  └────────────────┘ │
│  │  health) │  │  拖动)   │  ┌────────────────┐ │
│  └──────────┘  └──────────┘  │ InfiniteCanvas  │ │
│                              │ (chunk/zoom/    │ │
│  ┌──────────┐  ┌──────────┐ │  plugin)        │ │
│  │ GSAP     │  │ EventBus │ └────────────────┘ │
│  │ PixiPlugin│  │ (pub/sub)│ ┌────────────────┐ │
│  └──────────┘  └──────────┘ │ ComponentRegistry│ │
│                              └────────────────┘ │
├──────────────────────────────────────────────────┤
│  Components Layer (src/components/)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ PixiWin  │ │PixiConfirm│ │Scrollable│  ...   │
│  │ (window) │ │ (modal)  │ │ (滚动)   │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │Fullscreen│ │Clickable │ │Loading/  │        │
│  │ Manager  │ │  Image   │ │ Avd/...  │        │
│  └──────────┘ └──────────┘ └──────────┘        │
├──────────────────────────────────────────────────┤
│  Examples Layer (src/example/)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │Launcher  │ │GSAP      │ │Infinite  │  ...   │
│  │(home)    │ │Showcase  │ │Canvas    │        │
│  └──────────┘ └──────────┘ └──────────┘        │
└──────────────────────────────────────────────────┘
```

### 分层原则

| 层 | 职责 | 是否依赖 PIXI | 是否依赖 GSAP |
|----|------|--------------|--------------|
| Framework | 画布管理、事件路由、坐标系统、无限画布、组件注册表 | ✅ | ✅ (gsap-pixi.ts) |
| Components | 具体 UI 组件（窗口、弹窗、滚动、图片、AVD） | ✅ | ❌（闭包工厂，纯 PIXI） |
| Animated Zones | FullscreenManager、Loading、AvdPortraitLayer、Displays | ✅ | ✅ (GSAP tween 替换了手写 ticker) |
| Examples | 示例页面、启动器 | ✅ | 部分 |

**重要**：Components 层（`PixiWindow`、`PixiConfirm`、`Scrollable`）是 PIXI 架构下的闭包工厂，不依赖 GSAP。GSAP 只在 Framework 层的 `gsap-pixi.ts` 注册 PixiPlugin，供有动画需求的组件使用。

### 数据流

```
Pointer Event (DOM) → PixiApp.routePointer
  → SubCanvasProxy 遍历 topCanvases
    → SubCanvas.handlePointer (AABB 命中检测)
      → 逆序遍历子 SubCanvas（后画在上层）
        → 命中 → 触发 onPress/onMove/onRelease/onTap
        → 未命中 → 继续遍历

组件间通信：EventBus (pub/sub)
  bus.emit('event-name', payload)
  bus.on('event-name', handler) → return unsubscribe
```

### Component Registry 适配器模式

```
原始工厂（不同签名）：
  createWindow({ parent, title, width, height, ... }) → GameWindow (SubCanvas)
  createScrollable(parent, { width, height, ... }) → Scrollable { stage, content }
  createConfirm({ parent, title, message, ... }) → PixiConfirm (SubCanvas)

适配器（统一为 Component<T>）：
  registerComponent('window', (opts) => {
    const win = createWindow(opts);
    return { type, stage: win.stage, destroy, destroyed };
  });

消费者：createComponent('window', opts) → Component
```

目前注册了 3 个类型：`window` / `confirm` / `scrollable`。

Component 接口只有一个 `stage: PIXI.Container`，对于需要暴露 `content` SubCanvas 的组件（如 PixiWindow），目前只能通过 `createWindow` 直接拿，不走 registry。如果 registry 组件也需要访问 `content`，可以在 Component 上加可选字段 `content?: SubCanvas`。

### PIXI vs GSAP 的关系

- **Components 层（PixiWindow、PixiConfirm、Scrollable）**：纯 PIXI，无 GSAP。拖动通过 SubCanvas 的内置 `dragMode` 实现（基于 PIXI 事件 + window-level pointermove）。
- **Animated 组件（FullscreenManager、Loading、AvdPortraitLayer）**：GSAP 用于动画 timeline / tween，替换了早期的手写 `lerp + rAF` ticker。
- **`gsap-pixi.ts`**：Framework 层统一导出 `gsap` 实例（已注册 PixiPlugin + `registerPIXI(PIXI)`），外部只需 `import { gsap } from '../framework'`。

---

## 快速开始

```ts
import { startPixiApp, SubCanvas } from '../framework';
import { createWindow } from '../components';

const stop = startPixiApp((proxy) => {
  // proxy === SubCanvasProxy — 应用根管理器
  // proxy.stage     — PIXI.Container，画布根节点
  // proxy.bus       — EventBus 发布订阅
  // proxy.ticker    — PIXI.Ticker
  // proxy.renderer  — PIXI.Renderer
  // proxy.canvas    — HTMLCanvasElement

  // 创建根 SubCanvas（全屏）
  const root = proxy.createRoot();

  // 创建子区域
  const panel = root.createSubRegion(
    { x: 10, y: 10, width: 200, height: 300 },
    { dragMode: 'title' }, // 可拖动
  );

  // 用组件工厂
  const win = createWindow({
    parent: root,
    title: 'Hello',
    width: 400,
    height: 300,
  });

  return () => {
    // cleanup
    proxy.destroyAll();
    stop();
  };
});
```

---

## 核心 API

### startPixiApp

```ts
function startPixiApp(onReady: (proxy: SubCanvasProxy) => void): () => void
```

- 初始化 PIXI.Application（async init）
- 挂载 canvas 到 `document.body`
- `backgroundColor: 0x000000, antialias: true, resolution: devicePixelRatio, autoDensity: true`
- WebGL probe → fallback 检测
- 返回 destroy 函数

#### Resize

浏览器窗口缩放或 Ctrl+± 缩放时：
- 80ms debounce `resize` 事件
- `app.renderer.resize(w, h, dpr)` 传入当前 `devicePixelRatio`
- 防抖避免连续缩放时的 framebuffer 重建风暴

### SubCanvas

轻量 PIXI 容器包装，提供坐标转换和子区域管理。

```ts
interface SubCanvas {
  readonly stage: PIXI.Container;
  readonly bounds: Rect;

  // 子区域
  createSubRegion(bounds: Rect, opts?: SubCanvasOptions): SubCanvas;

  // 事件
  onPress(handler): void;
  onMove(handler): void;
  onRelease(handler): void;
  onTap(handler): void;
  onDrag(handler): void;
  offPointer(type, handler): void;

  // 坐标系
  clientToLocal(clientX, clientY): { x, y };
  localToClient(localX, localY): { x, y };

  // 生命周期
  destroy(): void;
  readonly destroyed: boolean;
}
```

#### 拖动模式

```ts
createSubRegion(bounds, {
  dragMode: 'none' | 'title' | 'anywhere',
  // 'title' — 只在点击 label='subcanvas-drag-handle' 的子节点时拖动
  // 'anywhere' — 点击任意位置拖动
  dragBounds: () => Rect, // 限制拖动范围
  clipToBounds: boolean,  // 遮罩裁剪
});
```

#### Tile 模式（游戏地图）

通过 `SubCanvas.tile()` 开启 toroidal wrap（环形世界，适合 Life Map / 模拟游戏）：

```ts
interface SubCanvas {
  tile(opts: TileOptions): TileController;
  // 只需两层：active.fill(R, G, B, A) 直接写像素
  // 滚动时自动偏移 UV，无需重建 tile
}
```

### InfiniteCanvas

插件化无限拖拽画布。分块（chunk）懒加载，惯性滚动。

```ts
import { InfiniteCanvas } from '../framework';

const ic = new InfiniteCanvas({
  parent: root,        // SubCanvas 父容器
  viewport: root.bounds,
  chunkSize: 512,
  preloadMargin: 1,    // 预加载 1 圈 chunk
  chunkCreate: (chunk) => { /* 填充 PIXI 内容 */ },
  chunkDestroy: (chunk) => { /* 清理 */ },
  decelerate: true,    // 惯性
  zoom: 1,
  minZoom: 0.1,
  maxZoom: 10,
  onDrag: (worldX, worldY) => {},
  onTap: (worldX, worldY) => {},
});
```

#### 方法

| 方法 | 说明 |
|------|------|
| `panBy(dx, dy)` | 平移（screen-space，自动 /zoom） |
| `panTo(x, y)` | 跳到世界坐标 |
| `centerOn(wx, wy)` | 居中到世界点 |
| `setZoom(zoom, cx?, cy?)` | 缩放，保持 (cx,cy) 下的世界点不动 |
| `screenToWorld(sx, sy)` | 屏幕坐标 → 世界坐标 |
| `worldToScreen(wx, wy)` | 世界坐标 → 屏幕坐标 |
| `eachChunk(fn)` | 遍历当前所有 chunk |
| `addPlugin(plugin)` | 添加插件 |
| `removePlugin(name)` | 移除插件 |

#### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `.worldX` / `.worldY` | number | 当前世界偏移 |
| `.zoom` | number | 当前缩放 |
| `.viewport` | Rect | 视口矩形 |
| `.loadedChunkCount` | number | 当前加载的 chunk 数 |

#### 插件系统

```ts
interface InfiniteCanvasPlugin {
  readonly name: string;
  priority: number;
  parent: InfiniteCanvas;
  onDown?(e: SubPointerEvent): void;
  onMove?(e: SubPointerEvent): void;
  onUp?(e: SubPointerEvent): void;
  onTap?(worldX, worldY): void;
  onUpdate?(elapsed: number): void;
  onResize?(): void;
  onDestroy?(): void;
}
```

插件按 priority 升序执行。内置 DeceleratePlugin（priority=50）。

### 组件注册表

```ts
import { registerComponent, createComponent, registeredTypes } from '../framework';

// 注册
registerComponent<MyOptions>('my-type', (opts) => ({
  type: 'my-type',
  stage: myPIXIContainer,
  destroy: () => cleanup(),
  get destroyed() { return isDestroyed; },
}));

// 使用
const comp = createComponent('my-type', {
  parent: root,
  width: 200,
  height: 100,
  // 自定义选项...
});

comp.destroy();
```

已注册类型：`window` / `confirm` / `scrollable`（在 `register-components.ts` 中通过适配器包装原始工厂）。

### GSAP 动画

```ts
import { gsap } from '../framework/gsap-pixi';

// PIXI 对象（PixiPlugin）
gsap.to(sprite, {
  pixi: { x: 100, y: 200, scale: 1.5, alpha: 0.5 },
  duration: 0.3,
  ease: 'power2.out',
});

// Graphics 重绘（需要在 onUpdate 中调用 clear/redraw）
gsap.to({ t: 0 }, {
  t: 1,
  duration: 1,
  onUpdate: function () {
    graphic.clear();
    // 根据 this.targets()[0].t 重绘
  },
});

// 追踪 + 清理
let tween = gsap.to(sprite, { ... });
tween.kill();               // 中断特定 tween
gsap.killTweensOf(sprite);  // 中断目标所有 tween
```

### EventBus

```ts
import { EventBus } from '../framework';

const bus = new EventBus();

// 订阅
const unsub = bus.on('fullscreen:show', (payload: FullscreenShowEvent) => {
  // ...
});

// 发布
bus.emit('fullscreen:show', { texture, texW, texH, ... });

// 取消订阅
unsub();
// 或: bus.off('fullscreen:show', handler);

bus.clear();               // 清除所有
bus.listenerCount('evt');  // 查询
```

**内部实现** — `Map<string, Set<Handler>>`，每个事件一个 Set。`on()` 返回 unsubscribe 函数。`emit()` 遍历 Set 快照，单个 handler 抛异常不影响其他。用在：
- `FullscreenManager` ↔ `ClickableImage`：`fullscreen:show` / `fullscreen:hide` / `fullscreen:active` / `fullscreen:inactive`
- 自定义组件间通信

### 工具函数

```ts
import { clamp, lerp, mapRange, distance, randomInt, ... } from '../framework/utils/math';
import { hexToRgb, rgbToHex, hslToRgb, lerpColor, ... } from '../framework/utils/color';
import { insetRect, unionRect, intersectRect, expandRect, ... } from '../framework/utils/rect';
```

### EventBus

```ts
const bus = new EventBus();
const unsub = bus.on('event-name', (payload) => {});
bus.emit('event-name', someData);
unsub(); // 取消订阅
```

---

## 预置组件

| 工厂 | 说明 | 拖动？ |
|------|------|--------|
| `createWindow(opts)` | 窗口（标题栏+关闭按钮+内容区） | 支持 |
| `createConfirm(opts)` | 模态弹窗（标题+消息+按钮组+图片） | 支持 |
| `createScrollable(parent, opts)` | 滚动容器（垂直/水平+滚动条） | 否 |
| `createLoadingImage(parent, opts)` | 图片加载器（loading→显示/错误回退） | 否 |
| `createClickableImage(parent, bus, opts)` | 可点击图片（点击→fullscreen） | 否 |
| `createVideoPlayer(parent, opts)` | PIXI 视频播放器 | 否 |
| `createFullscreenManager(proxy)` | 全屏看图管理器（缩放+拖动+双击+滑动关闭） | 缩放拖拽 |
| `showLoading(sc, opts)` | 加载遮罩（显示 spinner） | 否 |
| `makeButton(label, w, h, onClick, bg?)` | 按钮 | 否 |
| `makeStepper(label, getValue, onChange, min, max)` | 步进器 | 否 |

### AVD（视觉小说引擎）

```ts
import { Avd } from '../components';

const avd = new Avd(parent, screenW, screenH, ticker, {
  boxWidth: 920,
  boxHeight: 200,
  typewriterSpeed: 30,
  textFadeMs: 200,
  boxEnterMs: 400,
  // ...
});

avd.setScript([
  { speaker: 'Alice', text: 'Hello...', portrait: texture, portraitPos: 'left' },
  { speaker: 'Bob', text: 'Hi!', portrait: texture2, portraitPos: 'right' },
]);

avd.next();       // 推进对话
avd.goTo(5);      // 跳到第 5 句
avd.destroy();    // 清理
```

---

## 内部原理

### 生命周期

```
startPixiApp()
  ├── probeWebGL()                      ← 检测 WebGL 可用性
  ├── new Application()
  ├── app.init({ resolution: dpr, ... })
  │   └── 选择 WebGL/WebGPU renderer
  ├── mount canvas to body
  ├── new SubCanvasProxy({ app })
  └── onReady(proxy)

Proxy.createRoot()
  └── new SubCanvas(stage, app.bounds)
      ├── stage: 独立的 PIXI.Container
      ├── bounds: 相对于父级的矩形
      └── event routing via SubCanvasProxy

SubCanvas.createSubRegion()
  └── new SubCanvas(子 container, 子 bounds)
      ├── dragHandler（基于 dragMode）
      └── mask（如果 clipToBounds）

destroy chain:
  destroyAll() → 递归销毁所有 SubCanvas
  app.destroy(true) → 释放 GPU 资源
```

### 坐标系统

```
clientX/Y  ← window 事件坐标
    ↓ SubCanvas.clientToLocal(clientX, clientY)
localX/Y   ← 相对于 SubCanvas.stage 左上角
```

### 事件路由

```
window.addEventListener('pointerdown', handler)
  └── handler 检查 e.target === canvas
      └── proxy.routePointer('pointerdown', e)
          └── 遍历 topCanvases，逆向命中检测
              └── SubCanvas.onPress(handler) 触发
```

每个 SubCanvas 只注册需要的指针事件类型，通过 `onPress`/`onMove`/`onRelease`/`onTap` 接口。

`offPointer(type, handler)` 用于卸载。

### 拖动机制

```
createSubRegion(bounds, { dragMode, dragBounds })
  └── press: 记录 startPos
      ├── dragMode === 'title': 检查 e.target.label === 'subcanvas-drag-handle'
      └── dragMode === 'anywhere': 始终允许
  └── move: 计算 delta，更新 stage.position，clamp 到 dragBounds
  └── release: 结束拖动
```

### InfiniteCanvas 插件循环

```
Ticker.add(tickFn)
  └── performance.now() 算 elapsed
      └── 遍历 plugins (priority 排序)
          └── onUpdate(elapsed)  ← DeceleratePlugin 在此应用惯性

Drag event flow:
  pointerdown → onDown(plugins) → 保存起始点
  pointermove → onMove(plugins) → 保存位置历史
  pointerup   → onUp(plugins)   → DeceleratePlugin 计算 velocity 启动惯性
  Ticker      → onUpdate        → 衰减 velocity，panBy()
```

### GSAP 集成策略

GSAP 和 PIXI.Ticker 都基于 rAF，直接共存无需特殊同步。

| 场景 | 方案 |
|------|------|
| 一次性动画（淡入、滑动、缩放） | `gsap.to(obj, { duration, ease, onComplete })` |
| 持续动画（spinner 旋转） | `gsap.to(obj, { repeat: -1, ease: 'none' })` |
| Graphics 重绘动画 | `gsap.to({ t: 0 }, { t: 1, onUpdate: redraw })` |
| 物理模拟（惯性、弹性） | 保留 Ticker，不适合 GSAP |

### Zoom-to-Pointer 算法

```
setZoom(newZoom, cx, cy):
  1. 缩放前：worldPoint = screenToWorld(cx, cy)
     = ((cx - worldX) / zoom, (cy - worldY) / zoom)
  2. 应用缩放：zoom = clamp(newZoom, min, max)
     worldContainer.scale.set(zoom)
  3. 调整偏移使 worldPoint 保持在 (cx, cy) 下：
     worldX = cx - worldPoint.x * zoom
     worldY = cy - worldPoint.y * zoom
```

### 组件注册表适配器模式

```
原始工厂（不同签名）：
  createWindow(opts) → GameWindow
  createScrollable(parent, opts) → Scrollable

适配器（统一为 Component<T>）：
  registerComponent('window', (opts) => {
    const win = createWindow({ ...opts });
    return { type: 'window', stage: win.stage, destroy, destroyed };
  });

消费者：
  const win = createComponent('window', { parent, title: '...', width, height });
```

### Resize 与浏览器缩放

```
window 'resize' event
  └── Ctrl+± 触发 DPR + viewport 变化
      └── 80ms debounce
          └── app.renderer.resize(w, h, dpr)
              └── 更新 canvas 像素尺寸 + CSS 尺寸
                  └── PIXI 自动调整视口
```

---

## 部署

- push to `sim` → Cloudflare Pages 自动部署 → `https://react.moonchan.xyz/`
- CI: `.github/workflows/ci.yml` — lint → tsc → test → build
- 外部只 import `framework/index.ts` 和 `components/index.ts`，不做 deep import
