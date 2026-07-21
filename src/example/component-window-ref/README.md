# WindowBorder + LayoutGroup

验证 gown.js 模式的应用：
- `WindowBorder` — 窗口背景+边框，`resize()` 时 Graphics 重绘（虚检 `_dirty`）
- `LayoutGroup` — 惰性求值布局，`addChild` 设脏 → `onRender` 自动排列
- `createWindow` 装饰随 resize 正确更新
