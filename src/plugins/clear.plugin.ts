import * as PIXI from 'pixi.js';
import { PixiPlugin } from './plugin.types';

export const clearPlugin: PixiPlugin = {
  messageTypes: ['clear'],
  execute(message: any, app: PIXI.Application) {
    app.stage.removeChildren();
  },
};