# ComponentCutsceneMinimalDisplay

cutscene 的 sanity test。单个裸 `PIXI.Application` + `<video>` + Sprite，无 SubCanvas。

## 用途

- 验证 PIXI v8 video 播放的 race condition 已修复
- `player.root.visible = false` + 外部 start button 模式
- 对比 `component-cutscene` 排除 SubCanvas 层的影响

## 踩坑记录

见顶层 README 的「视频黑屏」章节。此文件是 cutscene 问题的复现/验证用例。
