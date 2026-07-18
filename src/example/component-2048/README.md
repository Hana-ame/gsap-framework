# Component2048Display

2048 游戏。纯 PIXI UI（无 React DOM），swipe/click 操作。

## 功能

- 键盘箭头 / swipe 手势操作
- 可调行数/列数（3-10）
- 计分板
- 游戏状态全部在模块级 `let state`（不用 React state），单个 useEffect 挂载 canvas
- cells 始终正方形

## 架构约定

- 唯一一个 `useEffect` 负责挂载/卸载 PIXI app
- 游戏状态变化原地 `buildBoard`，不触发 React re-render
- `return <></>`，所有 UI 在 PIXI 内
