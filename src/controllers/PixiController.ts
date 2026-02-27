// ============================================================
// 文件: src/controllers/PixiController.ts
// 用途: Pixi 控制器，作为消息中枢。管理插件、分发绘图消息，
//       并负责将画布事件（带时间戳）发送给 React 父组件。
// 上下文: 被 PixiCanvas 和 React 组件使用。它不依赖具体渲染逻辑，
//        只负责消息路由。
//
// Outline:
// 1. 导入插件类型
// 2. PixiController 类定义
//    a. 私有属性: plugins, parentMessageHandler, app
//    b. 构造函数
//    c. 注册插件方法: registerPlugin (接受符合 PixiPlugin 接口的对象)
//    d. 设置应用实例: setApp
//    e. 发送消息到 Pixi (绘图): sendToPixi
//    f. 发送消息到父组件: sendToParent
//    g. 监听来自父组件的消息: onMessageFromParent
//
// 注意事项:
//   - 插件可以是对象字面量或类实例，只需包含 messageTypes 和 execute。
//   - 调用 sendToPixi 前必须通过 setApp 设置 Pixi 应用实例。
// ============================================================

import { PixiPlugin } from '../plugins/plugin.types';
import * as PIXI from 'pixi.js';

/**
 * PixiController 类
 * 
 * 作为整个绘图模块的消息中枢，负责：
 * 1. 管理所有注册的插件（绘图指令的具体实现）
 * 2. 接收来自 React 父组件的消息，并分发给匹配的插件执行（通过 sendToPixi）
 * 3. 接收来自 PixiCanvas 的交互事件（带时间戳），并转发给 React 父组件（通过 sendToParent）
 * 4. 持有 PIXI.Application 实例，供插件在 execute 方法中访问画布和渲染资源
 * 
 * 该控制器本身不包含任何绘图逻辑，完全依赖插件实现，符合开闭原则。
 */
export class PixiController {
  /**
   * 已注册的插件数组
   * @private
   * 插件必须符合 PixiPlugin 接口，包含：
   * - name?: string         （可选，用于调试）
   * - messageTypes: string[]（该插件能够处理的消息类型列表）
   * - execute: (message: any, app: PIXI.Application) => void（执行方法）
   */
  private plugins: PixiPlugin[] = [];

  /**
   * 父组件消息处理器（回调函数）
   * @private
   * 由 onMessageFromParent 设置，当调用 sendToParent 时执行此函数，
   * 将消息传递给 React 父组件。
   */
  private parentMessageHandler?: (message: any) => void;

  /**
   * PIXI.Application 实例引用
   * @private
   * 必须通过 setApp 方法注入，之后才能正常处理 sendToPixi 消息。
   * 插件在执行 execute 时会使用此 app 进行渲染操作。
   */
  private app: PIXI.Application | null = null;

  /**
   * 构造函数，初始化控制器。
   * 此时 app 和 parentMessageHandler 均为空，需后续通过 setApp 和 onMessageFromParent 设置。
   */
  constructor() {}

  /**
   * 设置 Pixi 应用实例，供插件执行时使用
   * 
   * 在 PixiCanvas 组件初始化并创建 PIXI.Application 后调用此方法，
   * 将应用实例注入控制器，之后 sendToPixi 才能正常工作。
   * 
   * @param app - Pixi.Application 实例，包含 stage、renderer 等核心对象
   */
  setApp(app: PIXI.Application): void {
    this.app = app;
  }

  /**
   * 注册一个插件
   * 
   * 插件可以是对象字面量或类实例，只要符合 PixiPlugin 接口即可。
   * 注册后，当 sendToPixi 接收到消息时，会根据 message.type 匹配插件列表，
   * 找到第一个 messageTypes 包含该类型的插件并执行其 execute 方法。
   * 
   * @param plugin - 符合 PixiPlugin 接口的插件对象
   */
  registerPlugin(plugin: PixiPlugin): void {
    this.plugins.push(plugin);
    console.log(`[Controller] 插件已注册: ${plugin.name || '未命名插件'}`);
  }

  /**
   * 向 Pixi 发送消息（通常用于绘图指令）
   * 
   * 此方法由 React 父组件调用（例如通过 PixiCanvas 组件的引用），
   * 用于触发绘图操作。消息必须包含 type 字段，控制器会根据 type
   * 遍历已注册插件，找到第一个能处理该类型的插件并执行。
   * 
   * 执行流程：
   * 1. 检查 app 是否已设置，若未设置则打印警告并返回
   * 2. 遍历 plugins 数组，对每个插件检查 message.type 是否在其 messageTypes 中
   * 3. 若匹配，则调用该插件的 execute 方法，传入消息对象和 app 实例
   * 4. 若 execute 抛出异常，捕获并打印错误，继续尝试其他插件？不，这里用 some() 找到第一个处理后就停止
   * 5. 若没有插件处理该消息类型，打印提示信息
   * 
   * @param message - 消息对象，至少应包含 { type: string }，其他字段由插件自行解析
   */
  sendToPixi(message: any): void {
    if (!this.app) {
      console.warn('[Controller] Pixi 应用实例未设置，无法执行插件');
      return;
    }

    console.log(`[Controller] 收到消息发往 Pixi:`, message);

    // 使用 some() 方法遍历插件，一旦找到能处理该消息的插件并成功执行，即停止遍历
    const handled = this.plugins.some(plugin => {
      if (plugin.messageTypes.includes(message.type)) {
        try {
          plugin.execute(message, this.app!);
          return true; // 处理成功，some 循环终止
        } catch (error) {
          console.error(`[Controller] 插件 ${plugin.name || '未知'} 执行失败:`, error);
          return false; // 执行失败，继续尝试其他插件
        }
      }
      return false; // 不匹配，继续下一个插件
    });

    if (!handled) {
      console.log(`[Controller] 没有插件处理消息类型: ${message.type}`);
    }
  }

  /**
   * 向父组件（通常是 React 组件）发送消息
   * 
   * 此方法由 PixiCanvas 内部调用，用于将用户交互事件（如点击、拖拽等）
   * 传递回 React 父组件。父组件需提前通过 onMessageFromParent 设置监听器。
   * 消息中应包含时间戳（timestamp），以便父组件处理时间相关的逻辑。
   * 
   * @param message - 消息对象，建议至少包含 { type: string, timestamp: number }，
   *                  具体字段由父组件和 PixiCanvas 约定
   */
  sendToParent(message: any): void {
    if (this.parentMessageHandler) {
      this.parentMessageHandler(message);
    } else {
      console.warn('[Controller] 父组件消息处理器未设置，消息被丢弃:', message);
    }
  }

  /**
   * 设置来自父组件的消息监听器
   * 
   * 父组件（如 React 组件）通过此方法注册一个回调函数，
   * 用于接收从 PixiCanvas 发送过来的事件消息。
   * 
   * @param handler - 处理函数，接收一个消息对象参数，无返回值
   */
  onMessageFromParent(handler: (message: any) => void): void {
    this.parentMessageHandler = handler;
  }

  /**
   * 获取当前注册的插件列表
   * 
   * 主要用于调试、测试或动态查看已注册插件。
   * 
   * @returns 插件数组的副本（直接返回引用，调用方不应修改）
   */
  getPlugins(): PixiPlugin[] {
    return this.plugins;
  }
}

// 重新导出类型，方便其他文件引用
export type { PixiPlugin };