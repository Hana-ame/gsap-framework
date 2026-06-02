# isMobile

移动端检测 — 综合多信号判断是否为移动设备。

---

## 调用栈

### 检测
```
detectMobile()
  ├─ matchMedia('(pointer: coarse)')     → evidence.push('pointer-coarse')
  ├─ matchMedia('(hover: none)')         → evidence.push('hover-none')
  ├─ matchMedia('(max-width: 768px)')    → evidence.push('small-viewport')
  ├─ navigator.maxTouchPoints > 1        → evidence.push('touch-points')
  └─ /Android|iPhone|.../i.test(ua)      → evidence.push('ua')

  evidence.length >= 2 → isMobile = true
```

---

## API

```ts
type MobileEvidence = 'pointer-coarse' | 'hover-none' | 'small-viewport' | 'touch-points' | 'ua';

interface MobileDetection {
  isMobile: boolean;
  evidence: MobileEvidence[];
}

function detectMobile(): MobileDetection
function isMobile(): boolean  // detectMobile().isMobile 的简写
```

---

## 注意事项

1. **≥2 个信号才判定为 mobile**：单信号不够可靠（比如桌面 Chrome 开 devtools 模拟 touch 只有 `touch-points`）。
2. **SSR 安全**：`typeof window === 'undefined'` 时返回 `isMobile: false`。
3. **768px 断点**：和 CSS `@media (max-width: 768px)` 一致。iPad Pro 在竖屏时 viewport > 768px，可能不触发 `small-viewport`，但 `pointer-coarse` + `touch-points` 仍够。
