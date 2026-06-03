# FullscreenManager — `createFullscreenManager`

全屏图片查看器 — 单例。在一个独立 Container（zIndex=99999）上管理叠加遮罩 + 图片交互。通过 `EventBus` 接收缩略图的 `'fullscreen:show'` 事件，统一处理单击关闭 / 双击缩放 / 拖动平移。

---

## 调用栈

### 创建
```
createFullscreenManager(proxy)
  ├─ new PIXI.Container()                    // 顶层容器
  ├─ container.zIndex = 99999
  ├─ proxy.stage.addChild(container)         // 挂在 root stage 最上层
  ├─ container.eventMode = 'none'            // 默认不可交互
  └─ proxy.bus.on('fullscreen:show', show)   // 监听缩略图展开请求
```

### 显示（收到缩略图事件）
```
proxy.bus.emit('fullscreen:show', ev)
  └─ show(ev)
       ├─ hide()                             // 关闭已有的（如果有）
       ├─ destroyOverlay()                   // 销毁旧遮罩
       ├─ 创建 overlay (Graphics, 全屏填充)    container.addChild(overlay)
       ├─ 创建 sprite (从共享 texture, anchor=0.5)
       │    sprite.x = 缩略图全局中心X
       │    sprite.y = 缩略图全局中心Y
       │    sprite.scale = fit-to-thumb
       │    container.addChild(sprite)
       ├─ container.visible = true
       ├─ container.eventMode = 'static'
       ├─ container.hitArea = 全屏 Rect
       ├─ 设动画目标: sprite 移到视口中心, scale = fit-to-screen
       └─ startAnim() -> ticker.add(tick)    // LERP 动画
```

### 单击关闭
```
pointerdown on container
  └─ 记录 dragStart / dragOrigin
  
pointerup
  ├─ justOpened? -> 跳过一次 (首次打开的 up 不算)
  ├─ isDragging? -> 跳过 (拖拽不算点击)
  ├─ clickTimer 已设? -> 双击 -> toggleZoom()
  └─ 否则: 设 clickTimer = 300ms
       └─ 超时 -> hide()
            ├─ 停止动画 / 清计时器
            ├─ targetX/Y = 缩略图位置, targetScale = 缩略图比例
            ├─ onAnimDone 回调:
            │    active = false
            │    container.eventMode = 'none'
            │    container.visible = false
            │    destroyOverlay()
            │    sprite.destroy()
            └─ startAnim() -> 动画缩回缩略图
```

### 双击缩放
```
pointerup（clickTimer 已设）
  └─ toggleZoom(gx, gy)
       ├─ 未缩放 -> 缩放 (fit -> 2x)
       │    targetX = pw/2 + (gx - pw/2) * (1 - zf)
       │    targetY = ph/2 + (gy - ph/2) * (1 - zf)
       │    targetScale = fitScale * zoomFactor
       │    clampSprite()     // 不露出空白
       └─ 已缩放 -> 还原 (zoomed -> fit)
            targetX/Y = pw/2, ph/2
            targetScale = fitScale
       startAnim()
```

### 拖动（缩放状态下）
```
pointerdown: dragStart = global, dragOrigin = sprite.x/y
pointermove:
  └─ 移动 > 4px 且 zoomed?
       isDragging = true, 清 clickTimer, 停动画
       sprite.x = dragOriginX + dx
       sprite.y = dragOriginY + dy
       targetX/Y = sprite.x/y
       clampSprite()
pointerup:
  └─ isDragging = false, 结束
```

### 销毁
```
manager.destroy()
  ├─ 清 clickTimer
  ├─ proxy.ticker.remove(tick)
  ├─ unsubShow()                           // 摘 bus 监听
  ├─ proxy.stage.off('pointermove'/'up'/'upoutside')
  ├─ destroyOverlay()
  ├─ sprite.destroy()
  ├─ container.removeChild + destroy
  └─ destroyed = true
```

---

## API

### `createFullscreenManager`

```ts
function createFullscreenManager(proxy: SubCanvasProxy): FullscreenManager
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `proxy` | `SubCanvasProxy` | PixiApp 初始化时传入的 proxy，用来拿 `stage`、`bus`、`ticker` |

### `FullscreenManager`

```ts
interface FullscreenManager {
  destroy(): void;
}
```

### `FullscreenShowEvent`（通过 bus 发送）

```ts
interface FullscreenShowEvent {
  texture: PIXI.Texture;          // 已加载完成的纹理
  texW: number;                   // 纹理原始宽度
  texH: number;                   // 纹理原始高度
  thumbGlobalX: number;           // 缩略图全局 X（viewport 坐标）
  thumbGlobalY: number;           // 缩略图全局 Y
  thumbW: number;                 // 缩略图宽度
  thumbH: number;                 // 缩略图高度
  overlayColor?: number;          // 遮罩颜色，默认 0x000000
  overlayAlpha?: number;          // 遮罩透明度，默认 0.6
  zoomFactor?: number;            // 双击缩放倍数，默认 2
}
```

---

## 事件总线

| 事件名 | 方向 | Payload | 说明 |
|--------|------|---------|------|
| `'fullscreen:show'` | 缩略图 → FullscreenManager | `FullscreenShowEvent` | 请求显示全屏图片 |
| `'fullscreen:hide'` | （暂无，可扩展） | — | 全屏关闭通知 |

---

## 使用

### 创建 FullscreenManager

```ts
const fm = createFullscreenManager(proxy);
```

### 缩略图点击时发送事件

```ts
// ClickableImage 内部：
bus.emit('fullscreen:show', {
  texture: loadedTexture,
  texW, texH,
  thumbGlobalX: gb.x + opts.x,
  thumbGlobalY: gb.y + opts.y,
  thumbW, thumbH,
});
```

### 在 useEffect 中清理

```ts
useEffect(() => {
  const stop = startPixiApp((proxy) => {
    const fm = createFullscreenManager(proxy);
    // ... 创建其他内容
    return () => { fm.destroy(); };
  });
  return stop;
}, []);
```

---

## 应用范围

适合：
- **图片点击放大**（ClickableImage 的后端展示器）
- **需要全屏预览 + 缩放拖动的场景**
- **需要动画从缩略图位置展开的场景**

不适合：
- **同时显示多个全屏图片**（设计上就是单例，不会出现两个）
- **需要自由拖拽到不同父级**（全屏模式下覆盖整个 viewport）
- **非图片内容的全屏显示**（需要扩展支持文本/组件）

---

## 注意事项

1. **单例设计**：`show()` 内部先 `hide()` 再创建新的 overlay + sprite，不会出现两个遮罩共存。架构上保证了这一点。
2. **纹理共享**：缩略图加载的 `PIXI.Texture` 直接传给 FullscreenManager，不重复请求网络。同一个纹理被缩略图 sprite 和全屏 sprite 共享。
3. **动画起源**：sprite 初始位置设为缩略图全局中心，然后 LERP 到视口中心 —— 看起来图片是从缩略图位置"飞"到全屏的。
4. **`justOpened` 标记**：防止打开瞬间的 pointerup 误触关闭计时器。
5. **拖拽边界**：`clampDim` 在图片小于视口时返回居中位置，大于视口时限制不露出空白。
6. **Z-index**：`container.zIndex = 99999` + `proxy.stage.sortableChildren = true`，确保位于所有 SubCanvas 之上。
7. **事件监听**：`pointermove/up/upoutside` 挂在 `proxy.stage` 上而不是 container 上，防止快速滑动时鼠标离开 container 区域导致事件丢失。
8. **图片尺寸**：全屏时 `fitScale` 用的是 `Math.min(pw/texW, ph/texH, 1)`，即图片原始分辨率小于 viewport 时不放大，保留像素格。
