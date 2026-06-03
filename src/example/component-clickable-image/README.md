# ComponentClickableImageDisplay

`createClickableImage()` + `createFullscreenManager()` 的完整演示。四张缩略图网格，点击后 FullscreenManager 接管全屏预览。

## 架构

```
ComponentClickableImageDisplay
  ├─ startPixiApp → proxy
  │    ├─ SubCanvas (全屏区域)
  │    │    └─ 4× 缩略图 (createClickableImage)
  │    │          └─ 点击 → bus.emit('fullscreen:show')
  │    └─ FullscreenManager (zIndex=99999)
  │          └─ bus.on('fullscreen:show') → show()
  │               ├─ overlay (全屏黑色遮罩)
  │               ├─ sprite (全屏图片)
  │               ├─ 单击关闭 (LERP 动画缩回缩略图)
  │               ├─ 双击缩放 (fit ↔ 2x)
  │               └─ 拖动平移 (缩放状态下)
  └─ useEffect cleanup → destroy 所有
```

## 缩略图

| 标签 | URL | 预期 |
|------|-----|------|
| A | sinaimg via proxy | 加载成功 |
| B | sinaimg via proxy | 加载成功 |
| C | sinaimg via proxy | 加载成功 |
| D | sinaimg via proxy | 加载成功 |

## 交互

| 操作 | 缩略图 | 全屏(fit) | 放大(zoomed) |
|------|--------|-----------|-------------|
| 单击 | 展开到全屏（从缩略图位置动画） | 关闭回缩略图（动画缩回） | 关闭缩回 |
| 双击 | — | 在点击处放大 2x | 缩小回 fit |
| 拖动 | — | — | 平移图片（不露出空白） |

## API

```ts
// 缩略图
createClickableImage(parent, bus, opts) → ClickableImage

// 全屏管理器（每个 proxy 一个）
createFullscreenManager(proxy) → FullscreenManager
```
