# ComponentCutsceneDisplay

点击播放的全屏过场动画。fade-in/out + skip + 状态机。

## 状态机

```
idle → (click) → fading-in → (fade done) → playing → (video end) → fading-out → (fade done) → idle
```

## 功能

- 外部点击层（透明 hit-catcher）在 PIXI stage 上
- `player.root.alpha` 直接做 fade（不需要额外 cutsceneLayer）
- cutscene 模式下 cpb 隐藏且 `eventMode = 'none'`，事件穿透到 skipLayer
- 16:9 fit-contain 算法
- State machine 由 SubCanvas.ticker 驱动（非 setTimeout）
- phantom ended 事件防护
