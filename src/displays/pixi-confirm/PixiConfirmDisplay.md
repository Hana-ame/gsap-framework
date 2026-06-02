# PixiConfirmDisplay

PIXI 版 Confirm 对话框演示。在 PIXI 画布上生成可拖拽的 Confirm 窗口，测试按钮点击不触发拖拽。

---

## 调用栈

### 初始化
```
PixiConfirmDisplay mount
  └─ useEffect
       └─ startPixiApp(proxy)
            ├─ proxy.createRegion(root)
            ├─ header Text ("#pixi-confirm — buttons in anywhere-drag mode must not trigger drag")
            ├─ mkTrigger(label, kind) × 5  // 底部触发按钮
            │    ├─ new PIXI.Graphics().roundRect().fill().stroke()  // 按钮背景
            │    ├─ new PIXI.Text(label)
            │    └─ root.onPress(e => spawnAt(x, y, kind))
            ├─ proxy.onWindowResize → root.setBounds
            └─ showLoading → setTimeout 200ms hide
```

### spawnAt
```
用户点击触发按钮
  └─ spawnAt(ox, oy, kind)
       └─ createConfirm({ parent: root, title, message, width, height, dragMode: 'anywhere', ... })
            ├─ kind='simple'    → 标准 OK/Cancel
            ├─ kind='custom'    → Save/Discard
            ├─ kind='three'     → Cancel/Red/Green/Blue (4 buttons)
            ├─ kind='closeonly' → 无按钮，只有 X 关闭
            └─ kind='image'     → 带图片预览
       confirmsRef.current.push(confirm)
```

### 事件日志
```
Confirm.onResult(r)
  └─ append(`simple: result=${r}`)
       └─ setLog → React overlay 显示
```

---

## API

```tsx
function PixiConfirmDisplay(): JSX.Element
```

- 无 props
- 返回 `null`（纯 PIXI 渲染）
- React overlay 显示事件日志（`position: absolute; top: 32; right: 12; pointer-events: none`）

---

## 注意事项

1. **dragMode: 'anywhere'**：整个窗口可拖拽，但按钮必须 stopPropagation 防止触发拖拽。这是核心测试点。
2. **5 种 confirm 变体**：simple / custom / three / closeonly / image — 覆盖所有按钮配置场景。
3. **events overlay**：`pointer-events: none` 不影响 PIXI canvas 的交互。
4. **loading 动画**：200ms 后自动隐藏，只是短暂的初始化过渡。
5. **confirm 实例管理**：`confirmsRef` 存所有 confirm，cleanup 时逐个 destroy。
