# LauncherDisplay

应用主页。tile grid 列出所有示例路由，带 filter 搜索。

## 功能

- 24 个示例入口，每项含 glyph/label/hint/accent 色
- 实时 filter（匹配 label / hint / route）
- 右上角时钟
- 响应式 grid 布局
- CSS focus-visible 键盘支持
- 路由切换通过 `window.location.hash = '#...'`

## 约定

- Launcher 是唯一使用 React DOM（非 PIXI）的页面
- `LauncherDisplay.head` 挂载 meta 信息供未来头部注入用
