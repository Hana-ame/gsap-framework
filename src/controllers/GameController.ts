// ============================================================
// 文件: src/controllers/GameController.ts
// 用途: 高级业务控制器，负责监听来自 PixiCanvas 的事件，
//       并转发给 PixiController 进行绘图，同时管理 UI 回调。
//       它将所有与业务逻辑相关的消息处理集中在此，使 App.tsx 保持简洁。
// 上下文: 在 App.tsx 中实例化，并传入 UI 日志回调。持有 PixiController 实例。
//
// 版本: 2.5.1
//    - 添加康威生命游戏控制方法：startGameOfLife, pauseGameOfLife, stepGameOfLife
//    - 处理画布 click 事件，转发为 gameOfLife/toggleCell 消息
//
// Outline:
// 1. 构造函数接收 PixiController 实例和一个可选的日志回调。
// 2. 在构造函数中设置 PixiController 的 onMessageFromParent 监听器。
// 3. 定义公共方法，供 UI 按钮调用（如 drawCircle, startBalls 等），
//    这些方法构造消息并调用 pixiController.sendToPixi。
// 4. 提供 onAppInit 方法，用于在 PixiCanvas 初始化完成后调用，
//    设置 app 到 pixiController。
// 5. 内部处理从画布收到的事件，更新日志（通过回调）并转发必要的消息。
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

    // 处理点击事件：转发给生命游戏插件切换细胞
    if (message.type === 'click' && message.x !== undefined && message.y !== undefined) {
      this.pixiController.sendToPixi({
        type: 'gameOfLife/toggleCell',
        x: message.x,
        y: message.y,
        timestamp: message.timestamp,
      });
    }

    // 可选：继续处理其他事件（如 pointermove 可用于其他插件，但本版本仅用于日志）
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
   * 本版本不再自动启动 DVD 和烟花，只设置 app
   */
  onAppInit(app: PIXI.Application): void {
    this.pixiController.setApp(app);
    // 不再自动发送 startDVD 和 startFireworks
    this.logCallback?.(`[${this.formatTimestamp(Date.now())}] Pixi 应用已初始化，准备生命游戏`);
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

  // ----- 康威生命游戏控制方法 -----
  startGameOfLife(): void {
    this.pixiController.sendToPixi({ type: 'gameOfLife/start', timestamp: Date.now() });
    this.logCallback?.(`[${this.formatTimestamp(Date.now())}] 开始生命游戏`);
  }

  pauseGameOfLife(): void {
    this.pixiController.sendToPixi({ type: 'gameOfLife/pause', timestamp: Date.now() });
    this.logCallback?.(`[${this.formatTimestamp(Date.now())}] 暂停生命游戏`);
  }

  stepGameOfLife(): void {
    this.pixiController.sendToPixi({ type: 'gameOfLife/step', timestamp: Date.now() });
    this.logCallback?.(`[${this.formatTimestamp(Date.now())}] 步进生命游戏`);
  }

  // 如果需要停止小球等，可以添加更多方法，但本版本已不再使用
}