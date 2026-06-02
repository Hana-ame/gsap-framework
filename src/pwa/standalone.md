# standalone

检测当前是否以 standalone 模式运行（PWA 已安装并从主屏启动）。

---

## 调用栈

### 检测
```
isStandalone()
  ├─ navigator.standalone === true              // iOS Safari
  ├─ matchMedia('(display-mode: standalone)')   // Chrome / Samsung Internet
  ├─ matchMedia('(display-mode: fullscreen)')   // 全屏模式
  └─ matchMedia('(display-mode: minimal-ui)')   // minimal-ui 模式
```

### 变化监听
```
onStandaloneChange(cb)
  └─ matchMedia('(display-mode: standalone)').addEventListener('change', handler)
       └─ cb(e.matches)  // standalone 状态变化时回调
```

---

## API

```ts
function isStandalone(): boolean
function onStandaloneChange(cb: (standalone: boolean) => void): () => void  // 返回 cleanup
```

---

## 注意事项

1. **iOS Safari**：`navigator.standalone` 是非标准属性，只在 iOS Safari PWA 模式下为 `true`。
2. **display-mode: standalone**：Chrome "添加到主屏" 后生效。`fullscreen` 和 `minimal-ui` 也算 standalone（用户可能通过不同方式安装）。
3. **SSR 安全**：`typeof window === 'undefined'` 时返回 `false` / 空 cleanup。
4. **老浏览器兼容**：`mql.addEventListener` 不存在时 fallback 到 `mql.addListener`（IE Mobile）。
