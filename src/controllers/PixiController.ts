// src/controllers/PixiController.ts
import * as PIXI from "pixi.js";
import { plugins } from "../plugins";

//==============================================================================
// PixiController - 管理PixiJS绘图插件
// 用途：接收并分发绘图消息到对应的插件，增加坐标边界检查
// 上下文：与PixiCanvas配合使用，通过handleMessage接收外部消息
//==============================================================================

export interface PixiPlugin {
  messageTypes: string[];
  execute(message: any, app: PIXI.Application): void;
}

export class PixiController {
  private app: PIXI.Application;
  private plugins: Map<string, PixiPlugin>;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.plugins = new Map();

    // 注册所有插件
    plugins.forEach((plugin) => {
      plugin.messageTypes.forEach((type) => {
        this.plugins.set(type, plugin);
      });
    });
  }

  //==============================================================================
  // 边界检查工具函数 - 确保坐标在画布可见范围内
  //==============================================================================
  private validateCoordinates(
    x: number,
    y: number,
    margin: number = 0,
  ): { x: number; y: number } {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // 确保坐标在画布内，并预留边距
    const boundedX = Math.max(margin, Math.min(width - margin, x));
    const boundedY = Math.max(margin, Math.min(height - margin, y));

    if (boundedX !== x || boundedY !== y) {
      console.warn(
        `坐标 (${x}, ${y}) 超出画布范围，已调整为 (${boundedX}, ${boundedY})`,
      );
    }

    return { x: boundedX, y: boundedY };
  }

  //==============================================================================
  // 处理传入消息
  //==============================================================================
  public handleMessage(message: any): void {
    const { type } = message;

    if (!type) {
      console.error("消息缺少type字段");
      return;
    }

    const plugin = this.plugins.get(type);
    if (!plugin) {
      console.error(`未找到处理消息类型 "${type}" 的插件`);
      return;
    }

    try {
      // 对包含坐标的消息进行边界检查
      if (message.x !== undefined && message.y !== undefined) {
        const { x, y } = this.validateCoordinates(message.x, message.y, 20);
        message.x = x;
        message.y = y;
      }

      plugin.execute(message, this.app);
    } catch (error) {
      console.error(`插件执行错误:`, error);
    }
  }

  //==============================================================================
  // 获取当前画布状态
  //==============================================================================
  public getCanvasInfo() {
    return {
      width: this.app.screen.width,
      height: this.app.screen.height,
      childrenCount: this.app.stage.children.length,
    };
  }

  //==============================================================================
  // 清除画布
  //==============================================================================
  public clear(): void {
    while (this.app.stage.children.length > 0) {
      this.app.stage.removeChildAt(0);
    }
  }
}
