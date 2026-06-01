# RouteSwitch

唯一在 `<App />` 里渲染的组件。读当前 hash 路由，渲染对应组件。

---

## 调用栈

### 启动
```
ReactDOM.createRoot(...).render(<App />)
  └─ <App />                                       // src/App.tsx
       └─ <RouteSwitch />                          // 本组件
            ├─ useHashRoute()                      // 返回 'single' | 'multiple' | DEFAULT
            └─ switch (route) {
                 case 'single':   return <routeMap.single />
                 case 'multiple': return <routeMap.multiple />
                 default:        return <routeMap[DEFAULT_ROUTE] />
               }
```

### 用户改 URL
```
window.location.hash = '#multiple'
  └─ 'hashchange' event
       └─ useHashRoute.setRoute(compute())
            └─ React 重渲 <RouteSwitch />
                 └─ route 变成 'multiple' → 命中 case 'multiple'
                      └─ <MultipleDisplay /> 挂载
                           └─ useEffect → startPixiApp → 创建 PIXI
```

### 路由切换（卸载旧组件）
```
路由从 'multiple' 变 'single'
  └─ React 重渲 <RouteSwitch />
       └─ 返回 <SingleDisplay />（不同组件类型）
            └─ React 卸载 <MultipleDisplay />
                 └─ useEffect cleanup
                      ├─ displayCleanups.forEach(c => c())   // 清 PIXI 内容
                      ├─ cleanupResize?.()                   // 注销 resize 监听
                      └─ destroy()                           // 销毁 PIXI.Application
```

### 非法 hash
```
window.location.hash = '#garbage'
  └─ useHashRoute 第一次 useEffect
       └─ if (!isRoute(...)) window.location.replace(`#${DEFAULT_ROUTE}`)
            └─ 'hashchange' event → setRoute('multiple') → 渲染 multiple
```

---

## API

```ts
export function RouteSwitch(): JSX.Element
```

- **无 props** — 路由从 `window.location.hash` 读
- **无返回值** — 渲染路由对应的组件
- **位置**：在 `<App />` 里独占（不要和别的 JSX 一起）

---

## 使用

### 在 App.tsx 里
```tsx
import { RouteSwitch } from './router/RouteSwitch';

export function App() {
  return <RouteSwitch />;
}
```

### 加 case
```tsx
switch (route) {
  case 'single':   { const C = routeMap.single;   return <C />; }
  case 'multiple': { const C = routeMap.multiple; return <C />; }
  case 'settings': { const C = routeMap.settings; return <C />; }   // ← 加
  default:         { const C = routeMap[DEFAULT_ROUTE]; return <C />; }
}
```

### 在所有路由外加 layout
不要加在 RouteSwitch 里 — RouteSwitch 必须只返回一个组件；用 React Router-style 的 outlet 模式需要再设计。

替代方案：包一层：
```tsx
// App.tsx
export function App() {
  return (
    <div>
      <nav>...</nav>
      <RouteSwitch />
    </div>
  );
}
```

### 路由级 loading
```tsx
export function RouteSwitch() {
  const route = useHashRoute();
  const Component = routeMap[route] ?? routeMap[DEFAULT_ROUTE];
  return <Component />;
}
```
这样 `default` 自动失效，但失去了 **显式 switch**（用户偏好显式分支）。

---

## 应用范围

适合：
- **每个路由独立生命周期**（各起各的 PIXI.Application）— 切换路由自动销毁旧的 PIXI
- **路由数量固定且不多**（switch 形式可读性好）
- **想用显式 switch 而不是动态 lookup**

不适合：
- **路由间共享 PIXI Application** — 每次切换都销毁重建；要共享就在 App 层 startPixiApp，路由组件只 `proxy.createRegion`
- **路由要带参数**（`#user/123`）— 当前 switch 不解析参数；参数取在 Display 组件里 `window.location.hash`
- **路由间状态保留**（组件不卸载）— 切换路由 React 默认卸载；要保留用 `key={route}` 控制或第三方状态库

---

## 注意事项

1. **case 必须穷举 Route** — TypeScript `Record<Route, ComponentType>` 会查，少一个 case 编译报错（强约束）。`default` 兜底是安全网，但理论上 case 已经覆盖。
2. **不要在 switch 前后加 JSX**：
   ```tsx
   return <><Header /> ... </>;  // 不好，layout 污染
   ```
   想要 layout 放到 `<App />`。
3. **case 块用 `{}` 包** — `const C = ...; return <C />;` 两行；不带 `{}` 的话 `const` 不在 case 块作用域里。TypeScript 会因 lexical declaration 报错。
4. **default 用 `routeMap[DEFAULT_ROUTE]`** — 不要 fallback 到 `<div>404</div>` 之类；保持路由表的单一来源。
5. **不要 memo** — RouteSwitch 没有 props 没有 state，React 已经够快了。
6. **`Component` 不要大写驼峰传给 JSX** — 必须 `const C = routeMap.single; return <C />;`，否则 JSX 把它当 HTML 标签。
