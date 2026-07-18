# ScreenSizeDisplay

Viewport / device / canvas 尺寸信息读出。

## 显示内容

- 一行 `W × H` 大字（innerWidth × innerHeight）
- 详细值：visual viewport 宽高、DPR、devicePixel、canvas 实际像素
- User-Agent 字符串
- PIXI renderer 信息（渲染器名称/轮询）

所有文字用 `PIXI.Text` 在 canvas 上渲染，ticker 驱动每帧更新。
