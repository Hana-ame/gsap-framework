# index.css

全局 CSS reset — `box-sizing: border-box` + 全屏 `html/body/#root` + 安全区变量。

---

## 内容

```css
:root, * { box-sizing: border-box; }

:root {
  --safe-top / --safe-bottom / --safe-left / --safe-right
  // env(safe-area-inset-*) 的 fallback，PWA standalone 模式下刘海屏适配
}

html, body, #root {
  margin: 0; padding: 0;
  width: 100%; height: 100%;
  overflow: hidden;
  background: #000;
}
```

---

## 注意事项

1. **safe-area 变量**：`env(safe-area-inset-top)` 在非 standalone 模式下 fallback 为 `0px`。PwaGate 和 LauncherDisplay 的 padding 用这些变量。
2. **overflow: hidden**：阻止浏览器默认滚动，所有内容由 canvas 或 fixed 定位元素接管。
3. **background: #000**：Three.js 和 PIXI 的 canvas 都是 `position: fixed` 全屏，黑色背景作为底层兜底。
