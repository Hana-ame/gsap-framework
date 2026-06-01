# routes

路由常量 + 表驱动映射。`routes.ts` 是 **唯一** 定义路由的地方；`RouteSwitch` 和 `useHashRoute` 都从这里 import。

---

## 调用栈

### 谁 import 它
```
RouteSwitch.tsx ─┐
                  ├─→ import { routeMap, DEFAULT_ROUTE, type Route } from './routes'
useHashRoute.ts ─┘
```

### 启动时
```
TypeScript 编译阶段：
  ROUTES = ['single', 'multiple'] as const
    → type Route = 'single' | 'multiple'

运行时：
  const C = routeMap.single        // → SingleDisplay 组件
  const D = routeMap.multiple      // → MultipleDisplay 组件
  isRoute('garbage') → false
  isRoute('single')  → true        // type guard，TS 收窄为 Route
```

### 加新路由
```
1. routes.ts：
     ROUTES = [..., 'newroute'] as const
     routeMap.newroute = NewDisplay
2. RouteSwitch.tsx：switch 里加 case
3. 实现 NewDisplay 组件
```

---

## API

```ts
export const ROUTES: readonly ['single', 'multiple']
export type Route = 'single' | 'multiple'                       // 字面量联合
export const DEFAULT_ROUTE: Route = 'multiple'
export const isRoute: (r: string) => r is Route
export const routeMap: Record<Route, ComponentType>
```

| 导出 | 用途 | 谁用 |
|---|---|---|
| `ROUTES` | 字面量数组（`as const`） | `Route` 类型推导；将来可能用来循环渲染 |
| `Route` | 路由名字面量联合类型 | `useHashRoute` 返回值；`routeMap` key |
| `DEFAULT_ROUTE` | 非法 hash 时的兜底 | `useHashRoute`；`RouteSwitch` default 分支 |
| `isRoute` | type guard | `useHashRoute` 里 narrow `string` → `Route` |
| `routeMap` | 路由 → 组件的映射表 | `RouteSwitch` 拿来取组件 |

---

## 使用

### 加新路由（3 步）
```ts
// 1. routes.ts
export const ROUTES = ['single', 'multiple', 'settings'] as const;
export const routeMap: Record<Route, ComponentType> = {
  single:   SingleDisplay,
  multiple: MultipleDisplay,
  settings: SettingsDisplay,        // ← 加
};
```

```tsx
// 2. RouteSwitch.tsx
case 'settings': {
  const C = routeMap.settings;
  return <C />;
}
```

```tsx
// 3. 新建 src/displays/SettingsDisplay.tsx
export function SettingsDisplay() { return <div>settings</div>; }
```

### 改默认路由
```ts
// routes.ts
export const DEFAULT_ROUTE: Route = 'single';   // 改这里
```

### 路由级守卫（手动）
```ts
// routes.ts
export const routeMap: Record<Route, ComponentType> = {
  single: SingleDisplay,
  multiple: MultipleDisplay,
};

export const routeGuard: Record<Route, () => boolean> = {
  single: () => true,
  multiple: () => true,
};

// 在 RouteSwitch.tsx 里调 routeGuard[route]()
```

---

## 应用范围

适合：
- **路由数量少且稳定**（≤ 5 个）— 字面量联合 + Record 简单清晰
- **静态映射**：路由名 → 组件（不涉及权限、参数、loader）
- **类型驱动**：TypeScript 能 catch typo（`routeMap.singel` 会报错）

不适合：
- **动态路由**（`#user/:id`）— 字面量联合无法表达
- **大量路由**（10+）— Record 的 key 太多维护困难；考虑目录式自动发现
- **路由需要懒加载**（`React.lazy`）— 当前 `routeMap` 直接 import，要懒加载得改成 `() => import(...)`
- **跨路由共享布局**（layout / nav）— 不在 routes.ts 关心；放 RouteSwitch 里

---

## 注意事项

1. **`as const` 必须保留** — 没有它 `ROUTES` 推成 `string[]`，`Route` 退化成 `string`，type guard `isRoute` 也失去意义。
2. **`routeMap` 和 switch 同步** — 加 case 时记得加 entry；TypeScript 会查 `Record<Route, ...>`，漏 entry 会编译报错（强约束 = 安全）。
3. **`isRoute` 在 `useHashRoute` 里用** — 不要在自己代码里调（直接调也行，但 type narrow 已经足够）。
4. **`DEFAULT_ROUTE` 必须是合法 Route** — TypeScript 会查（`: Route`），写 `'garbage'` 会编译错。
5. **不要把 component 默认 export** — `routeMap` 用 named export，否则 RouteSwitch 改 import 麻烦。
6. **不导出 `routes: Route[]`** — 需要遍历时直接 `ROUTES` 即可（已经是数组）。
7. **路由组件不接 props** — `ComponentType` 是无参；想接 props 用 `() => <Display prop={...} />` 包裹。
