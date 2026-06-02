# main.tsx

应用入口。`createRoot` 挂载 React 树，ErrorBoundary 包裹 App，index.css 全局样式。

---

## 调用栈

### 启动
```
index.html → <script type="module" src="/src/main.tsx">
  └─ main.tsx
       ├─ import './index.css'                    // 全局 CSS reset
       ├─ createRoot(document.getElementById('root')!)
       └─ .render(
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          )
```

---

## API

```tsx
// 无导出 — 这是入口文件
```

---

## 注意事项

1. **ErrorBoundary 在最外层**：捕获 App + PwaGate + RouteSwitch + 所有 Display 组件的渲染错误。
2. **`index.css` 是副作用导入**：不导出任何东西，仅设置全局样式。
3. **`#root` 必须存在于 index.html**：Vite 模板已预置。
