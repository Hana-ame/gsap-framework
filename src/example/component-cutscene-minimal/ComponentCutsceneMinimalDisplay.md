# ComponentCutsceneMinimalDisplay — createVideoPlayer sanity 测试

`src/example/component-cutscene-minimal/ComponentCutsceneMinimalDisplay.tsx` 的对应文档。

---

## 职责

最小化 sanity 测试：剥离状态机、fade、skip 等所有"上层建筑"，只保留 `createVideoPlayer` 的 autoplay+loop+muted 模式——打开页面视频立即循环播放。

目的：当你怀疑 `createVideoPlayer` 本身坏了时，用本例确认它能跑；如果你看到 `component-cutscene` 出问题但本例正常，说明问题在状态机 / ticker / fade / skip 那一层，而不是 `createVideoPlayer` 内部。

---

## ⚠️ 为什么不用裸 PIXI.Texture.from(video)

PIXI v8 官方示例的"5 行代码"模式：

```ts
const video = document.createElement('video');
video.src = url;
const texture = PIXI.Texture.from(video);
const sprite = new PIXI.Sprite(texture);
app.stage.addChild(sprite);
video.play();
```

**在 React Strict Mode（dev 模式）下此模式必坏**。`useEffect` 的 mount→unmount→mount 同步序列里，第一次 cleanup 调 `app.destroy(true, {texture: true})` → cascade 到 `Texture.destroy(true)` → `VideoSource.destroy()` 内部 `source.src = "" + source.load()` → **Abort** 截断首道媒体流。第二次 mount 用同一个 URL 发新请求，Chromium 网络缓存因 Abort 锁死 → `readyState=0` → `canplay` 一辈子不触发 → 画面死寂。

**修法**就是 `createVideoPlayer` 内部的 v3 no-Abort cleanup（详见 `PixiVideoPlayer.md` gotcha #17）。本例用 `createVideoPlayer` 代替裸 `Texture.from` 正是因为这个原因。

---

## 代码结构

```
useEffect
  └─ startPixiApp((proxy) => {
       ├─ root = proxy.createRegion(...)
       └─ createVideoPlayer(root, { autoplay:true, loop:true, muted:true })
     })

return cleanup → player.destroy() + destroyApp()
```

无 ticker、无状态机、无按钮、无 fade——纯播放。

---

## 关键设计

- **`muted = true`**：绕过 autoplay 策略（不接用户交互按钮）。
- **`autoplay = true`**：进入页面立即播；`createVideoPlayer` 内部自己处理 autoplay 失败 UI 态。
- **`loop = true`**：避免视频播完后 `ended` 事件触发 `onEnded`（本例不接 `onEnded`，但循环最省事）。
- **`showControls = true`**：让用户能 pause/seek，方便手动验证。

---

## 故障定位矩阵（结合 `component-cutscene`）

| `#component-cutscene-minimal` | `#component-cutscene` | 结论 |
|---|---|---|
| 正常循环播放 | 正常播放+skip+fade | `createVideoPlayer` 工作正常；cutscene 出问题就是状态机/ticker/fade 层 |
| 正常循环播放 | 黑屏 / 不响应 skip | `createVideoPlayer` 正常；问题在 cutscene 的状态机/ticker/fade 集成 |
| 黑屏 / AbortError | 黑屏 / AbortError | 整个视频栈坏了（极少见；可能 URL 失效或 CORS） |
| 画面但无声音 | 画面但无声音 | 浏览器 autoplay 阻截；检查 `muted` 流转 |

---

## 历史

本例最初版本用了裸 `PIXI.Texture.from(video)` + `app.destroy(true)` 模式。**在 Strict Mode 下黑屏**，与 `createVideoPlayer` 早期版本的 Cache Lock bug 表现一致（`play() rejected: AbortError` + `GL_INVALID_VALUE: glCopySubTextureCHROMIUM`）。后重写为用 `createVideoPlayer` 包装，作为"v3 修法对照证明"。

如果将来 PIXI 团队修了 `VideoSource.destroy()` 的 Abort 行为，本例可以拆成"裸 PIXI 版本"和"createVideoPlayer 版本"两个 example 用来对比教学。
