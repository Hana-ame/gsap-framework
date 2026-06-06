# ComponentCutsceneMinimalDisplay — 单 PIXI.App 视频播放 sanity 测试

`src/example/component-cutscene-minimal/ComponentCutsceneMinimalDisplay.tsx` 的对应文档。

---

## 职责

诊断式示例：剥离 SubCanvas / `createVideoPlayer` / 状态机 / fade / skip 等所有"上层建筑"，只保留 PIXI v8 官方示例的最简模式——单 `PIXI.Application` + `<video>` + `PIXI.Texture.from(video)` + `Sprite`。目的：当 `component-cutscene` 出问题时，用本例验证 **"PIXI v8 视频播放在这个环境里是否根本可行"**。

适用：调试、回归测试、新人快速验证环境。

---

## 代码结构

```
useEffect
  └─ new PIXI.Application()
     └─ .init({ width, height, webgl })
        └─ then:
           ├─ canvas 挂到 body
           ├─ document.createElement('video') + 赋 src
           ├─ PIXI.Texture.from(videoElement)
           ├─ new PIXI.Sprite(texture) + 16:9 fit-contain
           ├─ app.stage.addChild(sprite)
           └─ videoElement.play()  （muted=true 必填，绕过 autoplay 策略）

return cleanup → app.destroy(true, {children, texture})
```

---

## 关键设计

- **`muted = true`**：浏览器 autoplay 策略要求 `muted` 或 `user gesture` 二选一。本例不接 UI 按钮，最简路径是 muted 绕过。
- **`crossOrigin = 'anonymous'`**：mdn 示例的 mp4 是 CORS-friendly；设了保险，没坏处。
- **无 ticker、无状态机**：本例只验证"能播"，不验证"能控"。
- **无任何 controls UI**：直接全屏 sprite。

---

## 如何运行

启动后访问 `#component-cutscene-minimal`，视频应直接自动循环播放铺满屏幕（按 16:9 contain 留黑边）。Console 应输出：

```
[Minimal] loadedmetadata duration=6.166
[Minimal] canplay
[Minimal] play() resolved
[Minimal] play event
```

---

## 预期结果 vs 故障定位

| 现象 | 结论 |
|---|---|
| 视频正常循环播放，console 输出完整 | 环境 OK；问题在 SubCanvas 集成或 `createVideoPlayer` |
| Console 有 `loadedmetadata` 但无 `canplay` | 网络 / MIME / CORS 问题；检查 mp4 URL 是否仍可达 |
| Console 有 `play() rejected` | autoplay 策略相关；检查 `muted` 是否生效 |
| 视频播了一帧后黑屏 / 卡死 | PIXI 内部 `VideoSource` rVFC 与销毁竞态；需进一步拆解 |
| Console 完全无 video 事件 | `videoElement.src` 赋值没生效；检查 CSP / 跨域 |
