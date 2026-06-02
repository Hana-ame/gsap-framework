# ErrorBoundary

React class component 错误边界。捕获子组件渲染错误，显示全屏错误页 + Retry 按钮。

---

## 调用栈

### 捕获错误
```
子组件抛出异常
  └─ React 调用 getDerivedStateFromError(err)
       └─ state.err = err → render 显示错误页

componentDidCatch(err, info)
  └─ console.error('ErrorBoundary caught:', err, info)
```

### 重试
```
用户点击 "Retry"
  └─ this.reset() → setState({ err: null })
       └─ render 重新渲染 children
```

---

## API

```tsx
class ErrorBoundary extends Component<{ children: ReactNode }, { err: Error | null }>
```

| 方法 | 说明 |
|---|---|
| `static getDerivedStateFromError(err)` | 静态方法，设置 `state.err` |
| `componentDidCatch(err, info)` | 日志上报（当前只 console.error） |
| `reset()` | 清除错误状态，重新渲染 children |

---

## 注意事项

1. **只捕获渲染错误**：不捕获 `useEffect` 里的异步错误、事件处理器里的错误。要捕获这些需用 `try-catch` 或全局 `error` 事件。
2. **z-index: 2147483647**：错误页覆盖所有内容（包括 PIXI/Three.js canvas）。
3. **点击 pre 复制错误信息**：`navigator.clipboard.writeText(body)` — 移动端 Safari 可能需要用户手势触发。
4. **style 内联**：没有用 CSS 文件，因为错误发生时 CSS 可能已经损坏。
