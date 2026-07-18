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

| 层 | 职责 | 依赖 PIXI | 依赖 GSAP |
|----|------|-----------|----------|
| Framework | 画布管理、事件路由、坐标系统、无限画布、组件注册表 | ✅ | ✅ (`gsap-pixi.ts`) |
| Components | 窗口、弹窗、滚动、图片、AVD 等 UI 组件 | ✅ | 部分组件 |

**重要**：所有组件都在 `src/components/` 下。其中有动画需求的（FullscreenManager、Loading、AvdPortraitLayer、Displays）额外引入了 GSAP，用 `gsap.to/timeline` 替换了早期的手写 `lerp + rAF` ticker。纯布局/交互组件（PixiWindow、PixiConfirm、Scrollable）不依赖 GSAP。

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
  createScrollable({ parent, width, height, ... }) → Scrollable { stage, content }
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

## 二次开发指南

以下内容面向 **在本框架之上开发新组件和扩展** 的开发者。如果你是框架内部维护者，也请参考 `LEARNINGS.md` 了解历史决策和踩坑记录。

### 一、组件开发契约

每个组件的返回结构必须满足以下接口：

```ts
interface Component {
  stage: Container;    // PIXI 场景节点，将被 addChild 到父容器
  destroy: () => void; // 清理所有资源（PIXI 对象、GSAP tween、事件监听）
  destroyed: boolean;  // 是否已销毁（异步回调中作为 guard 检查）
}
```

组件参数的首个参数统一为 `parent: SubCanvas`，父容器负责提供坐标空间。

```ts
// 模板
export interface MyWidgetOptions {
  parent: SubCanvas;
  width: number;
  height: number;
}

export function createMyWidget(opts: MyWidgetOptions) {
  const stage = new Container();
  const destroy = () => {
    gsap.killTweensOf(stage);   // 清理 GSAP
    stage.destroy({ children: true });
  };
  const destroyed = false;       // destroy() 时改为 true
  return { stage, destroy, get destroyed() { return ... } };
}
```

### 二、组件放置位置

```
src/components/          ← 你的组件放这里
  MyWidget.ts            ← 一个文件一个组件
  index.ts               ← 重新导出所有公共组件
```

`src/components/index.ts` 是组件层的唯一入口。外部只允许 `import { createMyWidget } from '../components'`。

### 三、注册到统一工厂（可选）

如果希望组件也能通过 `createComponent('my-widget', opts)` 创建，在 `src/framework/register-components.ts` 中添加适配器：

```ts
import { createMyWidget } from '../components/MyWidget';

registerComponent<MyWidgetOptions>('my-widget', (opts) => {
  const widget = createMyWidget(opts);
  return {
    type: 'my-widget',
    stage: widget.stage,
    destroy: widget.destroy,
    get destroyed() { return widget.destroyed; },
  };
});
```

这样消费者可以用统一 API：

```ts
const w = createComponent('my-widget', { parent: root, width: 100, height: 50 });
w.destroy();
```

### 四、GSAP 使用规范

| 场景 | 做法 |
|------|------|
| 一次性动画（淡入、滑动、缩放） | `gsap.to(obj, { pixi: { x, y, alpha }, duration })` |
| 循环动画（spinner、呼吸光） | `gsap.to(obj, { repeat: -1, ease: 'none' })` |
| 连续动画链 | `gsap.timeline().to(...).to(...)` |
| Graphics 重绘 | `gsap.to({ t: 0 }, { t: 1, onUpdate: redraw })` |
| 延迟执行 | `gsap.delayedCall(1, fn)` |

**不要在组件内部新增手写 rAF/PIXI.Ticker**。框架统一用 GSAP。例外：物理模拟（惯性、弹性）保留 Ticker。

`pixi: { rotation }` 单位是 **度**（不是弧度）。如需弧度，直接用 `gsap.to(obj, { rotation: Math.PI * 2 })` 绕开 PixiPlugin。

### 五、拖拽实现规范

如果组件需要拖拽，不要自己写 pointer 事件。已有的拖拽方案：

1. **SubCanvas dragMode** — 轻量区域拖拽，提供 `'none'` / `'title'` / `'anywhere'` 三种模式
2. **InfiniteCanvas** — 无限画布自带平移拖拽

如果以上不满足需求，需要自行实现拖拽时，**必须**使用 window-level pointer 兜底：

```ts
// ✅ 正确模式
stage.on('pointerdown', (e) => {
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
});
// 纯 PIXI stage.on('pointermove') 在快速拖动时会丢事件
```

### 六、性能守则

1. **bounds 计算与视图同步分离** — 参考 `Scrollable.ts` 的 `recalc()` vs `sync()` 模式。前者 O(n)，只在增删子节点时调用；后者 O(1)，每帧频繁调用。
2. **destroy guard** — 所有异步回调（GSAP onComplete、setTimeout、fetch.then）第一行检查 `if (destroyed) return`，防止组件已销毁后操作 PIXI 对象。
3. **GSAP tween 清理** — 组件 destroy 时调用 `gsap.killTweensOf(obj)`，防止 gsap 持有已销毁对象的引用。

### 七、EventBus 使用约定

- 事件名统一为 `namespace:action` 格式（如 `fullscreen:show`、`item:select`）
- 组件销毁时调用 `bus.off(event, handler)` 或利用 `on()` 返回的 unsubscribe 函数
- EventBus 适合**跨组件通信**。父子组件通信直接用函数调用更简单

### 八、InfiniteCanvas 插件开发

```ts
import type { InfiniteCanvasPlugin } from '../framework';

function createGridPlugin(): InfiniteCanvasPlugin {
  return {
    name: 'grid',         // 唯一标识
    priority: 10,         // 执行顺序（升序）
    parent: null!,        // 由 addPlugin 时赋值
    onTap(worldX, worldY) { /* 点击 */ },
    onUpdate(elapsed)     { /* 每帧 */ },
    onDestroy()           { /* 清理 */ },
  };
}

ic.addPlugin(createGridPlugin());
ic.removePlugin('grid');
```

内置插件：DeceleratePlugin（priority=50）。

### 九、import 规则

```
外部代码
  → 只允许 import { ... } from '../framework' 和 '../components'
  → 禁止 import { SubCanvas } from '../framework/SubCanvas'
```

TypeScript paths 别名（`@framework/*`、`@components/*`）已配置在 `tsconfig.json`，但 **构建时不保证生效**（取决于 bundler）。生产代码用相对路径。

### 十、测试

```sh
npm run test          # vitest 运行
npm run test:watch    # watch 模式
npm run typecheck     # tsc --noEmit
npm run lint          # eslint
```

测试放在 `src/` 下对应目录（如 `src/framework/EventBus.test.ts`）。纯函数优先测试，PIXI 相关组件用 registry smoke test 验证（参考 `src/framework/register-components.test.ts`）。

CI pipeline 在 `.github/workflows/ci.yml`：lint → tsc → test → build。

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
  const panel = root.createRegion(
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
  createRegion(bounds: Rect, opts?: SubCanvasOptions): SubCanvas;

  // 事件
  onPress(handler): void;
  onMove(handler): void;
  onRelease(handler): void;
  onTap(handler): void;
  offPointer(type, handler): void;

  // 生命周期
  destroy(): void;
  readonly destroyed: boolean;
}
```

#### 拖动模式

```ts
createRegion(bounds, {
  dragMode: 'none' | 'title' | 'anywhere',
  // 'title' — 只在点击 label='subcanvas-drag-handle' 的子节点时拖动
  // 'anywhere' — 点击任意位置拖动
  dragBounds: () => Rect, // 限制拖动范围
  clipToBounds: boolean,  // 遮罩裁剪
});
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
| `createScrollable({ parent, ... })` | 滚动容器（垂直/水平+滚动条） | 否 |
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

SubCanvas.createRegion()
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
createRegion(bounds, { dragMode, dragBounds })
  └── press: 记录 startPos
      ├── dragMode === 'title': 检查 e.target.label === 'subcanvas-drag-handle'
      └── dragMode === 'anywhere': 始终允许
  └── move: 计算 delta，更新 stage.position，clamp 到 dragBounds
  └── release: 结束拖动
```

#### 保证拖拽流畅：window-level pointer 兜底

纯 PIXI `stage.on('pointermove', ...)` 在快速拖动时会丢事件，导致"不跟手"。必须同时在 `pointerdown` 时注册 `window.addEventListener('pointermove', handler)` 做兜底，DOM 事件永远不丢。

```ts
// 反例：只靠 PIXI 事件（Scrollable 修之前）
stage.on('pointerdown', () => { dragging = true; });
stage.on('pointermove', onMove);  // 快拖丢事件 → 卡

// 正例：PIXI + window 双路（Scrollable 修之后）
stage.on('pointerdown', () => {
  dragging = true;
  window.addEventListener('pointermove', onWindowMove);
  window.addEventListener('pointerup', onWindowUp);
});
const onPxiMove = (e) => applyDrag(e.globalX, e.globalY);
const onWindowMove = (e) => applyDrag(e.clientX, e.clientY);
```

`SubCanvas._installDragOnHandle` 和 `Scrollable` 都使用此模式。

### 性能：bounds 计算 vs 视图同步分离

滚动容器或频繁更新位置的组件，必须把 **bounds 重算** 和 **视图同步** 拆成两个函数：

| 路径 | 频率 | 开销 | 调用时机 |
|------|------|------|---------|
| `recalc()` | 低 | O(n) 遍历子节点 + getBounds | 子节点增删、尺寸变化 |
| `sync()` | 高 | O(1) 只改 x/y + 滚动条 | 每帧滚轮、拖拽 |

反例（修之前的 Scrollable）：`sync()` 里每次调用 `calcBounds()`，滚轮每 tick 都 O(n) → 卡顿。

正例（修之后）：`addChild` 代理自动调 `recalc()`，滚轮/拖拽只调 `sync()`。所有需要频繁更新位置的组件都应遵循这个模式。

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
  createScrollable(opts) → Scrollable (with parent in opts)

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
