# PixiVideoPlayer — `createVideoPlayer`

手动 `<video>` 元素 + PIXI v8 `VideoSource` 视频播放器。带 play/pause 控件、进度条、seek、时间显示、CORS fetch blob fallback。首帧 primer 处理 autoplay=false 时的黑屏。

---

## 调用栈

### 创建
```
createVideoPlayer(parent, opts)
  ├─ new PIXI.Container()                  // root
  ├─ root.x/y = opts.x/y
  ├─ parent.stage.addChild(root)
  ├─ mask (Graphics, fill)  — 裁剪 root
  ├─ root.mask = mask
  ├─ hoverHit (Container, eventMode='static')  — 整个视频区域的 hover 命中
  ├─ bg (Graphics)           — 暗色背景
  ├─ videoSprite (Sprite)     — VideoSource 纹理挂载点
  ├─ cpb (Container)         — 中心播放按钮 (autoplay=false 时显示)
  ├─ ctrl (Container)        — 底部控制条
  │    ├─ ctrlBg (Graphics)
  │    ├─ playBtn (Container) — play/pause 切换
  │    ├─ timeText (Text)     — "--:-- / --:--"
  │    ├─ progBg (Graphics)   — 进度条背景
  │    ├─ progFill (Graphics) — 进度条填充
  │    └─ seekHit (Container) — 进度条点击命中
  ├─ htmlVideo = document.createElement('video')
  │    ├─ crossOrigin='anonymous', playsInline=true, muted, loop
  │    └─ style: position:absolute, left:-9999px, width/height=opts.width/height
  ├─ document.body.appendChild(htmlVideo)   — 必须在 DOM 才能解帧
  ├─ readyState 检查或 addEventListener('canplay', initVideoSource, { once: true })
  └─ htmlVideo.src = url; htmlVideo.load()
```

### 首帧 primer (initVideoSource 内)
```
initVideoSource()  — canplay 触发时调用
  ├─ videoSource = new PIXI.VideoSource({ resource: htmlVideo, autoPlay, updateFPS: 0 })
  ├─ videoTexture = new PIXI.Texture({ source: videoSource })
  ├─ videoSprite.texture = videoTexture
  ├─ adjustSpriteScale()  — 用 videoWidth/videoHeight 设 scale
  └─ if (!autoplay):
       临时 muted = true → play() → pause() → currentTime = 0 → 恢复 muted
       (绕 autoplay policy 捕获首帧入纹理)
```

### seek 拖动 (双层监听)
```
seekHit.on('pointerdown', onSeekDown)
  ├─ onSeekDown(e) — PIXI 命中
  │    ├─ seeking = true
  │    ├─ htmlVideo.currentTime = pct * duration
  │    └─ window.addEventListener('pointermove', onWinMove)
  │              window.addEventListener('pointerup', onWinUp)
  ├─ onWinMove(e) — DOM move, 跨边界时 PIXI 收不到
  │    ├─ 计算 canvas-relative X (clientX - rect.left)
  │    └─ htmlVideo.currentTime = pct * duration
  └─ onWinUp() — 清理 window listener
```

### CORS 错误 fallback (onVideoError)
```
htmlVideo.addEventListener('error', onVideoError)
  ├─ code = htmlVideo.error?.code
  ├─ if (code === SRC_NOT_SUPPORTED || NETWORK):
  │    └─ fetch(url) → URL.createObjectURL(blob) → htmlVideo.src = objectUrl
  └─ if (fallback 失败): 触发 onError + 显示 "Load failed" 文字
```

### 销毁
```
handle.destroy()
  ├─ 1. removeEventListener 自家监听 (loadedmetadata/timeupdate/seeked/play/pause/error)
  ├─ 2. videoSource?.destroy()           — PIXI 摘 video 上的 listener
  ├─ 3. htmlVideo.parentNode.removeChild(htmlVideo)   — DOM 移除
  ├─ 4. URL.revokeObjectURL(objectUrl)
  ├─ 5. clearTimeout(hideTimer) + window.removeEventListener
  ├─ 6. videoTexture?.destroy(true)
  └─ 7. root.parent.removeChild(root) + root.destroy({ children: true })
```

---

## API

### `createVideoPlayer`

```ts
function createVideoPlayer(parent: SubCanvas, opts: PixiVideoPlayerOptions): PixiVideoPlayerHandle
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `parent` | `SubCanvas` | 父级子画布，root 添加到 parent.stage |
| `opts` | `PixiVideoPlayerOptions` | 见下方 |

### PixiVideoPlayerOptions

```ts
interface PixiVideoPlayerOptions {
  url: string;                     // 视频 URL
  x?: number;                      // 容器在 parent 中的 X (默认 0)
  y?: number;                      // 容器在 parent 中的 Y (默认 0)
  width: number;                   // 播放器宽度
  height: number;                  // 播放器高度
  loop?: boolean;                  // 循环播放 (默认 false)
  muted?: boolean;                 // 静音 (默认 true)
  autoplay?: boolean;              // 自动播放 (默认 false)
  showControls?: boolean;          // 显示控制条 (默认 true)
  onLoad?: () => void;             // loadedmetadata 触发
  onError?: (e: Error) => void;    // 视频错误触发 (fallback 失败后)
  onDebug?: (msg: string) => void; // 调试日志回调
}
```

### PixiVideoPlayerHandle

```ts
interface PixiVideoPlayerHandle {
  play(): void;
  pause(): void;
  toggle(): void;                          // 切换 play/pause
  seek(t: number): void;                   // 跳转到 t 秒
  setControlsVisible(v: boolean): void;    // 显示/隐藏控制条
  destroy(): void;
  readonly destroyed: boolean;
  readonly paused: boolean;
  readonly duration: number;
  readonly currentTime: number;
}
```

---

## 使用

### 基本用法

```ts
const player = createVideoPlayer(sc, {
  url: 'https://example.com/video.mp4',
  x: 40, y: 40,
  width: 640, height: 360,
  autoplay: false,
  loop: true,
  muted: false,
});
```

### 外部控制

```ts
player.toggle();           // 切换 play/pause
player.seek(0);            // 跳到开头
player.setControlsVisible(false);  // 隐藏控制条
```

### 调试日志

```ts
const player = createVideoPlayer(sc, {
  url: '...',
  width: 640, height: 360,
  onDebug: (msg) => console.log('[video]', msg),
});
```

---

## 应用范围

适合：
- **内嵌视频播放**（产品演示 / 教学视频 / 背景视频）
- **需要自定义 PIXI 控件 UI**（不能接受 `<video controls>` 默认样式）
- **CORS 配置不稳定的外部 CDN**（fetch blob fallback 兜底）

不适合：
- **流式 / 直播**（HLS / DASH — 需要 hls.js / dash.js，PIXI VideoSource 不支持）
- **音频播放**（用 `HTMLAudioElement` + PIXI.AudioSource，或纯 Web Audio API）
- **多视频同步**（每个 player 独立解码，无法帧同步）

---

## 注意事项

1. **视频元素必须挂到 DOM**：Chrome/Safari 不在 DOM 中的 video 不解帧。`document.body.appendChild(htmlVideo)` 必须调。
2. **off-screen 元素尺寸要合理**：`width: 1px; opacity: 0` 风格的隐藏 video 会被 Chrome 降帧解码 → 画面卡。`left: -9999px` + 实际播放器尺寸是正确做法。
3. **`updateFPS: 0` = 每 tick 同步**：固定间隔（如 30）在 60Hz 屏上会抖动，0 跟渲染同频最平滑。
4. **destroy 顺序固定**：摘自家 listener → `videoSource.destroy()` → DOM removeChild → `URL.revokeObjectURL` → `videoTexture.destroy()` → `root.destroy()`。VideoSource.destroy 必须先于 DOM 移除，否则 PIXI 内部 listener 触达 null 对象。
5. **autoplay=false 需要首帧 primer**：VideoSource 纹理在 video pause 时不更新帧 → 黑屏。primer 临时 mute → play() → pause() → currentTime=0 捕获首帧。
6. **CORS + Range 失败的 fallback**：`MEDIA_ERR_SRC_NOT_SUPPORTED` / `MEDIA_ERR_NETWORK` 时 fetch URL → blob → `URL.createObjectURL` 替换 src。这是 `PIXI.Assets.load()` 做不到的（错误粒度太粗，`MediaError.code` 不可读）。
7. **seek 双层监听**：PIXI 命中区在时走 PIXI，跨边界（快拖）走 `window.addEventListener('pointermove')`。位置直接读 `e.clientX`（canvas `position: fixed; inset: 0`，`client == canvas-relative == PIXI coord`）。
8. **destroyed 守卫**：所有 `dbg`/`adjustSpriteScale`/async primer 回调都先 `if (destroyed) return`，否则在 destroy 期间触达已销毁的 PIXI 对象会 crash。
9. **HUD 必须在 PIXI 层**：在 PIXI canvas 上盖 React DOM 元素会破坏 SubCanvas AABB 事件路由。HUD 也做成 SubCanvas + Scrollable + PIXI.Text。
10. **mask 必须 .fill()**：`new PIXI.Graphics().rect(0, 0, w, h).fill({ color: 0xffffff })`。空 path 的 Graphics 作为 mask 隐藏所有内容。
11. **canplay 监听在 destroy 时不能漏**（critical）：destroy 时若 `videoSource` 还是 null（canplay 未触发就被 destroy），`videoSource?.destroy()` 不执行 src="" 清理，且 canplay listener 还在。`<video>` 离 DOM 后继续后台拉流，下载完成触发 canplay → 调 `initVideoSource` → 在已销毁组件上重新创建 VideoSource/Texture，幽灵内存泄漏。**修法**：(1) `initVideoSource` 首行 `if (destroyed || videoReady) return;`；(2) `destroy()` 显式 `removeEventListener('canplay', initVideoSource)`；(3) `videoSource?.destroy()` 之后兜底 `htmlVideo.removeAttribute('src'); htmlVideo.load();` 截断下载。
12. **Prime 竞态与 `userPlayRequested` 标志**：Prime `play().then(pause + seek 0)` 是微任务。用户手速快在 Prime 启动后立刻点真实播放 → Prime.then 强制 pause+seek(0) → 视频播了零点几秒硬卡回 0。**修法**：`userPlayRequested` 标志，`doPlayAction` / `handle.play` / `handle.toggle` 主动播放时设 true；Prime.then 开头 `if (userPlayRequested) return;` 跳过强制 pause。
13. **VIDEO SETUP 顺序**：`addEventListener('canplay')` 必须**先于** `set src / load()`（防同步 canplay 漏事件）→ 然后 `readyState` 检查在 src 之后才有意义（针对浏览器缓存命中、canplay 不会触发的极端情况）。原代码顺序写反，`readyState` 永远 0。
14. **Fetch fallback MIME 动态继承**：原硬编码 `video/mp4` 把 WebM/MOV 也封成 mp4，Chromium 头部解析失败再抛 SRC_NOT_SUPPORTED。**修法**：`resp.headers.get('content-type') || 'video/mp4'`。
15. **Autoplay 策略阻截的 UI 假死**：`autoplay=true` + `muted=false` 浏览器必拦截 `play()` reject；但视频没播 → `pause` 事件不触发 → UI 永远显示"正在播放"假象。**修法**：(1) UI 初始化一律 `drawPlayIcon(false); cpb.visible = true;` 强制暂停态；(2) `VideoSource.autoPlay: false`，自己控；(3) `if (autoplay) htmlVideo.play().catch(dbg)` 自己调，失败时 UI 保持暂停态等待用户点击。
