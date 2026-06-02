# WindowDisplay

PIXI 窗口系统演示 — Inventory 网格 + Chat 文字窗口 + EventBus 跨窗口通信 + Loading 动画。

---

## 调用栈

### 初始化
```
WindowDisplay mount
  └─ useEffect
       └─ startPixiApp(proxy)
            ├─ proxy.createRegion(root)
            ├─ header Text
            ├─ createWindow({ parent: root, title: 'Inventory', 280×200, x:40, y:40 })
            │    └─ 12 个 slot (6×2 grid)
            ├─ createWindow({ parent: root, title: 'Chat', 240×140, x:W-280, y:H-180 })
            │    └─ chatText (初始: 'bus.on("chat", ...)\nawait backend...')
            ├─ proxy.bus.on('chat', handler)  // 监听 chat 事件
            ├─ showLoading(root, 'simulating backend call...')
            └─ setTimeout 1500ms
                 ├─ hideLoading()
                 └─ proxy.bus.emit('chat', { from: 'system', msg: 'hello from simulated backend' })
```

### 事件流
```
1. Loading 显示 1.5s（模拟后端调用）
2. Loading 隐藏
3. proxy.bus.emit('chat', { from: 'system', msg: '...' })
4. proxy.bus.on('chat') 回调
   └─ chatText.text = `system: hello from simulated backend\n...`
```

### Resize
```
window.resize
  └─ root.setBounds({ x:0, y:0, width:W, height:H })
```

---

## API

```tsx
function WindowDisplay(): JSX.Element
```

- 无 props，返回 `null`
- 两个 PixiWindow 实例：Inventory（网格）+ Chat（文字）
- EventBus 通信：loading 完成后 emit chat 消息

---

## 注意事项

1. **Inventory 网格**：12 个 36×36 的 slot，排列为 6 列 × 2 行，无交互（纯视觉）。
2. **Chat 窗口**：初始文字显示 API 用法提示，收到 chat 事件后更新。
3. **EventBus 生命周期**：`offBackend` / `offBusDemo` 在 cleanup 时取消订阅，防止内存泄漏。
4. **Loading 时序**：先 showLoading → 1.5s 后 hideLoading + emit chat — 模拟异步后端调用。
5. **Chat 位置**：右下角 `x: W-280, y: H-180`，resize 后不会自动重定位（只更新 root bounds）。
