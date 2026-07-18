# ComponentLifeMapDisplay

Conway 在大型环形世界上的实现。Google Maps 风格鼠标拖拽平移。

## 功能

- 大型环形世界（toroidal wrap）
- 鼠标拖拽平移 viewport（drag threshold guard）
- 点击切换 cell 状态
- 动态 tile grid（zoom 小时自动扩展 tile 覆盖）
- 可调 zoom / rows / cols / speed
- 所有 viewport stepper 用模块级 `let` 变量 + named function handler，防 React Strict Mode 重复注册
