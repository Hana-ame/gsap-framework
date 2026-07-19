import * as PIXI from 'pixi.js';
import { Rect, SubCanvas, SubPointerType } from './SubCanvas';
import { EventBus } from './EventBus';
import { PerfDisplay } from './perf';

// SubCanvasProxy — 对 PIXI.Application 的轻量封装，
// 管理一组顶层 SubCanvas 并提供事件路由中枢。
// 外部代码通过它与 Canvas 交互，不直接操作 app。

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

  // 创建顶层 SubCanvas（无父 region），自动注册到代理生命周期中
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

  // 将 window 级 pointer 事件分发给所有顶层 SubCanvas，
  // 由各 region 的 hit-test 自行决定是否消费
  routePointer(type: SubPointerType, e: PointerEvent): void {
    for (const sc of this.topCanvases) {
      sc.handlePointer(type, e);
    }
  }

  // 销毁所有 region + 清理事件总线，顺序敏感：先销毁 region 再清 bus
  destroyAll(): void {
    [...this.topCanvases].forEach((sc) => sc.destroy());
    this.topCanvases = [];
    this._bus.clear();
  }

  // 返回 cleanup 函数，方便调用方在销毁时解除绑定
  onWindowResize(fn: () => void): () => void {
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }
}
