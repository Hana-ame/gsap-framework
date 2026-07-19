# Hana-ame Framework API 使用说明

基于 PixiJS v8 的视觉小说/交互式 Canvas 框架。

---

## 目录

1. [快速开始](#快速开始)
2. [核心概念](#核心概念)
3. [SubCanvas —— 区域划分系统](#subcanvas--区域划分系统)
4. [SubCanvasProxy —— 顶层入口](#subcanvasproxy--顶层入口)
5. [InfiniteCanvas —— 无限平移/缩放画布](#infinitecanvas--无限平移缩放画布)
6. [EventBus —— 事件总线](#eventbus--事件总线)
7. [组件系统](#组件系统)
8. [UI 组件](#ui-组件)
9. [Avd —— 视觉小说对话系统](#avd--视觉小说对话系统)
10. [Utility 工具](#utility-工具)
11. [Backend 后端系统](#backend-后端系统)
12. [Examples 示例](#examples-示例)

---

## 快速开始

```ts
import { startPixiApp, SubCanvasProxy } from './framework';

const cleanup = startPixiApp((proxy: SubCanvasProxy) => {
  const region = proxy.createRegion({ x: 0, y: 0, width: 800, height: 600 });
  // ... 在 region 上操作
});
// 调用 cleanup() 销毁
```

`startPixiApp` 是唯一入口，它：
1. 探测 WebGL
2. 创建 PIXI.Application
3. 挂载 canvas 到 document.body
4. 返回销毁函数

---

## 核心概念

- **SubCanvas**: 一个矩形区域容器，内建 AABB 点击路由、拖拽、裁剪、子区域嵌套。
- **SubCanvasProxy**: 顶层代理，持有 `PIXI.Application` 引用，管理顶层 SubCanvas。
- **InfiniteCanvas**: 无限平移/缩放画布，支持 chunk 懒加载、插件系统、惯性滑动。
- **EventBus**: 轻量级发布/订阅。
- **Component System**: 注册-工厂模式，让组件可以被字符串类型名创建。
- **UI Helpers**: 快速创建按钮、步进器、预设文字样式。
- **GSAP**: 预配置了 PixiPlugin 的 GSAP 动画库。

---

## SubCanvas —— 区域划分系统

### 构造函数

```ts
const sub = new SubCanvas({
  rootApp: app,               // PIXI.Application
  bounds: { x, y, width, height },
  parent?: SubCanvas | null,  // 父区域，自动挂载到 parent.stage
  clipToBounds?: boolean,     // 是否裁剪子内容
  dragMode?: 'title' | 'anywhere' | 'none',
  dragBounds?: () => Rect | null,
  dragBringToFront?: boolean,
  tapThreshold?: number,
  onDragStart, onDrag, onDragEnd,
  onDestroy?,
});
```

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `stage` | `PIXI.Container` | 容器的舞台，添加子元素用此对象 |
| `bounds` | `Rect` | 边界 `{x, y, width, height}` |
| `globalBounds` | `Rect` | 全局坐标系下的边界 |
| `parent` | `SubCanvas \| null` | 父区域 |
| `children` | `readonly PIXI.Container[]` | 直接子元素 |
| `subRegions` | `readonly SubCanvas[]` | 子 SubCanvas 列表 |
| `ticker` | `PIXI.Ticker` | 应用时钟 |
| `renderer` | `PIXI.Renderer` | 渲染器 |
| `canvas` | `HTMLCanvasElement` | 根 canvas |
| `x, y, rotation, angle, alpha, visible, scale, pivot, tint, eventMode, label` | 各种 | 透传到 stage 的快捷属性 |

### 方法

| 方法 | 说明 |
|------|------|
| `createRegion(bounds, opts?)` | 创建子 SubCanvas |
| `setBounds(rect)` | 设置边界 |
| `setPosition(x, y)` | 设置位置 |
| `setSize(w, h)` | 设置大小 |
| `bringToFront()` | 置顶（zIndex） |
| `sendToBack()` | 置底 |
| `addChild(child)` | 添加 PIXI 子元素 |
| `removeChild(child)` | 移除子元素 |
| `removeChildren()` | 移除所有子元素 |
| `destroy()` | 销毁自身及子区域 |
| `handlePointer(type, event)` | 处理指针事件（框架内使用） |

### 事件监听

返回 `this` 以支持链式调用。

```ts
sub
  .onPress((e: SubPointerEvent) => {})   // pointerdown
  .onMove((e: SubPointerEvent) => {})    // pointermove
  .onRelease((e: SubPointerEvent) => {}) // pointerup
  .onLeave((e: SubPointerEvent) => {})   // pointerleave
  .onTap((e: SubPointerEvent) => {})     // 点击（threshold 内无移动）
  .onResize((bounds: Rect) => {});       // 边界变化时
```

```ts
sub.offPointer(type, fn);  // 取消监听
```

`SubPointerEvent`:
```ts
{
  type: SubPointerType;
  x: number;        // 相对 SubCanvas 的局部坐标
  y: number;
  globalX: number;  // 屏幕坐标
  globalY: number;
  originalEvent: PointerEvent;
}
```

### 拖拽

支持两种模式：
- `'title'`: 只有 label 为 `'subcanvas-drag-handle'` 的子元素可拖拽
- `'anywhere'`: 点击区域任意位置拖拽
- `'none'`: 禁用

拖拽事件回调：`onDragStart`, `onDrag`, `onDragEnd`，参数 `{ x: number, y: number }`（子区域坐标）。

---

## SubCanvasProxy —— 顶层入口

```ts
const proxy = new SubCanvasProxy({ app: pixiApp });
```

### 属性/方法

| 方法 | 说明 |
|------|------|
| `bus` | `EventBus` 实例 |
| `canvas` | 根 canvas |
| `ticker` | 应用时钟 |
| `renderer` | 渲染器 |
| `stage` | PIXI 根舞台 |
| `createRegion(bounds)` | 创建顶层 SubCanvas |
| `getTopCanvases()` | 获取所有顶层 SubCanvas |
| `destroyAll()` | 销毁所有 |
| `onWindowResize(fn)` | 窗口 resize 监听（返回取消函数） |

---

## InfiniteCanvas —— 无限平移/缩放画布

无限画布由 chunk (瓦片) 组成，支持按需加载/卸载。

```ts
const infinite = new InfiniteCanvas({
  parent: subCanvas,
  viewport: { x: 0, y: 0, width: 800, height: 600 },
  chunkSize: 512,
  chunkCreate: (chunk: Chunk) => { /* 在 chunk.container 中添加内容 */ },
  chunkDestroy: (chunk: Chunk) => { /* 清理 */ },
  preloadMargin?: 1,       // 预加载边界（chunk 数量）
  decelerate?: true,       // 惯性滑动
  zoom?: 1,
  minZoom?: 0.1,
  maxZoom?: 10,
  onDrag?: (worldX, worldY) => void,
  onTap?: (worldX, worldY) => void,
});
```

### 属性

| 属性 | 说明 |
|------|------|
| `worldContainer` | 承载所有 chunk 的 PIXI.Container |
| `worldX / worldY` | 视口中心的世界坐标 |
| `zoom` | 当前缩放值 |
| `viewport` | 当前视口矩形 |
| `loadedChunkCount` | 已加载 chunk 数量 |
| `chunkSize` | 每块大小 |

### 方法

| 方法 | 说明 |
|------|------|
| `panBy(dx, dy)` | 平移（屏幕像素） |
| `panTo(x, y)` | 设置滚动偏移（屏幕像素，不推荐，用 centerOn） |
| `centerOn(worldX, worldY)` | 居中到世界坐标 |
| `setZoom(zoom, cx?, cy?)` | 设置缩放（可选指定中心点） |
| `setViewport(rect)` | 更新视口（resize 时） |
| `screenToWorld(sx, sy)` | 屏幕→世界坐标 |
| `worldToScreen(wx, wy)` | 世界→屏幕坐标 |
| `getChunkAt(cx, cy)` | 获取指定 chunk |
| `eachChunk(fn)` | 遍历所有已加载 chunk |
| `addPlugin(plugin)` | 添加插件 |
| `removePlugin(name)` | 移除插件 |
| `destroy()` | 销毁 |

### 插件系统

实现 `InfiniteCanvasPlugin` 接口：
```ts
interface InfiniteCanvasPlugin {
  name: string;
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

内置 `DeceleratePlugin`: 拖拽释放后的惯性滑动。

---

## EventBus —— 事件总线

```ts
const bus = new EventBus();

const unsub = bus.on('event-name', (payload) => {});
bus.off('event-name', handler);
bus.emit('event-name', payload);
bus.clear();
bus.listenerCount('event-name'); // number
```

---

## 组件系统

组件系统是工厂模式：按字符串类型名注册，通过工厂函数创建。

### 注册组件

```ts
import { registerComponent } from './framework';

registerComponent<MyOptions>('my-type', (opts) => ({
  type: 'my-type',
  stage: new PIXI.Container(),
  destroy() { /* 清理 */ },
  get destroyed() { return false; },
}));
```

### 使用组件

```ts
import { registeredTypes, createComponent, createComponentFromMap } from './framework';

const comp = createComponent('window', { parent, width: 400, height: 300, title: 'Hello' });
comp.stage   // PIXI.Container
comp.destroy();
```

### 预注册组件

| 类型名 | 创建选项 | 说明 |
|--------|----------|------|
| `'window'` | `GameWindowOptions` | 可拖拽窗口 |
| `'confirm'` | `PixiConfirmOptions` | 确认弹窗 |
| `'scrollable'` | `ScrollableOptions` | 可滚动容器 |

---

## UI 组件

### 游戏窗口 `createWindow`

```ts
const win = createWindow({
  parent: subCanvas,
  title: 'My Window',
  width: 400,
  height: 300,
  x?: 60, y?: 60,
  draggable?: true,
  dragMode?: 'title' | 'anywhere' | 'none',
  closable?: true,
  onClose?: () => void,
});

win.setTitle('New Title');
win.content    // 内容区域的 SubCanvas（标题栏下方）
```

返回类型 `GameWindow` 继承自 `SubCanvas`。

### 确认弹窗 `createConfirm`

```ts
const conf = createConfirm({
  parent: subCanvas,
  title: 'Confirm',
  message?: 'Are you sure?',
  image?: 'url',               // 显示图片替代文字
  imageMaxWidth?: number,
  imageMaxHeight?: number,
  width: 300,
  height: 200,
  draggable?: true,
  closable?: true,
  keepOpen?: boolean,          // 点击按钮不自动关闭
  okText?: 'OK',
  cancelText?: 'Cancel',
  buttons?: PixiConfirmButton[],  // 自定义按钮
  onResult?: (result, confirm) => void,
  onClose?: () => void,
});

conf.setTitle('...');
conf.setMessage('...');
conf.setImage('url');
conf.content;   // 内容 SubCanvas
```

`PixiConfirmButton`:
```ts
{
  label: string;
  onClick?: (confirm) => void;
  primary?: boolean;   // 高亮样式
  keepOpen?: boolean;  // 点击不关闭
}
```

`PixiConfirmResult`: `'ok' | 'cancel' | string`（按钮 label）。

### 滚动容器 `createScrollable`

```ts
const sc = createScrollable({
  parent: subCanvas,
  width: 300,
  height: 200,
  direction?: 'vertical' | 'horizontal',
  scrollbar?: true,
  accept?: { x?: number, y?: number },  // 初始滚动偏移
});

sc.content.addChild(somePixiNode);
sc.scrollTo(x, y);
sc.scrollBy(dx, dy);
sc.recalc();   // 重新计算内容尺寸
sc.sync();     // 刷新滚动条位置
```

### Loading 加载遮罩

```ts
const handle = createLoading(subCanvas, {
  text?: 'Loading...',
  spinnerColor?: 0xffffff,
  showSpinner?: true,
  overlayColor?: 0x000000,
  overlayAlpha?: 0.5,
});
handle.destroy();

// 快捷用法：
const hide = showLoading(subCanvas, 'loading...');
hide();
```

### 图片加载 `createLoadingImage`

```ts
const img = createLoadingImage(subCanvas, {
  url: 'image.png',
  x: 0, y: 0,
  width: 200, height: 200,
  maxWidth?: 200,       // 缩放限制
  maxHeight?: 200,
  placeholderText?: 'loading...',
  showErrorHint?: true,
  onLoad?: (texture) => void,
  onError?: (err) => void,
});

img.setUrl('new-url');
img.setErrorHintVisible(false);
img.destroy();
```

### 可点击图片 `createClickableImage`

```ts
const img = createClickableImage(parentSubCanvas, eventBus, {
  url: 'image.png',
  x: 0, y: 0,
  width: 200, height: 200,
  overlayColor?: 0x000000,
  overlayAlpha?: 0.6,
  zoomFactor?: 2,
});
```

点击后通过 `EventBus` 发送 `'fullscreen:show'` 事件，配合 `createFullscreenManager` 使用。

### 全屏管理器 `createFullscreenManager`

```ts
const fm = createFullscreenManager(proxy);
// 自动监听 bus 上的 'fullscreen:show' 事件
// 支持缩放、拖拽、双击缩放、下拉关闭
```

### 视频播放器 `createVideoPlayer`

```ts
const player = createVideoPlayer(subCanvas, {
  url: 'video.mp4',
  x?: 0, y?: 0,
  width: 640,
  height: 360,
  loop?: false,
  muted?: true,
  autoplay?: false,
  showControls?: true,
  hidePlayButton?: false,
  onLoad?: () => void,
  onError?: (e) => void,
  onEnded?: () => void,
});

player.play();
player.pause();
player.toggle();
player.seek(time);
player.setControlsVisible(true);
player.destroy();
player.paused   // boolean
player.duration // number
player.currentTime // number
```

---

## Avd —— 视觉小说对话系统

### Avd 类

```ts
const avd = new Avd(parentContainer, screenW, screenH, ticker, options);

avd.setScript(lines: AvdLine[]);
avd.next();           // 推进对话（等同于点击）
avd.goTo(index);      // 跳转到指定行
avd.setTypewriterSpeed(charsPerSec);
avd.setRoster(roster);
avd.setRosterMode('speaker-only' | 'persistent');
avd.applyOptions(partial);
avd.destroy();

avd.getState();       // 'typing' | 'between' | 'done'
avd.getLineIndex();
avd.getLineCount();
avd.getRoster();
avd.getRosterMode();
```

### AvdLine

```ts
{
  speaker?: string;
  text: string | AvdTextSegment[];  // 纯文本或富文本段
  portrait?: PIXI.Texture | null;
  portraitPos?: 'left' | 'right' | 'center';
}
```

### AvdTextSegment（富文本）

```ts
// 纯文本段
{ kind: 'text', text: string }
// 图片段
{ kind: 'image', texture: PIXI.Texture, width?: number, height?: number }
```

### AvdOptions

| 选项 | 默认 | 说明 |
|------|------|------|
| `boxWidth/boxHeight` | auto | 对话框宽高 |
| `boxX/boxY` | auto | 对话框位置 |
| `boxBg` | `0x0a0a1e` | 对话框背景色 |
| `boxBgAlpha` | 0.92 | 背景透明度 |
| `boxRadius` | 12/10 | 圆角 |
| `textColor/textSize` | `0xffffff`/24 | 文字颜色/大小 |
| `fontFamily` | `'sans-serif'` | 字体 |
| `typewriterSpeed` | 30 | 打字机速度（字符/秒） |
| `nameColor/nameSize` | `0x88ccff`/22 | 说话人名字颜色/大小 |
| `portraitMaxH` | auto | 立绘最大高度 |
| `portraitY` | auto | 立绘 Y 位置 |
| `portraitFadeMs` | 300 | 立绘淡入时间 |
| `arrowColor` | `0x88ccff` | 继续箭头颜色 |
| `boxEnterMs` | 400 | 对话框入场动画时间 |
| `boxEnterOffsetY` | 80 | 入场偏移 |
| `onLineEnter` | - | 进入每行时回调 |
| `onLineExit` | - | 离开每行时回调 |
| `onComplete` | - | 全部对话完成回调 |

### AvdRoster（演职员表）

```ts
const roster: AvdRoster = {
  '角色名': { pos: 'left', texture: texture },
};
avd.setRoster(roster);
```

两种模式：
- `'speaker-only'`: 只说活的人显示立绘
- `'persistent'`: 所有角色立绘常驻，当前说话者高亮

### AvdScript —— JSON 剧本解析

剧本 JSON 格式：
```json
{
  "meta": { "boxWidth": 920, "boxHeight": 200, "typewriterSpeed": 40 },
  "roster": {
    "角色A": { "pos": "left", "textureKey": "char_a" }
  },
  "lines": [
    { "speaker": "角色A", "text": "你好！" },
    { "text": "旁白" },
    {
      "text": [
        { "kind": "text", "text": "这是一张图片：" },
        { "kind": "image", "textureKey": "item_icon", "width": 32, "height": 32 }
      ]
    }
  ]
}
```

```ts
import { parseAvdScriptJSON } from './components';

const parsed = await parseAvdScriptJSON(json, {
  loadTexture: async (key) => await PIXI.Assets.load(`textures/${key}.png`),
});

avd.setScript(parsed.lines);
avd.setRoster(parsed.roster);
avd.setRosterMode(parsed.rosterMode);
```

---

## Utility 工具

### Math (`framework/utils/math.ts`)

| 函数 | 说明 |
|------|------|
| `clamp(v, min, max)` | 钳制 |
| `lerp(a, b, t)` | 线性插值 |
| `invLerp(a, b, v)` | 逆线性插值 |
| `mapRange(v, inMin, inMax, outMin, outMax)` | 范围映射 |
| `degToRad(deg)` / `radToDeg(rad)` | 角度弧度互转 |
| `distance(x1,y1,x2,y2)` / `distanceSq` | 距离 |
| `normalizeAngle(rad)` | 归一化角度 |
| `snapToGrid(v, size)` | 格点对齐 |
| `randomInt(min, max)` / `randomFloat(min, max)` | 随机数 |

### Color (`framework/utils/color.ts`)

| 函数 | 说明 |
|------|------|
| `hexToRgb(hex)` / `rgbToHex(r,g,b)` | hex↔RGB |
| `rgbaToHex(r,g,b,a)` / `hexToRgba(hex)` | hex↔RGBA |
| `parseHexString('#fff')` | 字符串解析 |
| `formatHexString(color)` | 格式化为 `#rrggbb` |
| `blendColors(a, b, t)` | 颜色混合 |
| `alphaBlend(fg, bg)` | Alpha 混合 |
| `luminance(c)` / `isLight(c)` | 亮度判断 |
| `contrastTextColor(bg)` | 对比色（黑/白） |

### Rect (`framework/utils/rect.ts`)

| 函数 | 说明 |
|------|------|
| `rectContains(rect, x, y)` | 点是否在矩形内 |
| `rectIntersects(a, b)` | 矩形是否相交 |
| `rectCenter(rect)` | 矩形中心 |
| `rectExpand(rect, amount)` / `rectShrink` | 扩大/缩小 |
| `rectFit(outer, w, h, contain?)` | 适应矩形（contain/cover） |
| `rectClamp(child, parent)` | 将子矩形钳制在父矩形内 |
| `rectSnap(rect, gridSize)` | 对齐到格点 |

### UI Helpers (`framework/ui-helpers.ts`)

```ts
const btn = makeButton('Click', 80, 28, onClick, 0x1a1a2e);
// 返回 PIXI.Container（Graphics + Text）

const stepper = makeStepper('Size', () => value, onChange, 1, 100);
// 返回 { container, width, refresh }
```

预置文字样式：
```ts
import { TXT } from './framework';
TXT.btn    // 按钮文本
TXT.label  // 标签
TXT.dim    // 灰暗文本
TXT.coord  // 坐标文本
TXT.heading // 标题
```

---

## Backend 后端系统

用于窗口管理和内容流式传输。

### MockBackend

```ts
const backend = new MockBackend();
backend.connect();
backend.sendCommand({ id, type, payload, timestamp });
backend.on('command', handler);
backend.on('status', handler);
backend.on('error', handler);
backend.disconnect();
```

### WindowManager

```ts
const wm = new WindowManager(proxy);
wm.execute(command);  // 执行 BackendCommand
```

支持的命令类型：
- `'open-window'` / `'close-window'`
- `'move-window'` / `'resize-window'`
- `'set-title'` / `'set-content'`
- `'stream-content'` / `'clear-content'`
- `'hide-window'` / `'show-window'`
- `'focus-window'`
- `'ping'`

### ContentChannel

```ts
const channel = new ContentChannel(proxy, windowId);
channel.setContent(spec);
channel.streamChunk(chunk);
channel.clear();
```

---

## GSAP

预配置 PixiPlugin 的 GSAP：

```ts
import { gsap } from './framework';

gsap.to(sprite, {
  pixi: { x: 100, y: 200, scale: 1.5, alpha: 0.5 },
  duration: 1,
  ease: 'power2.out',
});
```

无需额外注册，框架已内置 `PixiPlugin.registerPIXI(PIXI)`。

---

## Examples

项目包含 40+ 示例，位于 `src/example/`。

### 运行

```bash
npm run dev
```

### 示例列表

| 示例名 | 说明 |
|--------|------|
| `single` | 单个 SubCanvas + 指针事件 |
| `multiple` | 多个 SubCanvas 事件路由 |
| `window` | 游戏窗口（可拖拽、关闭） |
| `window-mobile` | 移动端自适应窗口 |
| `pixi-confirm` | 确认弹窗 |
| `component-window` | 通过组件系统创建窗口 |
| `component-confirm` | 通过组件系统创建确认框 |
| `component-image` | 图片加载组件 |
| `component-loading` | 加载遮罩 |
| `component-bus` | EventBus 使用示例 |
| `component-scrollable` | 滚动容器 |
| `component-clickable-image` | 可点击图片 + 全屏查看 |
| `component-scrollable-image` | 可滚动的图片墙 |
| `component-picture-drag` | 图片拖拽 |
| `component-video-player` | 视频播放器 |
| `component-video-player-dom` | 基于 DOM 的视频播放 |
| `component-cutscene` | 过场动画 |
| `component-infinite` | 无限画布 |
| `component-gsap` | GSAP 动画 |
| `component-avd` | 视觉小说对话系统 |
| `component-2048` | 2048 小游戏 |
| `component-conway` | 康威生命游戏 |
| `component-breakout` | 打砖块 |
| `component-snake` | 贪吃蛇 |
| `component-tetris` | 俄罗斯方块 |
| `component-minesweeper` | 扫雷 |
| `component-starfield` | 星空粒子 |
| `component-waves` | 波浪效果 |
| `component-clock` | 模拟时钟 |
| `component-typing-effect` | 打字机效果 |
| `component-filters` | PIXI 滤镜演示 |
| `component-particle-rain` | 粒子雨 |
| `component-audio-viz` | 音频可视化 |
| `component-drawing` | 绘图板 |
| `component-registry` | 组件注册系统 |
| `component-multi-window` | 多窗口管理 |
| `component-window-canvas` | 窗口内画布 |
| `component-tutorial` | 教程系统 |
| `component-single-window` | 单窗口应用 |
| `component-backend-controlled` | 后端控制窗口 |
| `component-life-map` | 人生地图 |
| `component-colony` | 群体模拟 |
| `component-cutscene-minimal` | 极简过场动画 |

---

## 类型定义

### Rect

```ts
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### SubPointerEvent

```ts
interface SubPointerEvent {
  type: SubPointerType;
  x: number;        // 相对 SubCanvas 局部
  y: number;
  globalX: number;  // 屏幕
  globalY: number;
  originalEvent: PointerEvent;
}
```

### Component / ComponentHandle

```ts
interface Component<T = ComponentOptions> {
  readonly type: string;
  readonly stage: PIXI.Container;
  destroy(): void;
  readonly destroyed: boolean;
}

interface ComponentHandle {
  readonly stage: PIXI.Container;
  destroy(): void;
  readonly destroyed: boolean;
}
```
