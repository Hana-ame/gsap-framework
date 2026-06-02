# App

根组件，包裹 PwaGate + RouteSwitch。PwaGate 在移动端强制 standalone 模式，桌面端直接放行。

---

## 调用栈

### 渲染
```
main.tsx
  └─ <ErrorBoundary>
       └─ <App />
            └─ <PwaGate requireStandalone="mobile-only" bypassStorageKey="pwa-gate-bypass">
                 └─ <RouteSwitch />
            </PwaGate>
```

---

## API

```tsx
export default function App(): JSX.Element
```

- 无 props，无 state
- 渲染 `<PwaGate>` 包裹 `<RouteSwitch />`
- `requireStandalone="mobile-only"` — 移动端必须 standalone（已安装），桌面端无限制
- `bypassStorageKey="pwa-gate-bypass"` — 用户点 "Continue in browser" 后写 localStorage，下次跳过 gate

---

## 注意事项

1. **PwaGate 是条件渲染**：granted 时直接渲染 children，否则渲染 InstallPrompt 或 fallback。不涉及路由逻辑。
2. **ErrorBoundary 在 main.tsx 包裹 App**，不在 App 内部 — 所以 PwaGate 本身的崩溃也能被捕获。
