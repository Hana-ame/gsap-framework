# PwaGate

PWA 网关组件 — 根据 standalone 状态和设备类型决定是否允许访问应用。

---

## 调用栈

### 初始化
```
PwaGate mount
  ├─ detectMobile() → isMobileDevice
  ├─ isStandalone() → standalone
  ├─ readBypass(bypassStorageKey) → bypassed
  └─ isAccessGranted(requireStandalone, isMobile, standalone, bypassed, enabled) → granted

onStandaloneChange 回调
  └─ standalone 变化时重新计算 granted
```

### 判定逻辑
```
isAccessGranted(require, isMobile, standalone, bypassed, enabled):
  !enabled          → true (disabled)
  bypassed          → true (用户已 bypass)
  'never'           → true (不要求 standalone)
  'always'          → standalone (必须 standalone)
  'mobile-only'     → standalone || !isMobile (移动端必须 standalone，桌面端无限制)
```

### 用户 bypass
```
用户点击 "Continue in browser"
  └─ setBypass(bypassStorageKey, true)
       └─ localStorage.setItem(key, '1')
  └─ setBypassed(true) → setGranted(true) → 渲染 children
```

---

## API

```ts
type StandaloneRequirement = 'never' | 'mobile-only' | 'always';

function isAccessGranted(
  require: StandaloneRequirement,
  isMobile: boolean,
  standalone: boolean,
  bypassed: boolean,
  enabled: boolean,
): boolean

function setBypass(key: string | null | undefined, value: boolean): void

function PwaGate({
  children: ReactNode,
  fallback?: ReactNode,              // 未 granted 时的替代内容
  requireStandalone?: StandaloneRequirement,  // 默认 'mobile-only'
  enabled?: boolean,                 // 默认 true
  bypassStorageKey?: string | null,  // localStorage key
  rememberBypass?: boolean,          // 默认 true
  showContinue?: boolean,            // 默认 true
  onBypassChange?: (bypassed: boolean) => void,
}): JSX.Element
```

---

## 注意事项

1. **mobile-only 语义**：桌面端（非 mobile）无论是否 standalone 都直接放行。只有移动端需要 standalone。
2. **bypass 持久化**：写入 localStorage，刷新后仍 bypass。清除 bypass 需手动 `localStorage.removeItem(key)`。
3. **三次 useState**：granted / bypassed / standalone / isMobile 分开存，避免 stale closure。
4. **onStandaloneChange 监听 display-mode**：用户从浏览器 "添加到主屏" 后，display-mode 从 browser 变为 standalone，PwaGate 会自动重新判定。
