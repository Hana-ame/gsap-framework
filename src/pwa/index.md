# pwa/index.ts

 barrel export — 导出 PWA 模块的所有公开 API。

---

## 导出

```ts
export { isStandalone, onStandaloneChange } from './standalone';
export { detectMobile, isMobile, type MobileDetection, type MobileEvidence } from './isMobile';
export { InstallPrompt, detectInstallPlatform, type InstallPromptProps, type InstallPlatform } from './InstallPrompt';
export { PwaGate, isAccessGranted, setBypass, type PwaGateProps, type StandaloneRequirement } from './PwaGate';
```

---

## 注意事项

1. **纯 re-export**：无逻辑，只做模块聚合。外部 `import { PwaGate } from './pwa'` 走这个文件。
