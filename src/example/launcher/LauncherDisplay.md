# LauncherDisplay

应用启动器 — 网格卡片展示所有可用路由，支持搜索过滤。默认路由。

---

## 调用栈

### 渲染
```
LauncherDisplay
  ├─ useState(filter) / useState(now)
  ├─ useEffect: setInterval 每秒更新 now
  ├─ APPS.filter(label/hint/route match query)
  ├─ <header> title + clock + search input + count
  ├─ <main> 网格卡片
  │    └─ visible.map(app)
  │         └─ <button onClick={() => location.hash = `#${app.route}`}>
  │              glyph + label + hint + route
  └─ <footer> hint text
```

### 路由跳转
```
用户点击卡片
  └─ window.location.hash = `#${app.route}`
       └─ 触发 hashchange → useHashRoute → RouteSwitch 重新渲染
```

---

## API

```tsx
function LauncherDisplay(): JSX.Element
```

- 无 props，无外部依赖（纯 React DOM）
- 内置 CSS（`<style>{launcherCss}</style>`）
- 11 个路由卡片，每个有 route / label / hint / glyph / accent

---

## 注意事项

1. **默认路由**：`DEFAULT_ROUTE` 在 routes.ts 里设为 `'launcher'`，无 hash 时显示此页面。
2. **搜索**：按 label / hint / route 模糊匹配，大小写不敏感。
3. **accent 颜色**：每个卡片有渐变背景 `linear-gradient(160deg, accent 0%, #0a0a14 130%)`，文字颜色根据亮度自适应（`accentToText`）。
4. **safe-area padding**：CSS 用 `var(--safe-top)` 等变量适配刘海屏。
5. **touch-action: manipulation**：双击不缩放。
