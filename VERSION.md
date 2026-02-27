# 版本更新与开发日志 (VERSION.md)

## 文件说明

### 用途

本文档用于记录本项目（Pixi.js React 测试框架）的所有重要变更、开发过程中遇到的困难、解决方案以及每个版本的功能状态。它是项目的“活历史”，帮助开发者理解设计决策和演进脉络。

### 结构

- **版本条目**：按时间倒序排列，每个版本包含版本号、发布日期、更新内容、困难与修正、功能列表、测试验证和待办事项。
- **困难与修正**：详细描述开发中遇到的典型问题（技术难点、设计缺陷等）以及最终的解决方案，为后续类似问题提供参考。

### 使用方法

- 每次完成一个功能迭代或修复重要问题后，在此文件的顶部（`Unreleased` 区域或新版本）添加变更记录。
- 描述更新内容时，应清晰区分“新增”、“修改”、“修复”、“移除”等类型。
- “困难与修正”部分应包含问题背景、尝试的解决方案、最终选定的方案及其理由。

### 注意事项

- 版本号遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)。
- 所有日期采用 ISO 格式（YYYY-MM-DD）。
- 保持语言简洁、客观，避免主观评价。

---

## [Unreleased]

### 计划中功能

- WebSocket 自动消息映射
- 插件热加载
- 更多图形插件
- 单元测试

---

## [0.3.0] - 2025-02-27

### 核心更新

- **新增 DVD 屏保风格反弹动画**：通过 `bounce.plugin.ts` 插件实现，画布初始化后自动启动一个彩色“DVD”标志，在画布内匀速移动并边界反弹。
- **插件支持持续性动画**：首次在插件中引入状态管理（使用 `WeakMap` 存储每个 `app` 实例的精灵、速度、ticker 回调），并利用 `PIXI.Ticker` 实现连续更新。
- **插件间协作**：`bouncePlugin` 同时监听 `clear` 消息，在画布被清除时主动停止动画、销毁精灵，避免资源泄露和无效更新。
- **新增 SVG 资源**：在 `src/assets/dvd-logo.svg` 中添加测试用的 DVD 标志图片。
- **更新测试界面**：`App.tsx` 在 `handleAppInit` 中自动发送 `startDVD` 消息，日志记录启动动作。

### 困难与修正过程

#### 困难 1：如何在现有插件架构中实现持续性动画

- **问题**：原插件系统设计为一次性的消息响应（`execute` 方法执行一次绘图），无法直接支持需要持续运行的动画。
- **尝试**：
  - 在插件外部（如 `App.tsx`）直接使用 `app.ticker` 管理动画，但这样会破坏插件的封装性，且无法利用插件系统的消息分发优势。
  - 在插件内部使用全局变量存储状态，但多个 `app` 实例（如热重载）会导致状态混乱。
- **解决**：采用 `WeakMap` 以 `app` 实例为键存储每个画布独立的动画状态。插件通过 `messageTypes` 监听 `startDVD` 和 `clear` 消息，在 `execute` 中根据消息类型调用对应的启动/停止函数。启动函数中创建精灵、设置速度，并将更新函数添加到 `app.ticker`；停止函数则移除 ticker 并销毁精灵。这样既保持了插件的独立性，又支持了持续性行为。

```typescript
const appState = new WeakMap<
  PIXI.Application,
  {
    sprite: PIXI.Sprite | null;
    velocity: { x: number; y: number };
    tickerCallback: (() => void) | null;
    isAnimating: boolean;
  }
>();
```

#### 困难 2：清除画布时动画未停止导致报错

- **问题**：当用户点击“清除”按钮时，`clear.plugin.ts` 会移除舞台上所有子对象，包括 DVD 精灵。但动画的 ticker 回调仍在运行，尝试访问已被销毁的精灵导致报错。
- **尝试**：在 `clear.plugin` 中通知 `bouncePlugin`，但插件之间不应直接耦合。
- **解决**：让 `bouncePlugin` 也监听 `clear` 消息。当收到 `clear` 时，主动停止动画（移除 ticker 并销毁精灵）。由于控制器会遍历所有插件执行，`clearPlugin` 和 `bouncePlugin` 都会收到消息，且执行顺序无关紧要（`bouncePlugin` 提前停止动画，`clearPlugin` 移除所有子对象时精灵已不存在，安全）。

#### 困难 3：SVG 异步加载与动画启动时机

- **问题**：`PIXI.Assets.load` 是异步的，如果在加载完成前用户执行了清除或其他操作，可能导致动画状态不一致。
- **解决**：在 `startBounce` 函数中使用 `async/await`，加载完成后才创建精灵并添加到舞台。加载期间如果收到 `clear`，则 `stopBounce` 会清除状态，加载完成后检测到 `isAnimating` 为 `false` 则不会继续。同时，在加载失败时输出错误，避免静默失败。

#### 困难 4：多次启动导致多个精灵重叠

- **问题**：如果多次发送 `startDVD` 消息，`execute` 会再次调用 `startBounce`，可能创建多个精灵。
- **解决**：在 `startBounce` 开头先调用 `stopBounce` 清理已有动画，确保每次启动都是全新的。同时，通过 `isAnimating` 标志防止重复启动。

### 当前功能列表

- **PixiController**：管理插件注册、消息分发、事件回调。
- **PixiCanvas**：封装 Pixi 应用生命周期，捕获用户事件并抛出。
- **插件系统**：
  - `clear.plugin.ts`：清空画布。
  - `circle.plugin.ts`：绘制圆形。
  - `rectangle.plugin.ts`：绘制矩形。
  - **`bounce.plugin.ts`**：DVD 反弹动画（新增）。
- **WebSocket 基础**：提供连接管理与消息接收（需手动桥接至控制器）。
- **测试界面**：按钮触发绘图，实时显示事件日志，自动启动 DVD 动画。

### 测试验证

#### 测试 1：DVD 动画自动启动

- **操作**：启动应用。
- **预期结果**：画布上出现彩色“DVD”标志，并开始匀速移动，碰到边界反弹。日志区显示“启动 DVD 反弹动画”。
- **实际结果**：✅ 通过。

#### 测试 2：动画与绘图共存

- **操作**：点击“画圆”按钮。
- **预期结果**：画布上出现圆形，DVD 动画继续不受影响。
- **实际结果**：✅ 通过。

#### 测试 3：清除画布停止动画

- **操作**：点击“清除”按钮。
- **预期结果**：画布上所有图形（包括 DVD 标志）消失，动画停止。控制台无报错。
- **实际结果**：✅ 通过。

#### 测试 4：清除后再绘图

- **操作**：清除后点击“画圆”。
- **预期结果**：画布上出现圆形，但 DVD 标志不出现（因为动画已停止且未重启）。
- **实际结果**：✅ 通过。

#### 测试 5：点击画布事件

- **操作**：点击画布任意位置。
- **预期结果**：日志显示点击事件和坐标。
- **实际结果**：✅ 通过。

#### 🗑️ 待移除内容

- **`src/components/TestJSX.jsx`**：计划在下一个版本中删除。

---

## [0.2.0] - 2025-02-27

### 核心更新

- **完全模块化的插件系统**：所有绘图指令从 `PixiCanvas` 组件中剥离，拆分为独立插件（`clear.plugin.ts`、`circle.plugin.ts`、`rectangle.plugin.ts`）。
- **标准化插件接口**：定义 `PixiPlugin` 类型（`messageTypes` + `execute`），控制器按消息类型分发。
- **WebSocket 服务基础**：创建 `websocket.service.ts` 和 `useWebsocket.ts`，提供 WebSocket 连接管理与消息接收能力。
- **双向通信增强**：`PixiController` 支持 `sendToParent` 和 `onMessageFromPixi`，实现 React 组件与 Pixi 画布的事件互传。
- **错误处理机制**：控制器捕获插件执行中的异常，并通过 `sendToParent` 上报错误，避免应用崩溃。
- **测试界面优化**：`App.tsx` 显示事件日志，集成错误边界组件。

### 困难与修正过程

#### 困难 1：如何设计插件接口以实现消息路由

- **问题**：0.1.0 版本将所有绘图逻辑硬编码在 `PixiCanvas` 的一个函数中，新增指令必须修改组件内部代码，扩展性差。
- **尝试**：最初尝试让每个插件接收整个消息对象，并在插件内部通过 `switch` 判断类型，但导致插件间职责重叠。
- **解决**：定义插件接口，要求每个插件声明自己能处理的 `messageTypes` 列表。控制器遍历插件，找到第一个匹配 `message.type` 的插件，调用其 `execute` 方法。这样职责单一，新增插件只需注册即可。

```typescript
// plugin.types.ts
export interface PixiPlugin {
  messageTypes: string[];
  execute(message: any, app: PIXI.Application): void;
}
```

#### 困难 2：PixiJS v8 的异步初始化与 React 生命周期的协调

- **问题**：PixiJS v8 的 `Application.init()` 是异步的，如果在组件渲染过程中多次触发初始化，会导致内存泄漏和应用状态混乱。
- **尝试**：使用 `useEffect` 的空依赖数组（`[]`）确保只初始化一次，但组件卸载时需清理。最初未正确清理事件监听器，导致切换路由后画布仍占用资源。
- **解决**：在 `useEffect` 的清理函数中调用 `app.destroy(true)`，并移除所有通过 `app.stage.eventMode` 添加的监听器。同时使用 `useRef` 存储 app 实例，避免异步过程中状态丢失。

```tsx
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const app = new PIXI.Application();
      await app.init({ ... });
      if (!isMounted) { app.destroy(); return; }
      // 存储 app 实例...
    })();
    return () => { isMounted = false; appRef.current?.destroy(true); };
  }, []);
```

#### 困难 3：WebSocket 消息如何触发插件执行而不产生循环依赖

- **问题**：WebSocket 服务需要调用 `PixiController` 的 `sendToPixi` 方法，但控制器又可能依赖 WebSocket 服务（例如通过插件发送消息出去）。直接引入会造成循环依赖。
- **尝试**：最初在 `websocket.service.ts` 中导入 `PixiController`，但在大型项目中会导致依赖混乱。
- **解决**：采用依赖注入方式：在 `useWebsocket` 钩子中接收一个 `onMessage` 回调，由上层组件（如 `App.tsx`）将 `controller.sendToPixi` 作为回调传入。这样 WebSocket 服务只负责解析消息，不直接依赖控制器。

```tsx
  // useWebsocket.ts
  export const useWebsocket = (url: string, onMessage: (data: any) => void) => { ... }
  // App.tsx
  useWebsocket('ws://localhost:8080', controller.sendToPixi);
```

#### 困难 4：用户点击画布需要同时生成两个点（红色固定、蓝色随机）

- **问题**：这个需求看似简单，但涉及事件坐标转换（canvas 坐标系到 Pixi 坐标系）和随机逻辑的复用。
- **尝试**：在 `PixiCanvas` 中直接计算点击坐标并发送消息，但随机点逻辑如果放在组件内会破坏插件独立性。
- **解决**：由插件系统处理：点击事件触发 `canvasClick` 消息，`circle.plugin.ts` 同时监听 `drawCircle` 和 `canvasClick` 两种类型，在 `execute` 中根据消息类型决定绘制红色点（使用消息中的坐标）还是生成随机蓝色点。这样保持了插件的内聚性。

### 当前功能列表

- **PixiController**：管理插件注册、消息分发、事件回调。
- **PixiCanvas**：封装 Pixi 应用生命周期，捕获用户事件并抛出。
- **插件系统**：
  - `clear.plugin.ts`：清空画布。
  - `circle.plugin.ts`：绘制圆形（支持固定坐标和随机生成）。
  - `rectangle.plugin.ts`：绘制矩形（支持边框和填充）。
- **WebSocket 基础**：提供连接管理与消息接收（需手动桥接至控制器）。
- **测试界面**：按钮触发绘图，实时显示事件日志。

### 测试验证

#### 测试 1：点击 Canvas 交互

- **操作**：在画布任意位置点击。
- **预期结果**：
  - 点击位置出现一个红色圆点。
  - 画布随机位置出现一个蓝色圆点。
- **实际结果**：✅ 通过。红色点精确显示，蓝色点随机生成。

#### 测试 2：按钮触发绘图

- **操作**：点击“绘制矩形”和“绘制圆形”按钮。
- **预期结果**：画布上分别绘制一个矩形（黑色边框）和一个圆形（蓝色填充）。
- **实际结果**：✅ 通过。

#### 测试 3：错误边界触发

- **操作**：在插件中故意抛出错误（如修改 `circle.plugin.ts` 使其崩溃）。
- **预期结果**：错误被控制器捕获，并通过 `sendToParent` 发送，界面显示错误提示，但画布其他功能正常。
- **实际结果**：✅ 通过。

#### 🗑️ 待移除内容

- **`src/components/TestJSX.jsx`**：这是一个早期测试组件，功能已被 `App.tsx` 覆盖，计划在下一个版本中删除。

---


## [0.1.0] - 2025-02-20

### 初始功能

- 搭建 React + TypeScript + PixiJS v8 项目基础结构。
- 创建 `PixiController` 作为简单消息中枢，支持注册单一插件（函数式）。
- 创建 `PixiCanvas` 组件，实现 Pixi 应用的初始化和销毁。
- 在 `App.tsx` 中提供测试按钮，直接调用硬编码的绘图函数（`drawCircle`、`drawRectangle`、`clear`）。
- 点击画布时在点击位置绘制红色点，并随机生成蓝色点（逻辑混合在组件中）。

### 困难与修正过程

#### 困难 1：PixiJS v8 与 React 的首次集成

- **问题**：对 PixiJS v8 的异步 API 不熟悉，导致应用初始化时机错误，有时画布空白。
- **解决**：查阅官方文档，确认 v8 的 `init` 方法返回 Promise，必须在异步函数中调用。使用 `useEffect` 和 `async/await` 确保初始化完成后再挂载视图。

#### 困难 2：事件监听器清理

- **问题**：在组件卸载时未移除 Pixi 的事件监听器，导致多次进入页面后监听器重复累积。
- **解决**：在 `useEffect` 清理函数中调用 `app.stage.removeAllListeners()` 并销毁应用。

#### 困难 3：代码组织混乱

- **问题**：所有绘图逻辑堆砌在 `PixiCanvas` 的 `messagePlugin` 函数中，难以维护和扩展。
- **解决**：此版本未解决，仅作为快速原型，为后续重构提供基础。

