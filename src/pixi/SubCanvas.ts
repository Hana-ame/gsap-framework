import * as PIXI from 'pixi.js';

export interface Rect {
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

export interface DragOptions {
  bounds?: Rect;
  onDragStart?: (e: SubPointerEvent) => void;
  onDrag?: (e: SubPointerEvent, pos: { x: number; y: number }) => void;
  onDragEnd?: (e: SubPointerEvent) => void;
  bringToFront?: boolean;
}

export interface SubCanvasOptions {
  rootApp: PIXI.Application;
  bounds: Rect;
  parent?: SubCanvas | null;
  onDestroy?: () => void;
}

export class SubCanvas {
  readonly stage: PIXI.Container;
  readonly parent: SubCanvas | null;
  readonly rootApp: PIXI.Application;

  private _bounds: Rect;
  private children: SubCanvas[] = [];
  private listeners: Map<SubPointerType, Set<Listener>> = new Map();
  private resizeListeners: Set<(bounds: Rect) => void> = new Set();
  private _destroyed = false;
  private onDestroy: () => void;

  constructor(opts: SubCanvasOptions) {
    this.rootApp = opts.rootApp;
    this._bounds = opts.bounds;
    this.parent = opts.parent ?? null;
    this.onDestroy = opts.onDestroy ?? (() => {});

    this.stage = new PIXI.Container();
    this.stage.position.set(opts.bounds.x, opts.bounds.y);

    if (this.parent) {
      this.parent.stage.addChild(this.stage);
    } else {
      this.rootApp.stage.addChild(this.stage);
    }
  }

  get bounds(): Rect {
    return this._bounds;
  }

  get globalBounds(): Rect {
    if (!this.parent) return { ...this._bounds };
    const pg = this.parent.globalBounds;
    return {
      x: pg.x + this._bounds.x,
      y: pg.y + this._bounds.y,
      width: this._bounds.width,
      height: this._bounds.height,
    };
  }

  get ticker(): PIXI.Ticker {
    return this.rootApp.ticker;
  }

  get renderer(): PIXI.Renderer {
    return this.rootApp.renderer;
  }

  get canvas(): HTMLCanvasElement {
    return this.rootApp.canvas as HTMLCanvasElement;
  }

  get destroyed(): boolean {
    return this._destroyed;
  }

  getChildren(): SubCanvas[] {
    return [...this.children];
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

  onResize(fn: (bounds: Rect) => void): this {
    this.resizeListeners.add(fn);
    return this;
  }

  setBounds(bounds: Rect): void {
    this._bounds = bounds;
    this.stage.position.set(bounds.x, bounds.y);
    this.resizeListeners.forEach((fn) => fn(bounds));
  }

  setPosition(x: number, y: number): void {
    this._bounds = { ...this._bounds, x, y };
    this.stage.position.set(x, y);
  }

  setSize(width: number, height: number): void {
    this._bounds = { ...this._bounds, width, height };
    this.resizeListeners.forEach((fn) => fn(this._bounds));
  }

  bringToFront(): void {
    const parent = this.stage.parent;
    if (!parent) return;
    parent.setChildIndex(this.stage, parent.children.length - 1);
    if (this.parent) {
      const idx = this.parent.children.indexOf(this);
      if (idx >= 0) this.parent.children.splice(idx, 1);
      this.parent.children.push(this);
    }
  }

  sendToBack(): void {
    const parent = this.stage.parent;
    if (!parent) return;
    parent.setChildIndex(this.stage, 0);
    if (this.parent) {
      const idx = this.parent.children.indexOf(this);
      if (idx >= 0) this.parent.children.splice(idx, 1);
      this.parent.children.unshift(this);
    }
  }

  setDraggable(opts: DragOptions = {}): () => void {
    const constraint = opts.bounds ?? this.parent?.bounds ?? null;
    const autoFront = opts.bringToFront !== false;
    let dragging = false;
    let sx = 0;
    let sy = 0;
    let ox = 0;
    let oy = 0;

    const onDown = (e: SubPointerEvent) => {
      dragging = true;
      sx = e.globalX;
      sy = e.globalY;
      ox = this._bounds.x;
      oy = this._bounds.y;
      if (autoFront) this.bringToFront();
      opts.onDragStart?.(e);
    };
    const onMove = (e: SubPointerEvent) => {
      if (!dragging) return;
      let nx = ox + (e.globalX - sx);
      let ny = oy + (e.globalY - sy);
      if (constraint) {
        nx = Math.max(0, Math.min(nx, constraint.width - this._bounds.width));
        ny = Math.max(0, Math.min(ny, constraint.height - this._bounds.height));
      }
      this.setPosition(nx, ny);
      opts.onDrag?.(e, { x: nx, y: ny });
    };
    const onUp = (e: SubPointerEvent) => {
      if (!dragging) return;
      dragging = false;
      opts.onDragEnd?.(e);
    };

    this.onPress(onDown);
    this.onMove(onMove);
    this.onRelease(onUp);

    return () => {
      this.off('pointerdown', onDown);
      this.off('pointermove', onMove);
      this.off('pointerup', onUp);
    };
  }

  private addListener(type: SubPointerType, fn: Listener): this {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
    return this;
  }

  createSubRegion(bounds: Rect): SubCanvas {
    const sub = new SubCanvas({
      rootApp: this.rootApp,
      bounds,
      parent: this,
      onDestroy: () => {
        const idx = this.children.indexOf(sub);
        if (idx >= 0) this.children.splice(idx, 1);
      },
    });
    this.children.push(sub);
    return sub;
  }

  divide(opts: { direction: 'horizontal' | 'vertical'; ratios: number[] }): SubCanvas[] {
    const total = opts.direction === 'horizontal' ? this._bounds.width : this._bounds.height;
    const subs: SubCanvas[] = [];
    let offset = 0;
    opts.ratios.forEach((ratio) => {
      const size = total * ratio;
      const subBounds: Rect =
        opts.direction === 'horizontal'
          ? { x: offset, y: 0, width: size, height: this._bounds.height }
          : { x: 0, y: offset, width: this._bounds.width, height: size };
      subs.push(this.createSubRegion(subBounds));
      offset += size;
    });
    return subs;
  }

  grid(opts: { rows: number; cols: number; gap?: number }): SubCanvas[] {
    const gap = opts.gap ?? 0;
    const totalGapX = gap * (opts.cols - 1);
    const totalGapY = gap * (opts.rows - 1);
    const cellW = (this._bounds.width - totalGapX) / opts.cols;
    const cellH = (this._bounds.height - totalGapY) / opts.rows;
    const subs: SubCanvas[] = [];
    for (let r = 0; r < opts.rows; r++) {
      for (let c = 0; c < opts.cols; c++) {
        subs.push(
          this.createSubRegion({
            x: c * (cellW + gap),
            y: r * (cellH + gap),
            width: cellW,
            height: cellH,
          }),
        );
      }
    }
    return subs;
  }

  handlePointer(type: SubPointerType, e: PointerEvent): boolean {
    if (this._destroyed) return false;
    const gb = this.globalBounds;
    const gx = e.clientX;
    const gy = e.clientY;
    if (gx < gb.x || gx > gb.x + gb.width) return false;
    if (gy < gb.y || gy > gb.y + gb.height) return false;

    for (let i = this.children.length - 1; i >= 0; i--) {
      if (this.children[i].handlePointer(type, e)) return true;
    }

    const hasListeners = (this.listeners.get(type)?.size ?? 0) > 0;
    if (!hasListeners) return false;

    const localX = gx - gb.x;
    const localY = gy - gb.y;
    const sub: SubPointerEvent = {
      type,
      x: localX,
      y: localY,
      globalX: gx,
      globalY: gy,
      originalEvent: e,
    };
    this.listeners.get(type)!.forEach((fn) => fn(sub));
    return true;
  }

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    [...this.children].forEach((c) => c.destroy());
    this.children = [];
    this.listeners.clear();
    if (this.stage.parent) this.stage.parent.removeChild(this.stage);
    this.stage.destroy({ children: true });
    this.onDestroy();
  }
}
