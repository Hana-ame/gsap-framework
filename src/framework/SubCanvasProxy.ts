import * as PIXI from 'pixi.js';
import type { Rect, SubPointerType } from './SubCanvasTypes';
import { SubCanvas } from './SubCanvas';
import { EventBus } from './EventBus';
import { enablePerfMeasure, disablePerfMeasure } from './perf';

// SubCanvasProxy — 对 PIXI.Application 的轻量封装，
// 管理一组顶层 SubCanvas 并提供事件路由中枢。
// 外部代码通过它与 Canvas 交互，不直接操作 app。

export interface SubCanvasProxyOptions {
  app: PIXI.Application;
}

export class SubCanvasProxy {
  private app: PIXI.Application;
  private topCanvases: SubCanvas[] = [];
  private _bus = new EventBus();

  constructor(opts: SubCanvasProxyOptions) {
    this.app = opts.app;
  }

  showPerfMeasure(show: boolean): void {
    if (show) enablePerfMeasure();
    else disablePerfMeasure();
  }

  get bus(): EventBus {
    return this._bus;
  }

  get canvas(): HTMLCanvasElement {
    console.warn('[SubCanvasProxy] .canvas 是透传 accessor，建议改用 proxy.createRegion() 获取 SubCanvas 再操作。');
    return this.app.canvas as HTMLCanvasElement;
  }

  get ticker(): PIXI.Ticker {
    console.warn('[SubCanvasProxy] .ticker 是透传 accessor，建议改用 SubCanvas.ticker。');
    return this.app.ticker;
  }

  get renderer(): PIXI.Renderer {
    console.warn('[SubCanvasProxy] .renderer 是透传 accessor，建议改用 SubCanvas.renderer。');
    return this.app.renderer;
  }

  get stage(): PIXI.Container {
    console.warn('[SubCanvasProxy] .stage 是透传 accessor，建议改用 SubCanvas.stage。');
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
