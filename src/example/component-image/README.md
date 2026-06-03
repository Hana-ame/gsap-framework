# ComponentImageDisplay

Showcase for `createLoadingImage()` from `components/PixiImage.ts`. Four slots demonstrate loading, success, and error states.

## Slots

| Slot | Source                                          | Expected              |
|------|-------------------------------------------------|-----------------------|
| A    | proxy sinaimg (small) via moonchan proxy        | loaded                |
| B    | proxy sinaimg (large) via moonchan proxy        | loaded, contain-fit   |
| C    | upload.moonchan.xyz (direct, no CORS)           | loaded                |
| D    | connection refused (0.0.0.0/nonexistent.jpg)    | error, placeholder    |

Click "load" to start async asset load, "clear" to destroy the handle. A toggle controls `showErrorHint` globally.

## API

```ts
createLoadingImage(parent: SubCanvas, opts: PixiImageOptions): PixiImageHandle

interface PixiImageOptions {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  maxWidth?: number;              // 默认 width（contain-fit 最大宽）
  maxHeight?: number;             // 默认 height（contain-fit 最大高）
  placeholderText?: string;       // 默认 'loading...'
  placeholderBg?: number;         // 默认 0x1a1a2a
  placeholderBorder?: number;     // 默认 0x2a2a3a
  placeholderTextColor?: number;  // 默认 0x888888
  showErrorHint?: boolean;        // 默认 false；true=显示具体错误信息
  onLoad?: (texture: PIXI.Texture) => void;
  onError?: (err: Error) => void;
}

interface PixiImageHandle {
  setUrl(url: string): void;                  // 切换图片（token-cancellation-safe）
  setErrorHintVisible(visible: boolean): void; // 运行时切换错误信息显隐
  destroy(): void;
  readonly destroyed: boolean;
  readonly container: PIXI.Container;          // 存放 placeholder/sprite 的容器
}
```

`createLoadingImage` is token-cancellation-safe: a new load before the previous resolves will not clobber the placeholder.
