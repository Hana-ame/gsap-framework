import * as PIXI from 'pixi.js';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SubPointerType = 'pointerdown' | 'pointermove' | 'pointerup' | 'pointerleave';

export interface SubPointerEvent {
  type: SubPointerType;
  x: number;
  y: number;
  globalX: number;
  globalY: number;
  originalEvent: PointerEvent;
}

type Listener = (e: SubPointerEvent) => void;

export class WindowInstance {
  readonly stage: PIXI.Container;
  readonly bounds: WindowBounds;

  private app: PIXI.Application;
  private listeners: Map<SubPointerType, Set<Listener>> = new Map();
  private _destroyed = false;
  private onDestroy: () => void;

  constructor(opts: {
    app: PIXI.Application;
    bounds: WindowBounds;
    onDestroy?: () => void;
  }) {
    this.app = opts.app;
    this.bounds = opts.bounds;
    this.onDestroy = opts.onDestroy ?? (() => {});

    this.stage = new PIXI.Container();
    this.stage.position.set(opts.bounds.x, opts.bounds.y);

    this.app.stage.addChild(this.stage);
  }

  get ticker(): PIXI.Ticker {
    return this.app.ticker;
  }

  get renderer(): PIXI.IRenderer {
    return this.app.renderer;
  }

  get canvas(): HTMLCanvasElement {
    return this.app.canvas as HTMLCanvasElement;
  }

  get destroyed(): boolean {
    return this._destroyed;
  }

  onPress(fn: Listener): this {
    return this.addListener('pointerdown', fn);
  }

  onMove(fn: Listener): this {
    return this.addListener('pointermove', fn);
  }

  onRelease(fn: Listener): this {
    return this.addListener('pointerup', fn);
  }

  onLeave(fn: Listener): this {
    return this.addListener('pointerleave', fn);
  }

  off(type: SubPointerType, fn: Listener): this {
    this.listeners.get(type)?.delete(fn);
    return this;
  }

  private addListener(type: SubPointerType, fn: Listener): this {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
    return this;
  }

  handlePointer(type: SubPointerType, e: PointerEvent): void {
    if (this._destroyed) return;
    const localX = e.clientX - this.bounds.x;
    const localY = e.clientY - this.bounds.y;
    if (localX < 0 || localX > this.bounds.width) return;
    if (localY < 0 || localY > this.bounds.height) return;

    const sub: SubPointerEvent = {
      type,
      x: localX,
      y: localY,
      globalX: e.clientX,
      globalY: e.clientY,
      originalEvent: e,
    };
    this.listeners.get(type)?.forEach((fn) => fn(sub));
  }

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this.listeners.clear();
    if (this.stage.parent) this.app.stage.removeChild(this.stage);
    this.stage.destroy({ children: true });
    this.onDestroy();
  }
}
