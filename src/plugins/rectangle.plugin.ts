// src/plugins/rectangle.plugin.ts
import * as PIXI from 'pixi.js';
import { PixiPlugin } from '../controllers/PixiController';

export const rectanglePlugin: PixiPlugin = {
  messageTypes: ['drawRectangle'],
  execute(message: any, app: PIXI.Application) {
    const { x, y, width = 50, height = 50, color = 0x00ff00 } = message;
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new Error('画矩形需要有效的 x, y 坐标');
    }
    const rect = new PIXI.Graphics();
    rect.beginFill(color);
    rect.drawRect(x, y, width, height);
    rect.endFill();
    app.stage.addChild(rect);
  },
};  