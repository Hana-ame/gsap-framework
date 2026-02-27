// src/plugins/circle.plugin.ts
import * as PIXI from 'pixi.js';
import { PixiPlugin } from '../controllers/PixiController';

export const circlePlugin: PixiPlugin = {
  messageTypes: ['drawCircle'],
  execute(message: any, app: PIXI.Application) {
    const { x, y, radius = 30, color = 0xff0000 } = message;
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new Error('画圆需要有效的 x, y 坐标');
    }
    const circle = new PIXI.Graphics();
    circle.beginFill(color);
    circle.drawCircle(x, y, radius);
    circle.endFill();
    app.stage.addChild(circle);
  },
};