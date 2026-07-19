# ComponentDrawingDisplay

自由绘制画板。纯 PIXI UI，鼠标/触控绘制。

## 功能

- 7 色 palette（2 行 × 4 列排列）
- 4 种笔刷尺寸（2 / 4 / 8 / 16 px）
- 选中颜色外框指示（白色半透明 `roundRect` 包边）
- 选中笔刷高亮（亮底 + 白色描边）
- clear all — 清除所有笔画
- undo stroke — 撤销上一笔
- 笔画持续累加在 canvas 上，非逐帧重绘（每笔独立 Graphics）

## 架构约定

- 颜色/大小按钮在 `renderTools()` 中统一重建，点击后重新渲染
- 绘制区用 `canvas.onPress/Move/Release`，监听 SubCanvas 事件
- 工具面板用独立 SubCanvas region，事件与绘制区隔离
- `return null`，所有 UI 在 PIXI 内
