# Pixi.js React 测试项目 (带时间戳事件日志)

## 一、项目概述与上下文

本项目是一个基于 **PixiJS v8** 和 **React** 的测试框架，采用**解耦的控制器-插件架构**。主要目标是通过 React 组件方便地控制 Pixi 画布进行绘图，并实时接收画布上的用户交互事件（带时间戳），以便调试和分析。

### 核心架构

- **`PixiController`**：消息中枢。负责管理插件、分发绘图指令，并将画布事件（如点击、移动）传递给 React 父组件。所有消息均包含时间戳。
- **`PixiCanvas`**：React 组件。封装 Pixi 应用的生命周期（初始化、销毁），监听画布上的鼠标/触摸事件，并通过 Controller 发送带时间戳的事件。
- **插件系统**：独立的绘图插件（对象字面量形式），每个插件声明自己能处理的消息类型，并包含具体的绘图逻辑。插件是函数式的，无需实例化。

## 二、技术指南：逻辑流程

### 1. 初始化阶段

- `App.tsx` 创建 `PixiController` 实例。
- 注册插件：调用 `controller.registerPlugin(pluginObject)`，传入符合 `PixiPlugin` 接口的对象（如 `circlePlugin`）。
- 设置父组件消息处理器：`controller.onMessageFromParent(handler)`，该处理器负责将画布事件显示在 UI 日志中。
- 渲染 `PixiCanvas` 组件，传入 `controller` 和 `onAppInit` 回调。

### 2. 画布初始化

- `PixiCanvas` 内部创建 `PIXI.Application` 并异步初始化。
- 初始化完成后，将 `app` 实例通过 `onAppInit` 回调传回 `App.tsx`。
- `App.tsx` 调用 `controller.setApp(app)`，使控制器持有 `app` 引用，以便后续插件执行绘图。

### 3. 用户交互事件流

- 用户在画布上操作（鼠标/触摸），`PixiCanvas` 监听相应事件（`pointerdown`、`pointermove` 等）。
- 事件处理器构造消息对象：包含 `type`、坐标 `x`/`y`、`timestamp`（`Date.now()`）等。
- 调用 `controller.sendToParent(message)` 将消息发送给父组件。
- 父组件的处理器格式化日志并更新 UI。

### 4. 绘图指令流

- 用户点击 UI 按钮（如“画圆”），`App.tsx` 调用 `sendDrawCommand('drawCircle')`。
- 构造绘图消息对象，包含 `type`、随机坐标、颜色等。
- 调用 `controller.sendToPixi(message)`。
- 控制器遍历已注册插件，寻找 `messageTypes` 包含该 `type` 的插件。
- 找到后调用插件的 `execute(message, app)` 方法，在画布上绘制图形。
- 若没有插件处理该类型，控制台输出警告。

### 5. 清理阶段

- `PixiCanvas` 组件卸载时，自动销毁 `PIXI.Application` 实例，释放资源。

## 三、当前版本功能 (Version 2.2.0)

### ✨ 新增功能

1. **DVD屏保风格反弹动画**：画布启动后自动出现一个彩色DVD标志，在画布内匀速移动并触碰边界反弹。动画通过 `bounce.plugin.ts` 插件实现。
2. **插件支持持续性动画**：首次在插件中引入状态管理和 `PIXI.Ticker`，为后续复杂动画提供范例。
3. **增强的插件协作**：`bouncePlugin` 同时监听 `clear` 消息，在画布清除时自动停止动画，避免资源泄露。

### ✅ 继承保留的功能

- 插件注册与消息分发机制。
- 通过按钮发送绘图指令（画圆、矩形、清除）。
- 画布生命周期管理。
- 带时间戳的事件日志。

## 四、使用方法

1. **安装依赖**:
   ```bash
   npm install pixi.js@8.x react react-dom
   ```
