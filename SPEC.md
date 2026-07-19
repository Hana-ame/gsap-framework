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
  const root = proxy.createRegion({ x: 0, y: 0, width: 800, height: 600 });

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

#### PerfDisplay — 性能 HUD

默认不显示。`proxy.showPerfMeasure(true)` 打开左上角性能面板，显示 FPS、帧耗时、场景对象数、分辨率：

```ts
proxy.showPerfMeasure(true);   // 显示
proxy.showPerfMeasure(false);  // 隐藏
```

每次 `startPixiApp` 会自动创建一个绑定了 `app.ticker` + `app.stage` 的 `PerfDisplay` 实例，通过 `SubCanvasProxy.showPerfMeasure()` 控制。

独立开关（不依赖 proxy）：

```ts
import { enablePerfMeasure, disablePerfMeasure } from '../framework';
enablePerfMeasure();
disablePerfMeasure();
```

显示内容：

| 行 | 说明 |
|----|------|
| `xx.x FPS` | 60 帧滚动平均 |
| `xx.x ms` | 平均帧耗时 |
| `objects: N` | 场景树递归统计 |
| `resolution: W×H` | canvas 逻辑尺寸 |

RenderGroup 等内部节点会计入对象数（它们是 `PIXI.Container` 的子类）。

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
| `panBy(dx, dy)` | 平移（屏幕像素空间，zoom 自动抵消——鼠标拖 dx 像素，世界跟手） |
| `panTo(x, y)` | 设置滚动偏移（已弃用，见下方修复记录；用 `centerOn` 代替） |
| `centerOn(wx, wy)` | 居中到世界点——视口中心对准世界坐标 (wx, wy) |
| `setZoom(zoom, cx?, cy?)` | 缩放，保持 (cx,cy) 下的世界点不动 |
| `screenToWorld(sx, sy)` | 屏幕坐标 → 世界坐标 |
| `worldToScreen(wx, wy)` | 世界坐标 → 屏幕坐标 |
| `eachChunk(fn)` | 遍历当前所有 chunk |
| `addPlugin(plugin)` | 添加插件 |
| `removePlugin(name)` | 移除插件 |

#### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `.worldX` / `.worldY` | number | 视口中心的世界坐标（zoom 时不变） |
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

### LayerManager

```ts
import { LayerManager, type Layer } from '../framework';

const layers = new LayerManager(parentContainer);
parentContainer.sortableChildren = true;

// Add layers (name + zIndex)
const bg   = layers.add('bg',   0);
const game = layers.add('game', 10);
const ui   = layers.add('ui',  100);

// Layer API
bg.addChild(sprite);
bg.hide();
bg.show();
bg.setAlpha(0.5);
bg.alpha;  // getter

// LayerManager API
layers.get('game');            // Layer | undefined
layers.has('ui');              // boolean
layers.names();                // string[]
layers.remove('bg');           // boolean
layers.bringToFront('ui');
layers.sendToBack('game');
layers.destroy();
```

**设计原则**：纯语法糖，零额外开销。每个 Layer 只是一个带 label 的 `PIXI.Container`，z-order 通过原生 `zIndex` + `sortableChildren` 实现。不引入额外 draw call 或遍历。

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
| `mountDisplays(sc)` | 示例工具：十字准星+点击波纹+计数器（挂载到任意 SubCanvas） | 否 |
| `makeStepper(label, getValue, onChange, min, max, step?)` | 步进器（step 支持 +10 快速调节） | 否 |
| `LayerManager(stage)` | 命名层系统（z-order、show/hide、alpha、bringToFront） | 否 |

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

## 后端控制架构

### 架构概览

```
MockBackend / WebSocket (命令源)
    ↓
WindowManager (缓冲层)
    ├── 管理窗口生命周期 (open/close/move/resize)
    ├── 路由内容到对应窗口
    └── 维护窗口状态
ContentChannel (WS 流式内容通道)
    ↓
Framework API → PIXI 渲染
```

### 命令协议

每条命令遵循统一接口：

```ts
interface BackendCommand {
  id: string;
  type: BackendCommandType;
  payload: Record<string, unknown>;
  timestamp: number;
}
```

支持的命令类型：

| type | payload | 作用 |
|------|---------|------|
| `open-window` | `{ id, title, x, y, width, height }` | 创建窗口 |
| `close-window` | `{ id }` | 关闭窗口 |
| `move-window` | `{ id, x, y }` | 移动窗口 |
| `resize-window` | `{ id, width, height }` | 缩放窗口 |
| `set-title` | `{ id, title }` | 改标题 |
| `set-content` | `{ windowId, type }` | 设置窗口内容 |
| `clear-content` | `{ windowId }` | 清空窗口内容 |
| `stream-content` | `{ windowId, text, seq, total, done }` | WS 流式内容块 |
| `ping` | `{}` | 心跳 |

### 层职责

| 层 | 文件 | 职责 |
|----|------|------|
| MockBackend | `backend/MockBackend.ts` | JS 模拟后端，支持 `send` / `sendSequence` / `connect` / `disconnect`，通过 `on('command', ...)` 通知下游 |
| WindowManager | `backend/WindowManager.ts` | 缓冲层：接收命令 → 调用 `createWindow` / `setPosition` 等框架 API，管理窗口注册表 |
| ContentChannel | `backend/ContentChannel.ts` | WS 流式内容：分块接收 `stream-content` → 组装 → 渲染到目标窗口 |

### 生产替换

开发环境用 `MockBackend` 模拟后端行为。生产环境将 `MockBackend` 替换为 WebSocket 连接：

```ts
// MockBackend 和 WebSocket 使用相同的 BackendCommand 接口
const backend = new WebSocketBackend('wss://...');
// 同一套 WindowManager + ContentChannel 直接使用
```

### 数据流（窗口创建示例）

```
MockBackend.send('open-window', { id, title, x, y, w, h })
  ↓
WindowManager.handleCommand({ type: 'open-window', payload: ... })
  ↓
createWindow({ parent, title, x, y, w, h })
  ↓
SubCanvas.createRegion(...) → PIXI 渲染
  ↓
WindowManager 注册窗口到 Map
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

#### SubCanvas 定位模型

SubCanvas **不依赖 PIXI transform** 做定位。位置通过 `_bounds` 字段 + `setPosition()` 管理：

```
setPosition(x, y):
  _bounds.x = x
  _bounds.y = y
  stage.x = x      ← PIXI stage 只是渲染结果的反映，不是位置源头
  stage.y = y
```

所有定位决策都读 `_bounds`，不读 `stage.x/y`。

#### globalBounds

`globalBounds` 是 SubCanvas 在 viewport 中的绝对位置（即 client 坐标空间）：

```
get globalBounds():
  x = _bounds.x, y = _bounds.y
  p = parent
  while p:
    x += p._bounds.x        ← 递归求和所有父级的偏移
    y += p._bounds.y
    p = p.parent
  return { x, y, width, height }
```

#### Event hit-test

事件路由用 `clientX/Y` 与 `globalBounds` 做 AABB 检测：

```
handlePointer(type, e):
  gx = e.clientX, gy = e.clientY
  if gx < gb.x || gx > gb.x + gb.width: return false   ← 不在区域内
  if gy < gb.y || gy > gb.y + gb.height: return false
  ...
```

命中后构建 `SubPointerEvent`：

```
SubPointerEvent:
  x: gx - gb.x         ← 相对此 SubCanvas 的局部坐标
  y: gy - gb.y
  globalX: gx          ← 始终是 clientX/Y（与父级位置无关）
  globalY: gy
```

**所有层级的 `globalX/Y` 都是 `clientX/Y`**，不随父级偏移改变。这保证了拖拽计算（如 InfiniteCanvas）在不同嵌套深度下的一致。

#### InfiniteCanvas 拖拽与 zoom

InfiniteCanvas 内部用 `_scrollX/_scrollY`（worldContainer 在父 SubCanvas stage 中的像素偏移）和 `_zoom` 实现平移和缩放。

`_scrollX` 不是世界坐标。它是世界原点（0,0）在屏幕上的像素位置。例如 `_scrollX = 0` 且 `zoom = 1` 时，世界原点在视口左上角。

**为什么拖拽用 screen delta 而不是 world delta？**

拖拽时鼠标在 screen 空间移动 `dx`，保持世界点跟手的条件是：

```
startClientX + dx = _scrollX_new + worldPoint * zoom
worldPoint = (startClientX - _scrollX_old) / zoom
→ _scrollX_new = _scrollX_old + dx     ← zoom 完全抵消
```

所以 `panBy` 直接用 screen delta：

```
panBy(dx, dy):
  _scrollX += dx       ← 不是 dx / zoom
  _scrollY += dy
```

`setZoom` 不受影响，因为它是绝对值计算（zoom-to-pointer 公式）：

```
setZoom(newZoom, cx, cy):
  world = screenToWorld(cx, cy)     ← 缩放前世界点
  _zoom = newZoom
  _scrollX = cx - world.x * _zoom   ← 调整偏移使世界点保持在(cx,cy)下
```

**为什么 `.worldX` getter 不能直接返回 `_scrollX`？**

早期实现中 `.worldX` 直接返回 `_scrollX`。但这在 zoom 时跳跃——`setZoom` 重新计算 `_scrollX` 来保持缩放中心点不变，导致 `_scrollX` 变化，显示的世界坐标也跟着变，让用户误以为世界在移动。

修正后 `.worldX` 返回**视口中心的世界坐标**：

```
worldX = (viewportWidth / 2 - _scrollX) / zoom
```

这个值在 zoom 时保持不变（因为只有 `_scrollX` 变，分子分母配合抵消），只受平移影响。同理 `.onDrag` 回调现在传 `worldX/worldY`（视口中心），而不是 `_scrollX/_scrollY`。

> **注意**：`_scrollX` 仍然是内部唯一的"状态变量"。`worldX` 是派生值（derived state），不存储，每次 getter 计算。

#### 风险边界

#### 风险边界

**不要**对 SubCanvas 的 `stage` 做 PIXI transform（`scale` / `rotation` / `pivot`）。`globalBounds` 不感知 PIXI transform，事件坐标会偏。所有定位走 `_bounds`/`setPosition`。

如果需要视觉效果上的缩放/旋转（如过渡动画），在 `stage` 里包一层子 Container 操作，不要动 `stage` 本身。

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
     = ((cx - _scrollX) / _zoom, (cy - _scrollY) / _zoom)
  2. 应用缩放：_zoom = clamp(newZoom, min, max)
     worldContainer.scale.set(_zoom)
  3. 调整偏移使 worldPoint 保持在 (cx, cy) 下：
     _scrollX = cx - worldPoint.x * _zoom
     _scrollY = cy - worldPoint.y * _zoom
```

### InfiniteCanvas world 坐标修复记录

**问题**：`worldX`/`worldY` getter 返回了 `_scrollX`/`_scrollY`（世界容器在父 SubCanvas 中的屏幕像素偏移），而不是真正的世界坐标。zoom 时 `setZoom` 会重新计算 `_scrollX` 来保持缩放中心点不动，导致 `worldX`/`worldY` 跳跃，用户以为世界在动。

**修复**：`worldX`/`worldY` 改为返回 **视口中心在世界空间中的坐标**。由 `(viewportCenter - _scroll) / zoom` 计算，zoom 时不变（scroll 的变化被 zoom 抵消），只响应平移。

**波及修改**：
- `.worldX`/`.worldY` getter 语义变更（2026-07-19）
- `.onDrag` 回调参数从 `_scrollX`/`_scrollY` 改为 `worldX`/`worldY`（视口中心）
- 示例中 reset 从 `panTo(0,0) + setZoom(1)` 改为 `centerOn(0,0) + setZoom(1)`
- 内部 `_worldX/_worldY` 重命名为 `_scrollX/_scrollY`，明确其语义是屏幕像素偏移
- `panTo(x,y)` 标记为 `@deprecated`，推荐使用 `centerOn(worldX, worldY)`

**教训**：不要将内部状态变量直接暴露为"语义化" getter。派生值（derived state）应通过 getter 计算，内部状态变量用下划线前缀并用说明性命名（如 `_scrollX` 而非 `_worldX`）。

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

### textPresets 样式常量

框架在 `src/framework/ui-helpers.ts` 定义了一组统一样式常量，用于替代各处散落的内联 `PIXI.TextStyle`：

```typescript
export const textPresets = {
  btn:     { fontSize: 13, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
  label:   { fontSize: 11, fill: 0xaaaacc, fontFamily: 'monospace' },
  dim:     { fontSize: 11, fill: 0x888888, fontFamily: 'monospace' },
  coord:   { fontSize: 11, fill: 0x88aacc, fontFamily: 'monospace' },
  heading: { fontSize: 14, fill: 0xffffff, fontFamily: 'monospace' },
};
```

如需统一调整主题字体/颜色，只需修改 `textPresets` 中各字段的定义。`makeButton`、`makeStepper` 已使用 `textPresets.btn` / `textPresets.label`。外部代码可通过 `import { textPresets } from '../../framework'` 获取。

### 演进记录：2026-07-19 代码质量优化

**目标**：消除重复实现、统一导入规范、补齐 ComponentHandle 遗漏。

**修改列表**：

| 文件 | 变更 |
|------|------|
| `FullscreenManager.ts` | 接口补上 `readonly destroyed: boolean`，成为第 8 个完全符合 `ComponentHandle` 的组件 |
| `ComponentLifeMapDisplay.tsx` | 删除 61 行本地 `makeStepper` 重复实现；改用 `import { makeStepper } from '../../framework'` |
| `ClickableImage.ts` | 深导入 `../framework/SubCanvas` / `../framework/EventBus` → barrel `../framework` |
| 10 个 example 文件 | `../../framework/PixiApp` → `../../framework`（使用 barrel） |
| `ui-helpers.ts` | 新增 `textPresets` 样式常量，`makeButton`/`makeStepper` 改用 `textPresets.btn`/`textPresets.label` |

| 9 个外部文件 | 内联 `style` → `textPresets.dim` / `textPresets.coord` / `textPresets.heading` |
**强制约定**：所有 `src/example/` 和 `src/backend/` 代码**禁止**深导入 framework/components 内部模块。只能通过 `../../framework`（barrel）和 `../../components`（barrel）导入。已修复此前的 21 处违规。

### 演进记录：2026-07-19 拖拽响应优化

**问题**：
1. `component-infinite`：鼠标静止后松手，仍有惯性滑动
2. `component-window-canvas`：拖动响应不够极致

**定位**：
1. `DeceleratePlugin.onUp()` 只用 `_saved` 最后两个点算速度——如果浏览器在鼠标停住后没有产生 `pointermove`，最后两个采样来自用户还在移动时，速度不为零
2. `_syncChunks()` 在每次 `onMove` 都遍历全部 chunk（~12 个），即使 chunk 边界未变

**修改**：

| 文件 | 变更 |
|------|------|
| `InfiniteCanvas.ts DeceleratePlugin` | 新增 `_lastMoveTime` 追踪最后 `onMove` 时间；`onUp` 用 50ms 时间窗口算速度（比最后两帧采样更准确）；如果最后一次移动超过 50ms 前直接跳过减速 |
| `InfiniteCanvas.ts _syncChunks` | 新增 `_lastChunkRange` 缓存 (minCx/maxCx/minCy/maxCy)；每次先算范围对比，不变则直接 return；`destroy()` 时重置 |

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

## Text Effects — `text()` 一行动效

`text()` 是 `runTextEffect` 的便捷封装，一行创建文字动效。

```ts
import { text } from '../../framework';

text(canvas.stage, 'Hello World');                    // typewriter 默认
text(canvas.stage, 'Fade in', 'fadeInChars');         // 逐字淡入
text(stage, 'Big red', 'scaleBounce', {                // 弹性缩放
  fontSize: 32, fill: 0xff4444, x: 100, y: 200,
});
```

**参数：**

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `parent` | `PIXI.Container` | — | 父容器 |
| `text` | `string` | — | 显示文字 |
| `type` | `TextEffectType` | `'typewriter'` | 动效类型 |
| `opts.x` | `number` | `0` | X 偏移 |
| `opts.y` | `number` | `0` | Y 偏移 |
| `opts.maxWidth` | `number` | `Infinity` | 最大宽度（自动换行） |
| `opts.speed` | `number` | `30` | 打字速度（字符/秒） |
| `opts.duration` | `number` | `1` | 动画时长（秒） |
| `opts.fontSize` | `number` | `18` | 字号 |
| `opts.fill` | `number` | `0xffffff` | 文字颜色 |
| `opts.fontFamily` | `string` | `'monospace'` | 字体 |

**7 种动效：**

| 类型 | 效果 |
|------|------|
| `typewriter` | 逐字显示（打字机） |
| `fadeInChars` | 逐字淡入 |
| `fadeIn` | 整体淡入 |
| `slideIn` | 从左滑入 |
| `scaleBounce` | 弹性缩放 |
| `charRain` | 字符雨落下 |
| `scramble` | 随机打乱 → 正确文字 |

**返回 `TextEffectHandle`：**

- `.container` — PIXI 容器（可手动 reposition）
- `.completed` — boolean getter
- `.skip()` — 立即完成动画
- `.destroy()` — 销毁

底层 `runTextEffect(opts)` 接受完整选项：支持 `TextSegment[]` 图文混排。

---

## 已知问题

### 层违规

| 问题 | 详情 |
|------|------|
| `framework/register-components.ts` 导入 `components/` | `index.ts` 通过 `import './register-components'` 副作用导入。任何人 `import { x } from '@framework'` 都会**透传加载** `PixiWindow/PixiConfirm/Scrollable`。哪天某个 component 改用 `@framework` barrel 就会形成运行时循环依赖。 |
| `backend/WindowManager.ts` 导入 `components/` 和 `example/` | backend 层依赖 `createWindow`（components）和 `mountDisplays`（example）。生产代码不应依赖 demo 代码。 |

### 遗留导入路径（能跑，但指向旧来源）

拆分后部分文件仍从 `SubCanvas.ts` 导入原属于 `SubCanvasTypes.ts` 的类型。2026-07 已清理了 `SubCanvasProxy.ts`、`InfiniteCanvasTypes.ts`、`utils/rect.ts` 和 `index.ts` 的 barrel，但如果新文件也这样写需要注意。

## 部署

- push to `sim` → Cloudflare Pages 自动部署 → `https://react.moonchan.xyz/`
- CI: `.github/workflows/ci.yml` — lint → tsc → test → build
- 外部只 import `framework/index.ts` 和 `components/index.ts`，不做 deep import
