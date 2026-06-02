# InstallPrompt

PWA 安装引导页面。根据平台（iOS / Android / other）显示不同的安装步骤，桌面端显示 "requires mobile device"。

---

## 调用栈

### 平台检测
```
InstallPrompt 渲染
  └─ useMemo(detectInstallPlatform, [])
       ├─ /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document) → 'ios'
       ├─ /Android/i.test(ua) → 'android'
       └─ else → 'other'
```

### 渲染分支
```
isMobile === false
  └─ "requires a mobile device" + "Please open this URL on your phone."

isMobile === true
  └─ "Install {appName}"
       ├─ platform === 'ios'    → <IOSSteps />    (Share → Add to Home Screen → Add)
       ├─ platform === 'android' → <AndroidSteps /> (⋮ → Install app → Install)
       └─ platform === 'other'  → <OtherSteps />  (浏览器菜单安装)
       └─ onContinue ? <button "Continue in browser"> : null
```

---

## API

```ts
function detectInstallPlatform(): 'ios' | 'android' | 'other'

function InstallPrompt({
  isMobile: boolean,           // 是否移动设备
  onContinue: (() => void) | null,  // "Continue in browser" 回调，null 则不显示按钮
  appName?: string,            // 应用名（默认 "this app"）
  className?: string,
}): JSX.Element
```

---

## 注意事项

1. **平台检测不精确**：iPad 在 iOS 13+ 的 Safari 里 UA 包含 "Mac"，用 `'ontouchend' in document` 兜底。
2. **dangerouslySetInnerHTML**：步骤文本用 `<strong>` 标签，`<NumberedSteps>` 用 `dangerouslySetInnerHTML` 渲染。来源可信（硬编码），无 XSS 风险。
3. **safe-area padding**：shell 的 padding 用 `env(safe-area-inset-*)` 适配刘海屏。
4. **z-index: 2147483647**：覆盖所有内容，和 ErrorBoundary 同级。
