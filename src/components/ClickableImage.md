# ClickableImage — `createClickableImage`

可点击的图片缩略图。加载图片 → 显示缩略图 → 点击后通过 `EventBus` 发送 `'fullscreen:show'` 事件给 `FullscreenManager`。

不与全屏交互直接管理 —— 展开 / 缩放 / 拖动 / 关闭全部由 `FullscreenManager` 统一处理。

---

## 调用栈

### 创建
```
createClickableImage(parent, bus, opts)
  ├─ new PIXI.Container()                  // this.stage
  ├─ stage.position.set(opts.x, opts.y)
  ├─ stage.eventMode = 'static'
  ├─ stage.hitArea = 缩略图尺寸 Rect
  ├─ parent.stage.addChild(stage)          // 挂到子画布
  ├─ 创建 placeholder (Graphics + Text)
  │    stage.addChild(placeholder)
  │    stage.addChild(placeholderText)
  ├─ stage.on('pointerdown', handler)       // 点击事件
  └─ load(opts.url)                         // 异步加载

load(url)
  ├─ PIXI.Assets.load(url)
  │    .then(texture => {
  │      ├─ 销毁 placeholder
  │      ├─ 创建 sprite (anchor=0.5, 居中, fit-to-thumb)
  │      ├─ stage.addChild(sprite)
  │      ├─ loadedTexture = texture
  │      └─ stage.hitArea = 缩略图尺寸 (保留)
  │    })
  │    .catch(() => {})
  └─ 15s timeout 不在 ClickableImage 里做
     （图片加载超时由 PixiImage/PixiApp 全局控制）
```

### 点击 → 发送全屏事件
```
pointerdown on stage
  ├─ if (!loadedTexture) return            // 未加载完不响应
  ├─ gb = parent.globalBounds              // 缩略图所在子画布的全局偏移
  ├─ 构建 FullscreenShowEvent:
  │    texture = loadedTexture
  │    thumbGlobalX/Y = gb + opts.x/y
  │    thumbW/H = opts.width/height
  │    overlayColor/Alpha 透传 opts
  │    zoomFactor 透传 opts
  └─ bus.emit('fullscreen:show', ev)       // 交给 FullscreenManager
```

### 销毁
```
thumbnail.destroy()
  ├─ stage.parent.removeChild(stage)
  ├─ stage.destroy({ children: true })
  └─ destroyed = true
```

---

## API

### `createClickableImage`

```ts
function createClickableImage(
  parent: SubCanvas,
  bus: EventBus,
  opts: ClickableImageOptions,
): ClickableImage
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `parent` | `SubCanvas` | 父级子画布（缩略图挂到它的 stage 上） |
| `bus` | `EventBus` | `SubCanvasProxy.bus` — 用于发送全屏事件 |
| `opts` | `ClickableImageOptions` | 见下方 |

### ClickableImageOptions

```ts
interface ClickableImageOptions {
  url: string;                     // 图片 URL（PIXI.Assets.load）
  x: number;                       // 缩略图在 parent 中的 X
  y: number;                       // 缩略图在 parent 中的 Y
  width: number;                   // 缩略图宽度
  height: number;                  // 缩略图高度
  overlayColor?: number;           // 透传给 FullscreenManager，默认 0x000000
  overlayAlpha?: number;           // 透传，默认 0.6
  zoomFactor?: number;             // 透传，默认 2
}
```

### ClickableImage

```ts
interface ClickableImage {
  readonly stage: PIXI.Container;  // 缩略图容器（已挂在 parent.stage 上）
  destroy(): void;                 // 销毁（幂等）
  readonly destroyed: boolean;
}
```

---

## 使用

### 基本用法

```ts
const sc = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
const fm = createFullscreenManager(proxy);

const panel = sc.createSubRegion({ x: 40, y: 60, width: 180, height: 180 });
const thumb = createClickableImage(panel, proxy.bus, {
  url: 'https://example.com/image.jpg',
  x: 0, y: 0,
  width: 180, height: 180,
});
```

### 自定义遮罩和缩放倍数

```ts
const thumb = createClickableImage(panel, proxy.bus, {
  url: img.url,
  x: 0, y: 0,
  width: 180, height: 180,
  overlayColor: 0x1a1a2a,
  overlayAlpha: 0.8,
  zoomFactor: 3,
});
```

---

## 应用范围

适合：
- **图片缩略图网格**（相册 / 作品集 / 商品图）
- **需要点击预览全屏的场景**
- **要求从缩略图位置平滑展开动画**

不适合：
- **非图片内容的点击展示**（文本 / 面板 — 用 PixiWindow 或自定义）
- **需要展示失败时显示详细错误信息的场景**（用 PixiImage）

---

## 注意事项

1. **点击即发事件**：ClickableImage 自己不管理任何展开/关闭/缩放逻辑，`pointerdown` 只是 `bus.emit('fullscreen:show', ...)`。全屏交互全部由 FullscreenManager 处理。
2. **纹理共享**：`PIXI.Assets.load` 加载的 `texture` 被缩略图 sprite 和全屏 sprite 共享（PIXI 纹理引用计数，不重复请求）。
3. **未加载完的点击被忽略**：`if (!loadedTexture) return;` — 图片还没加载完成时点击无反应。
4. **placeholder 在图片加载后被销毁**：`placeholder.destroy()` + `placeholderText.destroy()` 释放 Graphics/Text 资源。
5. **缩略图居中**：sprite 保持原始比例缩放到 `fit-to-thumb`，使用 `sprite.x/y` 居中计算，不是 `stage.pivot`。
6. **无需手动调用任何展开方法**：ClickableImage 对外只暴露 `stage`、`destroy()` 和 `destroyed` getter。
