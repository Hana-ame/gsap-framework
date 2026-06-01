# useHashRoute

Hook — 从 `window.location.hash` 读当前路由，监听 `hashchange` 事件，非法 hash 自动改写为 `DEFAULT_ROUTE`。

---

## 调用栈

### 挂载
```
<RouteSwitch /> 渲染
  └─ useHashRoute()
       ├─ const compute = useCallback((): Route => {
       │     const h = window.location.hash.slice(1)       // 去掉 #
       │     return isRoute(h) ? h : DEFAULT_ROUTE
       │  }, [])
       ├─ const [route, setRoute] = useState<Route>(compute)   // 首次同步计算
       └─ useEffect(() => {
             if (!isRoute(window.location.hash.slice(1))) {
               window.location.replace(`#${DEFAULT_ROUTE}`)     // 改写非法 hash
             }
             const onChange = () => setRoute(compute())
             window.addEventListener('hashchange', onChange)
             return () => window.removeEventListener('hashchange', onChange)
          }, [compute])
       └─ return route
```

### 用户改 URL
```
用户点击 <a href="#multiple"> 或 window.location.hash = '#multiple'
  └─ 'hashchange' event on window
       └─ onChange()
            └─ setRoute(compute())
                 └─ React 重渲 RouteSwitch
                      └─ 新的 case 命中
```

### 非法 hash（首次挂载）
```
window.location.hash = '#garbage'
  └─ useEffect 跑
       └─ if (!isRoute(...)) window.location.replace(`#multiple`)
            └─ 触发 'hashchange'
                 └─ onChange() → setRoute('multiple') → 渲染 multiple
```

### 卸载
```
RouteSwitch 卸载（或路由切换，但 RouteSwitch 自身不卸载）
  └─ useEffect cleanup
       └─ window.removeEventListener('hashchange', onChange)
```
**注意**：路由切换时 RouteSwitch 不会卸载（仍然是同一个组件），所以 `hashchange` 监听一直在。

---

## API

```ts
function useHashRoute(): Route
```

- **返回**：`Route` 字面量（`'single' | 'multiple'`）— 非法值调用期间返回 `DEFAULT_ROUTE`，同时会改写 URL
- **副作用**：
  - 首次 useEffect 里把非法 hash 改写为 `#${DEFAULT_ROUTE}`
  - 整个组件生命周期内监听 `hashchange`
- **依赖**：`useCallback(compute, [])` — `compute` 只在第一次 useEffect 跑；后续 setRoute 仍调它

---

## 使用

### 在组件里读
```tsx
import { useHashRoute } from './router/useHashRoute';

export function MyComponent() {
  const route = useHashRoute();
  if (route === 'single') {
    return <SingleSpecificUI />;
  }
  return <MultipleUI />;
}
```

### 跳转
```ts
window.location.hash = '#single';
// 或
window.location.hash = '#multiple';
```
**不要用 `history.pushState`** — 不监听 `popstate` / `pushState`，只听 `hashchange`。

### 跳转并触发
```ts
window.location.hash = '#multiple';
// 浏览器原生触发 hashchange → onChange → setRoute
// 如果要立刻拿到新值：
const newRoute = useHashRoute();   // 旧值，因为 React 还没重渲
```
**没有 imperative API**（`navigate('/multiple')`）— 要的话自己加：
```ts
export function navigate(route: Route) {
  window.location.hash = `#${route}`;
}
```

### 编程初始化
```ts
// 在 useEffect 之外
window.location.hash = '';   // 清掉
window.location.hash = '#multiple';
```

### 拿原始 hash（含非法字符）
不在这个 hook 里 — 直接 `window.location.hash` 即可。

---

## 应用范围

适合：
- **静态 demo** — 用户粘 `#single` 到 URL 直接看对应视图
- **不需要 history API** 的场景（无服务器 SPA fallback 时，hash 路由最省事）
- **GitHub Pages / Cloudflare Pages** — 静态托管无配置

不适合：
- **需要路由参数**（`#user/123`）— 不解析，hash 整体拿去 `isRoute` 判
- **需要 query string**（`#single?foo=bar`）— 不解析，整段被当非法 hash 改写
- **用 history.pushState 的库**（next.js, react-router）— pushState 不触发 hashchange，hook 不更新
- **SSR** — `window` 在服务端不存在；`if (typeof window !== 'undefined')` 守护
- **多 tab 同步** — 不监听 `storage` event；不同 tab 切路由不会同步

---

## 注意事项

1. **`window.location.replace` 会留 history entry** — 一个 `#garbage` 留下。要不留用 `history.replaceState(null, '', '#multiple')`。
2. **首次渲染就是 `DEFAULT_ROUTE`** — 如果 hash 是 `garbage`，第一次渲染是 `multiple`（DEFAULT），然后 useEffect 跑完才把 URL 改对。**中间有一帧渲染 default**，可能闪。
3. **`compute` 用 `useCallback([])`** — 只在挂载时创建；useEffect 依赖 `[compute]` 实际只跑一次。
4. **不在 `useState` 里直接用 `DEFAULT_ROUTE`** — 第一次渲染就用 `compute()`，这样首屏就用 hash 里的值（合法情况下），避免闪 default。
5. **`hashchange` 不会因为 `window.location.hash` 设同一值而触发** — 浏览器原生去重；要强制触发用 `window.dispatchEvent(new HashChangeEvent('hashchange'))`。
6. **hook 本身不 export `navigate`** — 想要 imperative API 自己加（见上面"跳转并触发"小节）。
7. **不要在 hook 里 mutate location 而不同步状态** — 用 `window.location.replace` 改 URL，hashchange 会反向更新 state；不要直接 `setRoute` + `location.replace`（重复）。
8. **TypeScript `Route` 是字面量联合** — 加新路由时记得改 `routes.ts` 的 `ROUTES` + `routeMap`。
