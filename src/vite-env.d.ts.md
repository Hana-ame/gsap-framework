# vite-env.d.ts

Vite 客户端类型引用 + `.jsx` 模块声明。

---

## 内容

```ts
/// <reference types="vite/client" />

declare module '*.jsx' {
  const value: any
  export default value
}
```

- `vite/client` 提供 `import.meta.env` 类型、HMR 类型等
- `.jsx` 模块声明让 TS 不报错（Vite 默认只处理 `.tsx`）

---

## 注意事项

1. **重复声明**：文件里有两段 `declare module '*.jsx'`，第二段（更精确的 `ComponentType` 版本）会覆盖第一段。保留两段是历史遗留，不影响编译。
