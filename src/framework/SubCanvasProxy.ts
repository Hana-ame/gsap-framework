import * as PIXI from 'pixi.js';
import { Rect, SubCanvas, SubPointerType } from './SubCanvas';
import { EventBus } from './EventBus';
import { PerfDisplay } from './perf';

export interface SubCanvasProxyOptions {
  app: PIXI.Application;
  perfDisplay?: PerfDisplay;
}

export class SubCanvasProxy {
  private app: PIXI.Application;
  private topCanvases: SubCanvas[] = [];
  private _bus = new EventBus();
  private _perfDisplay: PerfDisplay | null;

  constructor(opts: SubCanvasProxyOptions) {
    this.app = opts.app;
    this._perfDisplay = opts.perfDisplay ?? null;
  }

  showPerfMeasure(show: boolean): void {
    if (show) this._perfDisplay?.enable();
    else this._perfDisplay?.disable();
  }

  get bus(): EventBus {
    return this._bus;
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
    this._bus.clear();
  }

  onWindowResize(fn: () => void): () => void {
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }
}
