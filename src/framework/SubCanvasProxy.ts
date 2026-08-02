/** SubCanvasProxy — 虚拟坐标空间代理，将子画布的逻辑坐标映射到物理舞台。 */
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
      onReorder: () => {
        const idx = this.topCanvases.indexOf(sc);
        if (idx >= 0) {
          this.topCanvases.splice(idx, 1);
          this.topCanvases.push(sc);
        }
      },
    });
    this.topCanvases.push(sc);
    return sc;
  }

  // 将 window 级 pointer 事件分发给所有顶层 SubCanvas，
  // 由各 region 的 hit-test 自行决定是否消费；
  // 如果某个 canvas 消费了事件（handlePointer 返回 true），后续 canvas 不再收到。
  //
  // 顺序：前 → 后（topCanvases 末尾 = 最靠前，bringToFront 会 push 到末尾）。
  // pointerdown 特殊处理：只投递给最靠前且包含点击点的顶层 canvas，
  // 即使它是无监听器的壳也在此吸收 —— 被遮挡的 canvas 一律不得响应，
  // 防止"靠后窗口被靠前窗口阻挡却响应 click"的穿透问题。
  routePointer(type: SubPointerType, e: PointerEvent): void {
    const top = this.topCanvases;

    if (type === 'pointerdown') {
      for (let i = top.length - 1; i >= 0; i--) {
        const sc = top[i];
        if (!this._containsPoint(sc, e.clientX, e.clientY)) continue;
        sc.handlePointer(type, e);
        return;
      }
      return;
    }

    for (let i = top.length - 1; i >= 0; i--) {
      if (top[i].handlePointer(type, e)) return;
    }
  }

  private _containsPoint(sc: SubCanvas, gx: number, gy: number): boolean {
    const gb = sc.globalBounds;
    return gx >= gb.x && gx <= gb.x + gb.width && gy >= gb.y && gy <= gb.y + gb.height;
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
