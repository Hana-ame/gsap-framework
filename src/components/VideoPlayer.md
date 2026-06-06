# VideoPlayer — `<video controls>` wrapper

Thin React wrapper around the native HTMLVideoElement. For 90% of "play a video on a webpage" use cases, this is what you want.

---

## 什么时候用这个 vs `createVideoPlayer`

| 场景 | 用这个 | 用 `createVideoPlayer` |
|------|--------|------------------------|
| 后台嵌入教学/演示视频 | ✅ | ❌ |
| 营销页 hero 区放视频 | ✅ | ❌ |
| 响应式布局、跨设备兼容 | ✅ | ❌ |
| 浏览器原生全屏 / 字幕 / 画中画 | ✅ | ❌ |
| 把视频帧喂给 PIXI Filter | ❌ | ✅ |
| 视频跟 PIXI 粒子 / Shader 合成 | ❌ | ✅ |
| SubCanvas 统一事件系统 | ❌ | ✅ |

**一句话决策**：视频需要"在 PIXI 里被消费"才用 `createVideoPlayer`，其他全部用 `VideoPlayer`。

完整对比和"什么时候不要用 PIXI 视频"的论证见 [`PixiVideoPlayer.md`](./PixiVideoPlayer.md#什么时候不要用这个组件)。

---

## API

### Props

| Prop | Type | Default | 说明 |
|------|------|---------|------|
| `url` | `string` | (required) | 视频 URL |
| `width` | `number \| string` | — | 渲染宽度 |
| `height` | `number \| string` | — | 渲染高度 |
| `autoplay` | `boolean` | `false` | 自动播放（多数浏览器会拦截非静音自动播放） |
| `loop` | `boolean` | `false` | 循环播放 |
| `muted` | `boolean` | `false` | 静音 |
| `controls` | `boolean` | `true` | 显示浏览器原生控件（播放/暂停/进度/音量/全屏） |
| `playsInline` | `boolean` | `true` | iOS 内联播放（不全屏接管） |
| `crossOrigin` | `'anonymous' \| 'use-credentials'` | — | CORS 模式（如果需要 canvas 抓帧才需要） |
| `className` | `string` | — | 传给 `<video>` |
| `style` | `React.CSSProperties` | — | 内联样式（与默认 `display: block; maxWidth: 100%` 合并） |
| `onLoad` | `() => void` | — | `loadedmetadata` 触发 |
| `onError` | `(e: Error) => void` | — | `error` 事件触发 |

### Ref Handle

```ts
interface VideoPlayerHandle {
  play(): void;          // play().catch(() => {}) 静默吞 AbortError
  pause(): void;
  toggle(): void;        // paused ? play : pause
  seek(t: number): void; // currentTime = t
  readonly el: HTMLVideoElement | null;
  readonly paused: boolean;
  readonly duration: number;
  readonly currentTime: number;
}
```

---

## 用法

```tsx
import { useRef } from 'react';
import { VideoPlayer } from './components';
import type { VideoPlayerHandle } from './components';

function Page() {
  const handleRef = useRef<VideoPlayerHandle>(null);

  return (
    <div>
      <VideoPlayer
        ref={handleRef}
        url="https://example.com/clip.mp4"
        width={640}
        height={360}
      />
      <button onClick={() => handleRef.current?.play()}>Play</button>
      <button onClick={() => handleRef.current?.pause()}>Pause</button>
      <button onClick={() => handleRef.current?.seek(0)}>Restart</button>
    </div>
  );
}
```

---

## 为什么这么简单

**`<video>` 元素已经够好了**。浏览器原生提供：
- 播放 / 暂停 / seek / 进度条
- 音量控制 / 静音
- 全屏 / 画中画
- 字幕 / 章节
- 播放速度
- 键盘快捷键（Space 播/停、左右方向键 seek、F 全屏）
- 触屏支持
- 跨设备自适应

**你不需要重新发明这些**。`controls` 属性一键开启所有功能。

**React 生命周期 = 浏览器原生生命周期**。不需要 `destroy()`、不需要 listener 清理、不需要担心 Cache Lock / Strict Mode / Abort 竞态。React 卸载组件时浏览器自动清理 `<video>` 元素，浏览器自动取消网络请求，**零泄漏**。

**没有 PIXI 就没有 4 个 critical bug**。见 [`PixiVideoPlayer.md` 注意事项 16, 17](./PixiVideoPlayer.md#注意事项) 对比。

---

## 注意事项

1. **autoplay 会被浏览器拦截**：非静音 + 无用户交互时 `play()` 一定 reject。要 autoplay 就 `muted={true}`。
2. **CORS 抓帧需要 crossOrigin**：如果将来要用 `canvas.drawImage(video)` 抓帧到 canvas（再喂 PIXI），必须设 `crossOrigin='anonymous'` 且服务器返回 `Access-Control-Allow-Origin`。纯展示不抓帧不需要。
3. **iOS 必须 `playsInline`**：默认 `true` 已经设了，避免 iOS Safari 默认全屏接管。
4. **play() reject 要 catch**：用户没交互就调 `play()` 会 reject。本组件内部 `.catch(() => {})` 静默吞了；外部用 `handle.play()` 也是。如果你要在 reject 时弹提示，自己写 `videoRef.current.play().catch(e => ...)`。
5. **不要用这个组件去实现视频特效**（滤镜、合成、shader）——用 `createVideoPlayer`。
