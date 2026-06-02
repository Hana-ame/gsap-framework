# ScreenSizeDisplay

设备信息面板 — 实时显示 viewport 尺寸、DPR、UA、硬件信息等。纯 PIXI 渲染。

---

## 调用栈

### 初始化
```
ScreenSizeDisplay mount
  └─ useEffect
       └─ startPixiApp(proxy)
            ├─ proxy.createRegion(root)
            ├─ bg / title / bigSize / sub Text
            ├─ ROWS.forEach → labels[] + values[] (12 行设备信息)
            ├─ uaText (user agent 字符串)
            ├─ diagText (时间戳)
            ├─ proxy.ticker.add(tick)  // 每帧刷新
            ├─ proxy.onWindowResize → root.setBounds + 重绘
            └─ visualViewport.addEventListener('resize', onResize)
```

### 每帧刷新
```
tick → renderNow(snapshot())
  └─ snapshot()
       ├─ window.innerWidth / innerHeight
       ├─ window.visualViewport.width / height
       ├─ window.devicePixelRatio
       ├─ window.screen.width / height
       ├─ navigator.userAgent / language / onLine / maxTouchPoints
       ├─ navigator.hardwareConcurrency / deviceMemory
       ├─ navigator.connection.effectiveType / type
       └─ navigator.standalone
```

### 显示内容
```
bigSize: "1920 x 1080"
sub:     "dpr 2 · css 960×540 · device 1920×1080"
ROWS:    inner / visualViewport / screen / dpr / maxTouchPoints / hardwareConcurrency / deviceMemory / connection / online / standalone / lang / ts
uaText:  完整 UA 字符串
diagText: ● 2026-06-01T...
```

---

## API

```tsx
function ScreenSizeDisplay(): JSX.Element
```

- 无 props，返回 `null`
- 每帧通过 ticker 更新 snapshot

---

## 注意事项

1. **每帧更新**：ticker 每帧调 `snapshot()` + `renderNow()`，开销很小（只是读 navigator 属性 + 更新 Text.text）。
2. **行高自适应**：`rowH = clamp(13, 18, (H - 86 - 80) / ROWS.length)`，小屏幕自动压缩行高。
3. **visualViewport 监听**：除了 window.resize，还监听 visualViewport.resize — 移动端键盘弹出时 visualViewport 会变但 innerHeight 不变。
4. **deviceMemory / connection**：非标准 API，老浏览器返回 `'?'`。
5. **没有 PIXI 交互**：所有 Text 和 Graphics 都 `eventMode = 'none'`，不响应 pointer 事件。
