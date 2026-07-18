# ComponentVideoPlayerDisplay

PIXI 内联视频播放器 showcase。4K 视频播放 + 控件条 + 进度拖拽。

## 功能

- PIXI VideoSource + Sprite 渲染视频帧
- 底部控件条（play/pause、时间显示、进度条 seek）
- 右上角 HUD debug 面板（全部在 PIXI SubCanvas 内，无 React DOM）
- 外部 play/pause/seek/speed 控制按钮（PIXI，非 React DOM）
- 支持 `showControls` / `hidePlayButton` 选项

## 关键实现

- `createVideoPlayer` from `components/PixiVideoPlayer.ts`
- `player.root.visible = false` 等待 primer 完成再显示，防黑屏 race
- Start UI 在 player.root 之外
