# WindowMobileDisplay

移动端自适应窗口演示 — PIXI Confirm 对话框 + 底部触发按钮栏，响应式布局适配小屏幕。

---

## 调用栈

### 初始化
```
WindowMobileDisplay mount
  └─ useEffect
       └─ startPixiApp(proxy)
            ├─ proxy.createRegion(root)
            ├─ header Text (显示当前尺寸)
            ├─ bg (底部触发栏背景)
            ├─ triggerLayer (PIXI.Container)
            ├─ buildTriggerBar()   // 响应式排列触发按钮
            ├─ proxy.onWindowResize → root.setBounds + 重绘 + buildTriggerBar()
            ├─ matchMedia('(max-width: 599px)') → onMql → buildTriggerBar()
            └─ showLoading → setTimeout 200ms hide
```

### buildTriggerBar（响应式布局）
```
buildTriggerBar()
  ├─ 清空 triggerLayer
  ├─ measureTrigger(label) → 计算每个按钮宽度
  ├─ totalRowWidth <= innerW
  │    └─ 一行排列
  └─ totalRowWidth > innerW
       └─ 分行：perRow = max(2, floor((innerW + gap) / (maxBtnWidth + gap)))
            └─ 按钮逐个放入行，超出则换行
  └─ 居中排列：cursorX = (W - rowWidth) / 2
```

### spawnAt（响应式尺寸）
```
用户点击触发按钮
  └─ confirmBoxFor(kind, ox, oy)
       ├─ mobile = W < 600
       ├─ w = mobile ? min(W - 24, desktopW) : desktopW
       ├─ h = mobile ? min(H - triggerBar - header - 24, desktopH) : desktopH
       └─ createConfirm({ parent: root, width: w, height: h, dragMode: 'anywhere', ... })
```

---

## API

```tsx
function WindowMobileDisplay(): JSX.Element
```

- 无 props
- 返回 JSX（events overlay），PIXI 渲染在 canvas 上

---

## 注意事项

1. **5 种 confirm 变体**：simple / custom / three / closeonly / image — 和 PixiConfirmDisplay 相同，但尺寸响应式。
2. **MOBILE_BREAKPOINT = 600px**：CSS media query 和 JS matchMedia 用同一断点。
3. **按钮分行逻辑**：`perRow = max(2, ...)` 保证每行至少 2 个按钮。按钮宽度按文本测量 + padding。
4. **居中排列**：每行按钮整体居中，不是左对齐。
5. **matchMedia 监听**：屏幕宽度跨越断点时自动重建触发栏（不用 resize 事件，因为 matchMedia 只在断点变化时触发）。
6. **confirm 尺寸 clamp**：移动端 confirm 宽度不超过 `W - 24`，高度不超过可用空间，防止超出屏幕。
