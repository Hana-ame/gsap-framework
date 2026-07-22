# GSAP Framework

基于 PIXI v8 的游戏 UI 框架，动画引擎使用 GSAP。

`SubCanvas` 是核心概念——共享 `PIXI.Application` 画布上的一个区域，拥有独立的边界、事件路由、生命周期和拖拽行为。通过嵌套 SubCanvas 构建复杂 UI，每个 SubCanvas 可容纳任意 PIXI 内容。

## 安装

```sh
npm install pixi.js gsap
```

## 快速开始

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

  win.content.stage.addChild(/* 任意 PIXI display object */);
});
```

## 特性

| | |
|---|---|
| **SubCanvas** | 基于区域的画布细分，递归事件路由，拖拽（`title` / `anywhere` / `none`） |
| **LayerManager** | 命名 z-order 层——对 PIXI.Container + zIndex 的零开销封装 |
| **InfiniteCanvas** | 基于插件的无限平移/缩放画布，支持分块懒加载、惯性减速、zoom-to-pointer |
| **Component factories** | `createWindow` / `createConfirm` / `createScrollable`——直接工厂调用，无注册间接层 |
| **EventBus** | 跨组件通信的发布-订阅——解耦、类型安全、可安全取消订阅 |
| **GSAP 集成** | PixiPlugin 预注册，直接使用 `gsap.to(obj, { pixi: { ... } })` |
| **textPresets** | 集中管理 `textPresets.btn`、`textPresets.label`、`textPresets.dim`、`textPresets.coord`、`textPresets.heading` |
| **PerfDisplay** | 屏幕上的 FPS/帧时间/对象数 HUD |
| **后端控制** | `MockBackend` + `WindowManager` + `ContentChannel`——通过命令协议实现后端驱动 UI |
| **组件** | Window / Confirm / Scrollable / Loading / Image / ClickableImage / FullscreenManager / TextInput / VideoPlayer / AVD |
| **AVD 框架** | `DialogueStateMachine` / `TypingEngine` / `RosterManager` / `DialogueBox` / `PortraitLayer` / `AvdController` |

## 目录结构

```
src/
  framework/    SubCanvas, InfiniteCanvas, EventBus, LayerManager, GSAP, PerfDisplay, UI helpers
  avd/          DialogueStateMachine, TypingEngine, RosterManager, DialogueBox, PortraitLayer, AvdController, AvdScript
  components/   Window, Confirm, Scrollable, Loading, Image, FullscreenManager, VideoPlayer, AVD, TextInput
  backend/      MockBackend + WindowManager + ContentChannel (后端驱动 UI 控制)
  example/      50 条路由展示所有功能
```

---

## SubCanvas

画布细分的原子单位。每个 SubCanvas 拥有独立的 PIXI.Container（`stage`），以及独立的边界、事件路由和拖拽行为。

### 创建 SubCanvas

```ts
// 全视口根节点
const root = proxy.createRegion({ x: 0, y: 0, width: 800, height: 600 });

// 嵌套子区域
const panel = root.createRegion({ x: 10, y: 10, width: 200, height: 300 }, {
  dragMode: 'title',      // 'title' | 'anywhere' | 'none'
  dragBounds: () => root.bounds,
  dragBringToFront: true,
  tapThreshold: 4,
});
```

### 指针事件

```ts
region.onPress((e: SubPointerEvent) => { /* pointerdown */ });
region.onMove((e: SubPointerEvent) => { /* pointermove */ });
region.onRelease((e: SubPointerEvent) => { /* pointerup */ });
region.onTap((e: SubPointerEvent) => { /* 点击（非拖动） */ });
region.onLeave((e: SubPointerEvent) => { /* pointerleave */ });
region.offPointer('pointermove', fn);
```

`SubPointerEvent` 字段：`type`、`x`、`y`（区域本地坐标）、`globalX`、`globalY`（客户端坐标）、`originalEvent`。

### 生命周期 & 变换

```ts
region.setBounds({ x, y, width, height });  // 位置 + 大小
region.setPosition(x, y);                    // 仅位置
region.setSize(width, height);               // 仅大小
region.bringToFront();
region.sendToBack();
region.destroy();
region.destroyed;                            // boolean

// PIXI 风格快捷属性
region.x; region.y; region.scale; region.rotation;
region.alpha; region.visible; region.tint;
region.eventMode; region.label;
```

### 拖拽模式

| 模式 | 行为 |
|---|---|
| `'title'` | 只能通过 `label === 'subcanvas-drag-handle'` 的子元素拖拽 |
| `'anywhere'` | 点击区域内任意位置拖拽 |
| `'none'` | 禁止拖拽 |

拖拽处理器挂在**窗口级**的 `pointermove`/`pointerup` 上以确保可靠性（指针离开画布时事件仍能触发）。内置边界约束和拖拽开始时自动 `bringToFront`。

拖拽期间，后续的 `pointermove`/`pointerup`/`pointerleave` 会被拖拽中的 SubCanvas **消费**掉——兄弟区域（例如窗口背后的 InfiniteCanvas）不会收到这些事件。这防止了"拖拽穿透"问题（拖动窗口时也平移了底层的画布）。

### 拖拽回调

```ts
root.createRegion(bounds, {
  onDragStart: (e) => { /* 拖拽开始 */ },
  onDrag: (e) => { /* 位置改变 */ },
  onDragEnd: (e) => { /* 拖拽结束 */ },
});
```

### 层级组合

```ts
const parent = root.createRegion({ x: 0, y: 0, width: 400, height: 300 });
const child = parent.createRegion({ x: 20, y: 20, width: 100, height: 80 });
// 事件按层级路由。parent.onPress 和 child.onPress 都能正确触发。
```

### 尺寸变化监听

```ts
region.onResize((bounds: Rect) => {
  // setBounds/setSize 触发时调用（画布 resize 有 80ms 防抖）
});
```

---

## 组件

所有 PIXI 内容位于 `src/components/`。每个组件遵循 `ComponentHandle` 契约：`{ stage, destroy(), destroyed }`。

### 窗口——`createWindow`

带标题栏的可拖拽窗口，支持关闭按钮和内容 SubCanvas。

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
win.content.stage.addChild(sprite);  // 在内层区域添加内容
win.destroy();
```

**返回类型**：`GameWindow`（继承 `SubCanvas`）。拥有 SubCanvas 全部方法 + `setTitle()` 和 `.content`（内层 SubCanvas）。

### 确认框——`createConfirm`

带标题、消息、可选图片和可配置按钮的模态对话框。

```ts
import { createConfirm } from '../components';

const confirm = createConfirm({
  parent: root,
  title: 'Delete?',
  message: 'Are you sure?',
  width: 300, height: 180,
  okText: 'Yes',
  cancelText: 'No',
  onResult: (res) => console.log(res),  // 'ok' | 'cancel' | 按钮标签
  // 自定义按钮：
  buttons: [
    { label: 'Save', primary: true, onClick: (c) => c.destroy() },
    { label: 'Discard', onClick: (c) => c.destroy() },
  ],
});

confirm.setTitle('New Title');
confirm.setMessage('Updated message');
confirm.setImage('https://example.com/pic.jpg');
```

### 滚动容器——`createScrollable`

带遮罩的滚动容器，支持拖拽滚动、鼠标滚轮和可选滚动条。

```ts
import { createScrollable } from '../components';

const sc = createScrollable({
  parent: root,
  width: 300, height: 400,
  direction: 'vertical',    // 'vertical' | 'horizontal'
  scrollbar: true,
});

// 向滚动区域添加内容（不是直接操作 stage）
sc.content.addChild(tallContent);

// 编程控制
sc.scrollTo(0, 100);
sc.scrollBy(0, -20);
sc.recalc();     // 重新计算内容边界
```

### 加载动画——`showLoading` / `createLoading`

带可配置文字和颜色的旋转加载覆盖层。

```ts
import { showLoading, createLoading } from '../components';

// 一次性加载（超时后自动消失）
const dismiss = showLoading(root);
setTimeout(dismiss, 2000);

// 自定义选项
showLoading(root, {
  text: 'Loading...',
  spinnerColor: 0x44ff88,
  overlayAlpha: 0.7,
});

// 持久化句柄（ComponentHandle — stage / destroy / destroyed）
const loader = createLoading(root);
// 要更新文字，销毁后重新创建
loader.destroy();
```

### 图片——`createLoadingImage`

带加载旋转、成功状态和错误占位的图片加载器。

```ts
import { createLoadingImage } from '../components';

const img = createLoadingImage({
  parent: root,
  url: 'https://example.com/image.jpg',
  x: 0, y: 0,
  width: 200, height: 150,
});

// 替换 URL
img.load('https://other.com/pic.jpg');
img.destroy();
```

### ClickableImage——`createClickableImage`

点击后在全屏查看器中打开的缩略图。

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

### VideoPlayer（视频播放器）

两种变体：

**PIXI 渲染**（`PixiVideoPlayer`）：

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

**React DOM**（`VideoPlayer` 组件）：

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

### TextInput（文本输入）

HTML `<input>` 覆盖在画布上，通过 `requestAnimationFrame` + `getBounds()` 定位。

```ts
import { createTextInput } from '../components';

const input = createTextInput(parent.stage, {
  x: 40, y: 100,
  width: 300, height: 34,
  placeholder: '输入内容…',
  password: false,
  maxLength: 20,
  onChange: (v) => console.log(v),
  onSubmit: (v) => console.log('提交：', v),
});

input.focus();
input.blur();
input.getValue();     // string
input.setValue('hi');
input.setEnabled(false);
input.destroy();
```

不可见覆盖层捕获点击；聚焦时 GSAP 淡入原生 `<input>`。PIXI container 需要 `eventMode = 'static'` + `hitArea` + `cursor = 'text'`。

### FullscreenManager（全屏查看器）

通过 EventBus 触发的全视口图片查看器。

```ts
import { createFullscreenManager } from '../components';

const fm = createFullscreenManager(proxy);

// 通过 EventBus 随处触发
proxy.bus.emit('fullscreen:show', {
  url: 'image.jpg',
  title: 'Photo',
  overlayColor: 0x000000,
  overlayAlpha: 0.6,
  zoomFactor: 2,
});
```

支持双击缩放、拖拽平移（缩放后）、下滑关闭。

### AVD——视觉小说引擎

基于脚本的对话系统，支持打字机文字、角色立绘、淡入淡出过渡。

```ts
import { Avd, parseAvdScriptJSON } from '../components';

const avd = new Avd(stage, screenW, screenH, ticker);

avd.setScript([
  { speaker: 'Narrator', text: '从前……' },
  { speaker: 'Hero', text: '你好！', portrait: heroTexture, portraitPos: 'left' },
]);

avd.next();               // 前进到下一行
avd.goTo(0);              // 跳转到指定行
avd.setTypewriterSpeed(30); // 字符/秒
avd.getState();           // 'typing' | 'between' | 'done'
avd.destroy();
```

选项控制对话框尺寸、颜色、字体、立绘布局、淡入时长。详见 `AvdOptions`（所有字段可选，智能默认值）。

从 JSON 解析：

```ts
const script = parseAvdScriptJSON(jsonString, (assetName) => textureMap[assetName]);
avd.setScript(script);
```

### AVD 框架——`src/avd/`

独立的视觉小说对话框架层，构建在 `framework/` 之上。由可独立测试的模块组成，替代了原有的单体 `components/Avd`。

| 模块 | 职责 |
|--------|---------------|
| `DialogueStateMachine` | typing → between → done 状态机（零 PIXI 依赖） |
| `TypingEngine` | 逐帧字符揭示，使用 `framework/text-effects-layout` |
| `RosterManager` | 角色表数据 + 高亮逻辑（零 PIXI 依赖） |
| `DialogueBox` | 背景框 + 说话人名字 + 箭头渲染 |
| `PortraitLayer` | 立绘渲染，支持 fade / setAll 批量模式 |
| `AvdController` | 轻量编排器，连接所有模块 |
| `AvdScript` | JSON 脚本解析器，支持并行纹理加载 |

```ts
import { AvdController } from '../avd';

const avd = new AvdController(parentContainer, ticker, {
  screenW: 800, screenH: 600,
});

avd.setScript([
  { speaker: 'Narrator', text: '...' },
  { speaker: 'Hero', text: 'Hello!' },
]);
avd.next();                    // 推进/完成打字机
avd.setTypewriterSpeed(60);
avd.getState();                // 'typing' | 'between' | 'done'
avd.setRoster({ Alice: { pos: 'left', texture: tex } });
avd.setRosterMode('persistent');
avd.destroy();
```

与旧版 `components/Avd` 相比：
- **TypingEngine** 复用 `text-effects-layout.buildLayout`（消除了 `AvdInlineLayout` 重复）
- **DialogueStateMachine** 纯逻辑——无需 PIXI 即可测试
- **RosterManager** 将角色表数据与渲染解耦
- **PortraitLayer.setAll()** 一次批量调用处理持久模式

---



## InfiniteCanvas

基于插件的无限平移/缩放画布。世界被划分为固定大小的块（chunk），按需加载/卸载。

### 基本用法

```ts
import { InfiniteCanvas, type Chunk } from '../framework';

const ic = new InfiniteCanvas({
  parent: subCanvas,
  viewport: { x: 0, y: 0, width: 600, height: 400 },
  chunkSize: 200,
  chunkCreate: ({ cx, cy, container }: Chunk) => {
    // 块进入视口时绘制内容
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

### 方法

| 方法 | 用途 |
|---|---|
| `panBy(dx, dy)` | 按屏幕像素平移 |
| `panTo(x, y)` | 跳转到世界坐标（已废弃，推荐用 `centerOn`） |
| `centerOn(wx, wy)` | 将视口中心定位到世界坐标 |
| `setZoom(z, cx?, cy?)` | 缩放，可选锚定到屏幕点 (cx, cy) |
| `screenToWorld(sx, sy)` | 屏幕坐标 → 世界坐标转换 |
| `worldToScreen(wx, wy)` | 世界坐标 → 屏幕坐标转换 |
| `setViewport(rect)` | 更新视口尺寸 |
| `getChunkAt(cx, cy)` | 按网格索引获取已加载的块 |
| `eachChunk(fn)` | 遍历所有已加载的块 |

### 属性

| 属性 | 返回值 |
|---|---|
| `worldX`, `worldY` | 视口中心在世界空间中的坐标（缩放期间稳定） |
| `zoom` | 当前缩放级别 |
| `viewport` | 当前视口 Rect |
| `loadedChunkCount` | 已加载的块数量 |
| `destroyed` | 布尔值 |

### 插件

通过 `InfiniteCanvasPlugin` 扩展行为：

```ts
const myPlugin: InfiniteCanvasPlugin = {
  name: 'grid-overlay',
  priority: 10,
  onTap(worldX, worldY) { console.log('tapped', worldX, worldY); },
  onUpdate(elapsed) { /* 每帧逻辑 */ },
  onDestroy() { /* 清理 */ },
};

ic.addPlugin(myPlugin);
ic.removePlugin('grid-overlay');
```

内置插件：`DeceleratePlugin`（惯性滑动），默认启用（`decelerate: true`）。

### 性能

- 块仅在可见块范围变化时同步（`_lastChunkRange` 缓存避免每次拖拽像素遍历 O(n)）
- 减速速度基于 50ms 时间窗口计算（避免鼠标松开前静止时产生幻影甩动）

---

---

## EventBus

类型安全的发布-订阅。

```ts
import { EventBus } from '../framework';

const bus = new EventBus();

const unsub = bus.on('item:click', (payload: { id: string }) => {
  console.log('clicked', payload.id);
});

bus.emit('item:click', { id: 'sword' });
unsub();  // 移除监听器
bus.clear();  // 移除全部
bus.listenerCount('item:click');  // 处理器数量
```

约定：事件带命名空间（`component:action`）。处理器按注册顺序调用。处理器中的错误会被捕获并记录（单个处理器异常不会影响其他处理器）。

## LayerManager

命名 z-order 层——对 PIXI.Container + zIndex 的零开销封装。

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

## GSAP 集成

PixiPlugin 在 import 时自动注册。旋转使用**度**。

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

## textPresets——样式常量

`ui-helpers.ts` 中的集中文本样式预设。

```ts
import { textPresets } from '../components';

// 可用的预设：
textPresets.btn      // { fontSize: 12, fill: 0xccccee, fontFamily: 'monospace', fontWeight: 'bold' }
textPresets.label    // { fontSize: 11, fill: 0x8888aa, fontFamily: 'monospace' }
textPresets.dim      // { fontSize: 10, fill: 0x556688, fontFamily: 'monospace' }
textPresets.coord    // { fontSize: 10, fill: 0x6688aa, fontFamily: 'monospace' }
textPresets.heading  // { fontSize: 14, fill: 0x8888cc, fontFamily: 'monospace', fontWeight: 'bold' }

new PIXI.Text({ text: 'Hello', style: textPresets.label });
```

## PerfDisplay

屏幕上的 FPS/帧时间/对象数 HUD。根 PerfDisplay 由 `startPixiApp` 自动创建。

```ts
import { startPixiApp } from '../framework';

const stop = startPixiApp((proxy) => {
  proxy.showPerfMeasure(true);  // 显示 HUD
  proxy.showPerfMeasure(false); // 隐藏
});

// 从任意位置切换：
import { enablePerfMeasure, disablePerfMeasure } from '../framework';
enablePerfMeasure();
disablePerfMeasure();
```

## makeInfoPanel

所有示例路由中使用的高亮信息面板。

```ts
import { makeInfoPanel } from '../components';

makeInfoPanel(root, {
  title: 'Example',
  lines: ['Description of the feature being demonstrated.'],
  x: 14, y: 14,
  maxWidth: 360,
});
```

## 后端驱动 UI

MockBackend + WindowManager + ContentChannel——通过编程控制界面。

```
MockBackend (JS 命令)
    ↓
WindowManager (缓冲层 — 窗口生命周期)
    ├── 创建/关闭/移动/调整窗口
    └── 将内容路由到窗口
ContentChannel (WS 流式内容)
    ↓
Framework API → PIXI 渲染
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

命令：`open-window`、`close-window`、`move-window`、`resize-window`、`set-window-content`、`focus-window`。

## 通信模式

| 方式 | 适用场景 |
|---|---|
| **EventBus** | 松散耦合、跨组件、多窗口 |
| **直接调用** | 紧密耦合、单组件内父子关系 |
| **GSAP 时间线** | 相关元素之间的动画序列 |

## 二次开发指南

### 添加新组件

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

从 `src/components/index.ts` 导出。

### 编码规范

- **导入**：外部代码只从 `framework/index.ts` 和 `components/index.ts` 导入——不做深层导入
- **Ticker**：动画使用 GSAP；PIXI.Ticker 仅用于物理模拟
- **性能**：将昂贵的边界重算与轻量级视图同步分离
- **拖拽**：始终将 PIXI 指针事件与 `window.addEventListener('pointermove', ...)` 后备方案配对使用
- **销毁**：始终在异步回调中检查 `destroyed` 守卫

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

## 已知问题

### 层违规

| 问题 | 详情 |
|-------|---------|
| `backend/WindowManager.ts` 从 `components/` 和 `example/` 导入 | 后端层 (`src/backend/`) 依赖了来自 `components/` 的 `createWindow` 和来自 `example/` 的 `mountDisplays`。生产代码不应依赖演示代码。 |

## 参考文档

- `docs/exmoonchan-migration.md` — ExMoonchan H-scene 纯 DOM 迁移范式

## 版本升级

每次升版本号时，需要改以下地方：

| # | 位置 | 改什么 |
|---|------|--------|
| 1 | `package.json` | `"version": "x.y.z"` |
| 2 | `git checkout main && git merge --no-ff sim -m "merge sim into main"` | 把 `sim` 合入 `main` |
| 3 | `git tag vx.y.z` | 在 `main` 上打 tag |

## 部署

Push 到 `sim` → Cloudflare Pages → `https://react.moonchan.xyz/`

CI: `.github/workflows/ci.yml` — lint → tsc → test → build
