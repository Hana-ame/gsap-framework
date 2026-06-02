# ConfirmDisplay

HTML 版 Confirm 对话框演示。展示 `<Window dragMode="anywhere" />` 上的 Confirm 组件。

---

## 调用栈

### 渲染
```
ConfirmDisplay
  ├─ useState(a, b, log)
  ├─ <button "Open simple Confirm"> → setA(true)
  ├─ <button "Open custom">         → setB(true)
  ├─ <div events log>
  ├─ <Confirm open={a} ...>          // 简单版：Delete item?
  └─ <Confirm open={b} ...>          // 自定义版：Save changes? (Save/Discard)
```

### 事件
```
Confirm.onOk / onCancel
  └─ append('A: OK clicked') → setLog(prev => [timestamp + msg, ...prev].slice(0, 10))
```

---

## API

```tsx
function ConfirmDisplay(): JSX.Element
```

- 无 props
- 两个 Confirm 实例：a（简单）和 b（自定义按钮文字）
- 事件日志显示在页面底部，最多 10 条

---

## 注意事项

1. **不是 PIXI 渲染**：纯 React DOM。Confirm 组件基于 Window（HTML 可拖拽窗口）。
2. **buttons stopPropagation**：Confirm 内部按钮的 `onPointerDown` 调 `stopPropagation()`，防止触发 Window 的拖拽。
3. **message 支持 ReactNode**：Confirm B 的 message 是 `<div>Save <b>3 unsaved changes</b>...</div>`。
