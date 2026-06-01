import * as PIXI from 'pixi.js';
import { Rect, SubCanvas, SubPointerType } from './SubCanvas';

export interface SubCanvasProxyOptions {
  app: PIXI.Application;
}

export class SubCanvasProxy {
  private app: PIXI.Application;
  private topCanvases: SubCanvas[] = [];

  constructor(opts: SubCanvasProxyOptions) {
    this.app = opts.app;
  }

  get canvas(): HTMLCanvasElement {
    return this.app.canvas as HTMLCanvasElement;
  }

  get ticker(): PIXI.Ticker {
    return this.app.ticker;
  }

  get renderer(): PIXI.Renderer {
    return this.app.renderer;
  }

  get stage(): PIXI.Container {
    return this.app.stage;
  }

  getTopCanvases(): SubCanvas[] {
    return [...this.topCanvases];
  }

  createRegion(bounds: Rect): SubCanvas {
    const sc = new SubCanvas({
      rootApp: this.app,
      bounds,
      onDestroy: () => {
        const idx = this.topCanvases.indexOf(sc);
        if (idx >= 0) this.topCanvases.splice(idx, 1);
      },
    });
    this.topCanvases.push(sc);
    return sc;
  }

  routePointer(type: SubPointerType, e: PointerEvent): void {
    for (const sc of this.topCanvases) {
      sc.handlePointer(type, e);
    }
  }

  destroyAll(): void {
    [...this.topCanvases].forEach((sc) => sc.destroy());
    this.topCanvases = [];
  }

  onWindowResize(fn: () => void): () => void {
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }
}
