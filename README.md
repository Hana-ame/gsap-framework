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
- 注册插件：调用 `controller.registerPlugin(pluginObject)`，传入符合 `PixiPlugin` 接口的对象（如 `circlePlugin`）。所有插件通过 `src/plugins/index.ts` 统一导入并循环注册。
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
- 插件通过监听 `clear` 消息等方式自行清理状态（如 API 演示插件会销毁其容器）。

## 三、当前版本功能 (Version 2.3.0)

### ✨ 新增功能

1. **API 教学演示插件**：新增 `apiDemoPlugin`，以一系列从简单到复杂的示例展示 PixiJS v8 的核心 API 使用。每个示例都配有详细的注释和说明，可作为插件开发的参考典范。
   - 包含八个独立演示：基础图形、文本样式、精灵、动画、滤镜、交互事件、容器层级、粒子系统。
   - 演示区域固定在画布左上角（50,50），尺寸 400x250，带半透明背景。
   - 通过发送 `apiDemo/basicShapes`、`apiDemo/text` 等消息触发对应演示。
2. **插件代码拆分**：将 `apiDemoPlugin` 拆分为多个文件（`types.ts`、`state.ts`、`utils.ts` 及独立演示模块），便于维护和扩展。

### ✅ 继承保留的功能

- 插件注册与消息分发机制。
- 通过按钮发送绘图指令（画圆、矩形、清除）。
- DVD 屏保反弹动画（`bouncePlugin`），每次撞击随机变色、随机方向。
- 鼠标跟随烟花效果（`fireworksPlugin`）。
- 画布生命周期管理，严格模式下的安全销毁。
- 带时间戳的事件日志。

## 四、使用方法

### 1. 安装依赖

```bash
npm install pixi.js@8.x react react-dom
```

### 2. 运行项目

```bash
npm run dev
```

### 3. 测试 API 演示

在 `App.tsx` 中添加以下按钮（或直接发送消息）：

```tsx
<button onClick={() => sendDrawCommand('apiDemo/basicShapes')}>API: 基础图形</button>
<button onClick={() => sendDrawCommand('apiDemo/text')}>API: 文本</button>
<button onClick={() => sendDrawCommand('apiDemo/sprite')}>API: 精灵</button>
<button onClick={() => sendDrawCommand('apiDemo/animation')}>API: 动画</button>
<button onClick={() => sendDrawCommand('apiDemo/filter')}>API: 滤镜</button>
<button onClick={() => sendDrawCommand('apiDemo/interaction')}>API: 交互</button>
<button onClick={() => sendDrawCommand('apiDemo/container')}>API: 容器</button>
<button onClick={() => sendDrawCommand('apiDemo/particles')}>API: 粒子</button>
```

点击后，画布左上角将显示对应的演示内容，并带有标题和说明文字。

### 4. 编写新插件

参考 `api-demo` 目录下的代码结构，创建新的插件文件并遵循 `PixiPlugin` 接口。在 `src/plugins/index.ts` 中导入并加入 `plugins` 数组即可自动注册。

## 五、注意事项

- API 演示插件监听了 `clear` 消息，当点击“清除”按钮时会自动销毁其容器并重置状态，确保后续演示正常显示。
- 所有演示内容都放在一个固定容器中，不会影响舞台上其他图形（如 DVD 动画、烟花）。
- 粒子演示使用了 `ParticleContainer` 优化性能，展示了大量粒子的动画效果。
- 如果需要在 React 组件中直接触发演示，只需调用 `controller.sendToPixi({ type: 'apiDemo/xxx' })` 即可。