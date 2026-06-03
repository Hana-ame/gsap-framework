# PixiImage — `createLoadingImage`

异步加载图片，带 loading placeholder、错误显示和 15s 超时。支持 token-cancellation（连续调用 `setUrl` 不会导致状态错乱）。

---

## 调用栈

### 创建
```
createLoadingImage(parent, opts)
  ├─ new PIXI.Container()                  // this.container
  ├─ container.x/y = opts.x/y
  ├─ container.eventMode = 'none'          // 纯展示，不交互
  ├─ parent.stage.addChild(container)
  └─ load(opts.url)                        // 异步加载
```

### 加载流程
```
load(url)
  ├─ const token = ++currentToken          // 每次 load 递增
  ├─ lastError = null
  ├─ buildPlaceholder(opts.placeholderText ?? 'loading...', phTextColor)
  │    ├─ 销毁旧 placeholder（如果有）
  │    ├─ 创建 Container
  │    │    ├─ bg (Graphics)        rect + fill(0.9 alpha) + stroke
  │    │    ├─ text (Text)          wordWrap, 居中
  │    │    └─ mask (Graphics)      限制文字不超边框
  │    └─ container.addChild(c)
  ├─ timeout = setTimeout(15s)             // 超时自动报错
  ├─ PIXI.Assets.load(url)
  │    .then(texture => {
  │      ├─ clearTimeout(timeout)
  │      ├─ if (token !== currentToken) return   // token 校验
  │      ├─ if (texture empty) → buildError('empty texture')
  │      ├─ else → showSprite(texture)
  │      │    ├─ 销毁 placeholder
  │      │    ├─ 创建 sprite (anchor=0.5, 居中)
  │      │    └─ scale = min(maxW/texW, maxH/texH, 1)
  │      └─ opts.onLoad?.(texture)
  │    })
  │    .catch(err => {
  │      ├─ clearTimeout(timeout)
  │      ├─ if (token !== currentToken) return
  │      ├─ buildError(err.message)
  │      └─ opts.onError?.(err)
  │    })
  └─
```

### 错误显示
```
buildError(msg)
  ├─ lastError = msg
  └─ if (errorHintVisible):
       buildPlaceholder(`(load failed: ${msg})`, 0xff5577)
     else:
       buildPlaceholder('(load failed)', 0xff5577)
```

### 显示/隐藏错误详情
```
setErrorHintVisible(true/false)
  ├─ errorHintVisible = visible
  └─ if (lastError):
       visible? → 显示详细错误消息
       !visible? → 显示简短 '(load failed)'
```

### 销毁
```
handle.destroy()
  ├─ currentToken++                       // 使进行中的 load 失效
  ├─ destroy placeholder / sprite
  ├─ container.parent.removeChild(container)
  └─ container.destroy({ children: true })
```

---

## API

### `createLoadingImage`

```ts
function createLoadingImage(parent: SubCanvas, opts: PixiImageOptions): PixiImageHandle
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `parent` | `SubCanvas` | 父级子画布，container 添加到 parent.stage |
| `opts` | `PixiImageOptions` | 见下方 |

### PixiImageOptions

```ts
interface PixiImageOptions {
  url: string;                     // 图片 URL
  x: number;                       // 容器在 parent 中的 X
  y: number;                       // 容器在 parent 中的 Y
  width: number;                   // 容器宽度
  height: number;                  // 容器高度
  maxWidth?: number;               // sprite 最大宽（默认 opts.width）
  maxHeight?: number;              // sprite 最大高（默认 opts.height）
  placeholderText?: string;        // 加载中文字，默认 'loading...'
  placeholderBg?: number;          // 占位背景色，默认 0x1a1a2a
  placeholderBorder?: number;      // 占位边框色，默认 0x2a2a3a
  placeholderTextColor?: number;   // 占位文字色，默认 0x888888
  showErrorHint?: boolean;         // 是否显示详细错误信息，默认 true
  onLoad?: (texture: PIXI.Texture) => void;
  onError?: (err: Error) => void;
}
```

### PixiImageHandle

```ts
interface PixiImageHandle {
  setUrl(url: string): void;               // 切换图片（token-cancellation safe）
  setErrorHintVisible(visible: boolean): void;  // 切换错误提示详细程度
  destroy(): void;
  readonly destroyed: boolean;
  readonly container: PIXI.Container;
}
```

---

## 使用

### 基本用法

```ts
const img = createLoadingImage(sc, {
  url: 'https://example.com/photo.jpg',
  x: 20, y: 20,
  width: 300, height: 200,
});
```

### 切换图片

```ts
img.setUrl('https://example.com/other.jpg');
// 旧图片未加载完成时会被 token 取消，不会覆盖新图
```

### 自定义错误显示

```ts
const img = createLoadingImage(sc, {
  url: 'https://example.com/photo.jpg',
  x: 20, y: 20,
  width: 300, height: 200,
  showErrorHint: false,           // 默认不显示详细错误
  onLoad: (tex) => console.log('loaded'),
  onError: (err) => console.error(err),
});

// 运行时切换
img.setErrorHintVisible(true);
```

---

## 应用范围

适合：
- **动态加载的图片列表**（相册 / 用户头像 / 缩略图）
- **需要明确显示 loading / error 状态的 UI**
- **图片可能频繁切换的场景**（tab / 路由切换清旧加载）

不适合：
- **需要点击放大的预览图**（用 ClickableImage + FullscreenManager）
- **不需要 placeholder 的纯 sprite**（直接用 PIXI.Sprite + PIXI.Assets）

---

## 注意事项

1. **Token-cancellation**：每次 `load()` 自增 `currentToken`，异步回调里检查 `token !== currentToken`，避免并发加载时旧回调覆盖新状态。
2. **超时保护**：15s 超时自动触发 buildError，避免"永远 loading"。
3. **mask 保护**：placeholder 的 Text 使用 mask 裁剪到容器边框，防止 wordWrap 文字溢出。
4. **sprite 居中**：`anchor.set(0.5)` + `sprite.x/y = width/2` 实现容器内居中，非橱窗裁剪。
5. **`showErrorHint`**：设为 `false` 时不显示具体的错误消息（如网络超时详情），只显示泛化 '(load failed)'，适合面向用户的 UI。
6. **`maxWidth` / `maxHeight`**：默认等于 `opts.width/height`，可设为更大的值使 sprite 超出容器显示（但不推荐，容器 eventMode='none' 不会影响交互）。
7. **destroy 的 token 自增**：确保 destroy 后未完成的 load 不会创建已销毁的 sprite。
