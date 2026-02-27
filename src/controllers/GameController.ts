// ============================================================
// 文件: src/controllers/GameController.ts
// 用途: 高级业务控制器，负责监听来自 PixiCanvas 的事件，
//       并转发给 PixiController 进行绘图，同时管理 UI 回调。
//       它将所有与业务逻辑相关的消息处理集中在此，使 App.tsx 保持简洁。
// 上下文: 在 App.tsx 中实例化，并传入 UI 日志回调。持有 PixiController 实例。
//
// 版本: 1.0.0
//    - 初始版本，将事件处理和命令发送从 App.tsx 迁移至此。
//
// Outline:
// 1. 构造函数接收 PixiController 实例和一个可选的日志回调。
// 2. 在构造函数中设置 PixiController 的 onMessageFromParent 监听器。
// 3. 定义公共方法，供 UI 按钮调用（如 drawCircle, startBalls 等），
//    这些方法构造消息并调用 pixiController.sendToPixi。
// 4. 提供 onAppInit 方法，用于在 PixiCanvas 初始化完成后调用，
//    设置 app 到 pixiController，并启动默认动画（如 DVD）。
// 5. 内部处理从画布收到的事件，更新日志（通过回调）并转发必要的消息（如 mouseMove）。
//
// 使用方法:
//   const pixiController = new PixiController();
//   const gameController = new GameController(pixiController, (logEntry) => {
//     // 更新 UI 日志
//   });
//   // 在 PixiCanvas 的 onAppInit 中调用 gameController.onAppInit(app)
//
// 注意事项:
//   - 所有业务逻辑相关的消息类型和参数都定义在此类的内部。
//   - 此类不直接依赖 React，只接受回调，方便单元测试。
// ============================================================

import { PixiController } from './PixiController';
import * as PIXI from 'pixi.js';

export type LogCallback = (logEntry: string) => void;

export class GameController {
  private pixiController: PixiController;
  private logCallback?: LogCallback;

  constructor(pixiController: PixiController, logCallback?: LogCallback) {
    this.pixiController = pixiController;
    this.logCallback = logCallback;

    // 设置画布事件监听器
    this.pixiController.onMessageFromParent((message) => {
      this.handleCanvasEvent(message);
    });
  }

  /**
   * 处理从画布发来的事件（由 PixiController 转发）
   */
  private handleCanvasEvent(message: any): void {
    // 格式化日志
    const timeStr = message.timestamp
      ? this.formatTimestamp(message.timestamp)
      : '未知时间';

    let logEntry = `[${timeStr}] 事件: ${message.type}`;
    if (message.x !== undefined && message.y !== undefined) {
      logEntry += ` 坐标: (${message.x.toFixed(2)}, ${message.y.toFixed(2)})`;
    }

    // 通过回调输出日志
    this.logCallback?.(logEntry);

    // 转发鼠标移动事件给插件（用于小球撞击）
    if (message.type === 'pointermove' && message.x !== undefined && message.y !== undefined) {
      this.pixiController.sendToPixi({
        type: 'mouseMove',
        x: message.x,
        y: message.y,
        timestamp: message.timestamp,
      });
    }
  }

  /**
   * 格式化时间戳为 HH:MM:SS.mmm
   */
  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * 当 PixiCanvas 初始化完成时调用，设置 app 并启动默认动画
   */
  onAppInit(app: PIXI.Application): void {
    this.pixiController.setApp(app);

    // 发送默认启动消息
    this.pixiController.sendToPixi({ type: 'startDVD' });
    this.pixiController.sendToPixi({ type: 'startFireworks' });

    this.logCallback?.(`[${new Date().toLocaleTimeString('zh-CN', { hour12: false, fractionalSecondDigits: 3 })}] 启动 DVD 反弹动画`);
  }

  // ----- 绘图命令方法（供 UI 按钮调用）-----

  drawCircle(): void {
    const message = {
      type: 'drawCircle',
      timestamp: Date.now(),
      x: Math.random() * 400 + 200,
      y: Math.random() * 300 + 150,
      radius: 30,
      color: Math.random() * 0xffffff,
    };
    this.pixiController.sendToPixi(message);
    this.logCallback?.(`[${this.formatTimestamp(message.timestamp)}] 发送绘图指令: drawCircle`);
  }

  drawRectangle(): void {
    const message = {
      type: 'drawRectangle',
      timestamp: Date.now(),
      x: Math.random() * 400 + 200,
      y: Math.random() * 300 + 150,
      width: 60,
      height: 40,
      color: Math.random() * 0xffffff,
    };
    this.pixiController.sendToPixi(message);
    this.logCallback?.(`[${this.formatTimestamp(message.timestamp)}] 发送绘图指令: drawRectangle`);
  }

  clearCanvas(): void {
    this.pixiController.sendToPixi({ type: 'clear', timestamp: Date.now() });
    this.logCallback?.(`[${this.formatTimestamp(Date.now())}] 发送绘图指令: clear`);
  }

  startBalls(): void {
    this.pixiController.sendToPixi({ type: 'startBalls', timestamp: Date.now() });
    this.logCallback?.(`[${this.formatTimestamp(Date.now())}] 发送绘图指令: startBalls`);
  }

  // API 演示方法
  runApiDemo(demoType: string): void {
    const message = {
      type: demoType,
      timestamp: Date.now(),
    };
    this.pixiController.sendToPixi(message);
    this.logCallback?.(`[${this.formatTimestamp(message.timestamp)}] 发送绘图指令: ${demoType}`);
  }

  // 如果需要停止小球等，可以添加更多方法
}