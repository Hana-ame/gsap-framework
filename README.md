# Pixi.js React 测试项目 - 开发提示 (PROMPT.md)

## 一、项目概述与上下文

本项目旨在创建一个基于 **PixiJS v8** 和 **React** 的测试框架，核心目标是实现一个**解耦的、可扩展的控制器-插件架构**。通过该架构，可以方便地在 React 组件中控制 Pixi 画布进行绘图，并接收画布的用户输入事件。项目特别设计了插件系统，以便未来能灵活接入 WebSocket 等数据源，将外部指令映射为绘图操作。

### 核心架构
- **`PixiController`**：消息中枢。负责管理插件和消息分发，不依赖任何渲染逻辑。
- **`PixiCanvas`**：React 组件。负责 Pixi 应用的生命周期管理，并将用户输入（点击、按键）通过 Controller 发送出去。
- **插件系统**：独立的、可组合的模块。每个插件声明自己能处理的消息类型，并包含具体的绘图逻辑。未来可扩展为从 WebSocket 接收消息并触发的形式。

## 二、当前进度与状态检查 (截至本次对话)

根据您仓库 `sim` 分支的代码，当前已完成以下工作：

### ✅ 已完成的核心部分
1.  **控制器 (`PixiController.ts`)**:
    *   实现了基础的插件注册 (`registerPlugin`) 和消息分发 (`sendToPixi`) 机制。
    *   实现了向父组件发送消息 (`sendToParent`) 和监听来自 Pixi 消息 (`onMessageFromPixi`) 的功能。
    *   **当前局限性**：插件被定义为简单的 `(message: any) => void` 函数，尚未实现按 `message.type` 分发和错误处理的标准接口。

2.  **画布组件 (`PixiCanvas.tsx`)**:
    *   正确使用 PixiJS v8 的异步 `init` 方法初始化应用。
    *   管理了应用的生命周期（创建、挂载、清理），避免了常见的内存泄漏问题。
    *   **当前局限性**：消息处理逻辑（`messagePlugin`）是直接在组件内部定义的，包含了对 `drawCircle`, `drawRectangle`, `clear` 等指令的硬编码处理，**尚未拆分为独立的插件文件**。目前仅注册了一个包含所有逻辑的插件。

3.  **测试界面 (`App.tsx`)**:
    *   提供了一个简单的工具栏，用于发送测试绘图指令。
    *   展示了如何监听来自 Pixi 的消息，并将日志显示在界面上。

## 三、下一步开发指南

根据您的需求“使用插件来对 controller 进行处理”以及“插件需要在另一个文件中进行定义，可能有复数插件”，下一步的核心任务是**重构插件系统，使其模块化、可配置**。

### 🚩 首要任务：实现标准化的插件接口与多插件管理

**目标**：将 `PixiCanvas` 内的硬编码绘图逻辑，拆分为独立的、遵循统一接口的插件文件。

#### 1. 定义插件接口 (在 `src/controllers/PixiController.ts` 或新建 `src/plugins/plugin.types.ts`)

需要定义一个清晰的插件接口，包含其能处理的消息类型和执行方法。

```typescript
// src/plugins/plugin.types.ts (示例)
import * as PIXI from 'pixi.js';

export interface PixiPlugin {
  /** 此插件能够处理的消息类型列表 */
  messageTypes: string[];
  /** 执行绘图逻辑。若消息类型不匹配或参数错误，应抛出错误。 */
  execute(message: any, app: PIXI.Application): void;
}

// 同时，需要修改控制器中的 Plugin 类型，以支持新的接口。
// 控制器内部可以存储一个包装函数，该函数检查 message.type 并调用对应插件的 execute。