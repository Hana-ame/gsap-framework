import * as PIXI from 'pixi.js';
import { SubPointerType, WindowBounds, WindowInstance } from './WindowInstance';

export interface SubCanvasProxyOptions {
  app: PIXI.Application;
}

export class SubCanvasProxy {
  private app: PIXI.Application;
  private windows: WindowInstance[] = [];

  constructor(opts: SubCanvasProxyOptions) {
    this.app = opts.app;
  }

  get canvas(): HTMLCanvasElement {
    return this.app.canvas as HTMLCanvasElement;
  }

  get ticker(): PIXI.Ticker {
    return this.app.ticker;
  }

  get renderer(): PIXI.IRenderer {
    return this.app.renderer;
  }

  get stage(): PIXI.Container {
    return this.app.stage;
  }

  getWindows(): WindowInstance[] {
    return [...this.windows];
  }

  createWindow(bounds: WindowBounds): WindowInstance {
    const win = new WindowInstance({
      app: this.app,
      bounds,
      onDestroy: () => {
        const idx = this.windows.indexOf(win);
        if (idx >= 0) this.windows.splice(idx, 1);
      },
    });
    this.windows.push(win);
    return win;
  }

  routePointer(type: SubPointerType, e: PointerEvent): void {
    for (const win of this.windows) {
      win.handlePointer(type, e);
    }
  }

  destroyAll(): void {
    [...this.windows].forEach((w) => w.destroy());
    this.windows = [];
  }
}
