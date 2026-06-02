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

export type SubDragMode = 'title' | 'anywhere' | 'none';

export interface SubCanvasOptions {
  rootApp: PIXI.Application;
  bounds: Rect;
  parent?: SubCanvas | null;
  clipToBounds?: boolean;
  dragMode?: SubDragMode;
  dragBounds?: () => Rect | null;
  dragBringToFront?: boolean;
  onDragStart?: (e: { x: number; y: number }) => void;
  onDrag?: (e: { x: number; y: number }) => void;
  onDragEnd?: (e: { x: number; y: number }) => void;
  onDestroy?: () => void;
}

const DRAG_HANDLE_LABEL = 'subcanvas-drag-handle';

type DragHandlers = {
  onStart?: (p: { x: number; y: number }) => void;
  onDrag?: (p: { x: number; y: number }) => void;
  onEnd?: (p: { x: number; y: number }) => void;
  getBounds?: () => Rect | null;
  bringToFront: boolean;
};
export class SubCanvas {
  readonly stage: PIXI.Container;
  readonly parent: SubCanvas | null;
  readonly rootApp: PIXI.Application;

  private _bounds: Rect;
  private _subRegions: SubCanvas[] = [];
  private listeners: Map<SubPointerType, Set<Listener>> = new Map();
  private resizeListeners: Set<(bounds: Rect) => void> = new Set();
  private _destroyed = false;
  private _syncing = false;
  private _mask: PIXI.Graphics | null = null;
  private _bg: PIXI.Container | null = null;
  private _dragHandles: WeakSet<PIXI.Container> = new WeakSet();
  private _dragHandlers: DragHandlers | null = null;
  private _perHandleCleanups: Map<PIXI.Container, () => void> = new Map();
  private onDestroy: () => void;

  constructor(opts: SubCanvasOptions) {
    this.rootApp = opts.rootApp;
    this._bounds = opts.bounds;
    this.parent = opts.parent ?? null;
    this.onDestroy = opts.onDestroy ?? (() => {});

    this.stage = new PIXI.Container();
    this.stage.position.set(opts.bounds.x, opts.bounds.y);

    if (opts.clipToBounds) {
      this._mask = new PIXI.Graphics();
      this.stage.addChild(this._mask);
      this.stage.mask = this._mask;
      this.updateMask();
    }

    if (this.parent) {
      this.parent.stage.addChild(this.stage);
    } else {
      this.rootApp.stage.addChild(this.stage);
    }

    if (opts.dragMode && opts.dragMode !== 'none') {
      this._dragHandlers = {
        onStart: opts.onDragStart,
        onDrag: opts.onDrag,
        onEnd: opts.onDragEnd,
        getBounds: opts.dragBounds,
        bringToFront: opts.dragBringToFront !== false,
      };
      if (opts.dragMode === 'anywhere') {
        this._ensureDragBg();
      }
      for (const child of this.stage.children) {
        if (child.label === DRAG_HANDLE_LABEL && !this._dragHandles.has(child)) {
          this._dragHandles.add(child);
          this._installDragOnHandle(child);
        }
      }
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
    return [...this._subRegions];
  }

  get subRegions(): readonly SubCanvas[] {
    return this._subRegions;
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

  offPointer(type: SubPointerType, fn: Listener): this {
    this.listeners.get(type)?.delete(fn);
    return this;
  }

  onResize(fn: (bounds: Rect) => void): this {
    this.resizeListeners.add(fn);
    return this;
  }

  setBounds(bounds: Rect): void {
    if (this._destroyed) return;
    this._syncing = true;
    this._bounds = bounds;
    this.stage.position.set(bounds.x, bounds.y);
    this._syncing = false;
    this.updateMask();
    this.updateBgHitArea();
    this.resizeListeners.forEach((fn) => fn(bounds));
  }

  setPosition(x: number, y: number): void {
    if (this._destroyed) return;
    this._syncing = true;
    this._bounds = { ...this._bounds, x, y };
    this.stage.position.set(x, y);
    this._syncing = false;
  }

  setSize(width: number, height: number): void {
    if (this._destroyed) return;
    this._bounds = { ...this._bounds, width, height };
    this.updateMask();
    this.updateBgHitArea();
    this.resizeListeners.forEach((fn) => fn(this._bounds));
  }

  bringToFront(): void {
    const parent = this.stage.parent;
    if (!parent) return;
    parent.sortableChildren = true;
    let max = this.stage.zIndex;
    for (const child of parent.children) {
      if (child === this.stage) continue;
      if (child.zIndex > max) max = child.zIndex;
    }
    this.stage.zIndex = max + 1;
    if (this.parent) {
      const idx = this.parent._subRegions.indexOf(this);
      if (idx >= 0) this.parent._subRegions.splice(idx, 1);
      this.parent._subRegions.push(this);
    }
  }

  sendToBack(): void {
    const parent = this.stage.parent;
    if (!parent) return;
    parent.sortableChildren = true;
    let min = this.stage.zIndex;
    for (const child of parent.children) {
      if (child === this.stage) continue;
      if (child.zIndex < min) min = child.zIndex;
    }
    this.stage.zIndex = min - 1;
    if (this.parent) {
      const idx = this.parent._subRegions.indexOf(this);
      if (idx >= 0) this.parent._subRegions.splice(idx, 1);
      this.parent._subRegions.unshift(this);
    }
  }

  addChild<T extends PIXI.Container>(child: T): T {
    const added = this.stage.addChild(child) as T;
    if (this._dragHandlers && child.label === DRAG_HANDLE_LABEL && !this._dragHandles.has(child)) {
      this._dragHandles.add(child);
      this._installDragOnHandle(child);
    }
    return added;
  }

  removeChild<T extends PIXI.Container>(child: T): T {
    if (this._dragHandles.has(child)) {
      this._uninstallDragOnHandle(child);
      this._dragHandles.delete(child);
    }
    return this.stage.removeChild(child) as T;
  }

  removeChildren(): PIXI.Container[] {
    this.stage.children.forEach((c) => {
      if (this._dragHandles.has(c)) this._uninstallDragOnHandle(c);
    });
    this._dragHandles = new WeakSet();
    return this.stage.removeChildren();
  }

  getChildAt(index: number): PIXI.Container {
    return this.stage.getChildAt(index);
  }

  getChildByLabel(label: string): PIXI.Container | null {
    return this.stage.getChildByLabel(label);
  }

  get children(): readonly PIXI.Container[] {
    return this.stage.children;
  }

  get position(): PIXI.ObservablePoint {
    return this.stage.position;
  }

  get scale(): PIXI.ObservablePoint {
    return this.stage.scale;
  }

  get pivot(): PIXI.ObservablePoint {
    return this.stage.pivot;
  }

  get rotation(): number {
    return this.stage.rotation;
  }

  set rotation(v: number) {
    this.stage.rotation = v;
  }

  get angle(): number {
    return this.stage.angle;
  }

  set angle(v: number) {
    this.stage.angle = v;
  }

  get alpha(): number {
    return this.stage.alpha;
  }

  set alpha(v: number) {
    this.stage.alpha = v;
  }

  get visible(): boolean {
    return this.stage.visible;
  }

  set visible(v: boolean) {
    this.stage.visible = v;
  }

  get tint(): number {
    return this.stage.tint;
  }

  set tint(v: number) {
    this.stage.tint = v;
  }

  get x(): number {
    return this.stage.x;
  }

  get y(): number {
    return this.stage.y;
  }

  get eventMode(): PIXI.EventMode {
    return this.stage.eventMode;
  }

  set eventMode(v: PIXI.EventMode) {
    this.stage.eventMode = v;
  }

  get label(): string {
    return this.stage.label;
  }

  set label(v: string) {
    this.stage.label = v;
  }

  private addListener(type: SubPointerType, fn: Listener): this {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
    return this;
  }

  private updateMask(): void {
    if (!this._mask) return;
    this._mask
      .clear()
      .rect(0, 0, this._bounds.width, this._bounds.height)
      .fill({ color: 0xffffff });
  }

  private updateBgHitArea(): void {
    if (!this._bg) return;
    this._bg.hitArea = new PIXI.Rectangle(0, 0, this._bounds.width, this._bounds.height);
  }

  private _ensureDragBg(): void {
    if (this._bg) return;
    const existing = this.stage.children.find((c) => c.label === DRAG_HANDLE_LABEL);
    if (existing) return;
    const bg = new PIXI.Container();
    bg.label = DRAG_HANDLE_LABEL;
    bg.eventMode = 'static';
    bg.hitArea = new PIXI.Rectangle(0, 0, this._bounds.width, this._bounds.height);
    bg.zIndex = -1;
    this.stage.addChildAt(bg, 0);
    this._bg = bg;
  }

  private _installDragOnHandle(handle: PIXI.Container): void {
    if (!this._dragHandlers) return;
    const handlers = this._dragHandlers;
    const root = this.rootApp.stage;
    let dragging = false;
    let startLocalX = 0;
    let startLocalY = 0;
    let startBoundsX = 0;
    let startBoundsY = 0;

    const onDown = (e: PIXI.FederatedPointerEvent) => {
      e.stopPropagation();
      const parent = this.stage.parent;
      if (!parent) return;
      const local = e.getLocalPosition(parent);
      dragging = true;
      startLocalX = local.x;
      startLocalY = local.y;
      startBoundsX = this._bounds.x;
      startBoundsY = this._bounds.y;
      if (handlers.bringToFront) this.bringToFront();
      handlers.onStart?.({ x: this._bounds.x, y: this._bounds.y });
    };

    const onMove = (e: PIXI.FederatedPointerEvent) => {
      if (!dragging) return;
      const parent = this.stage.parent;
      if (!parent) return;
      const local = e.getLocalPosition(parent);
      let nx = startBoundsX + (local.x - startLocalX);
      let ny = startBoundsY + (local.y - startLocalY);
      const constraint = handlers.getBounds?.() ?? this.parent?.bounds ?? null;
      if (constraint) {
        nx = Math.max(0, Math.min(nx, constraint.width - this._bounds.width));
        ny = Math.max(0, Math.min(ny, constraint.height - this._bounds.height));
      }
      this.setPosition(nx, ny);
      handlers.onDrag?.({ x: nx, y: ny });
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      handlers.onEnd?.({ x: this._bounds.x, y: this._bounds.y });
    };

    handle.on('pointerdown', onDown);
    handle.on('pointermove', onMove);
    handle.on('pointerup', onUp);
    handle.on('pointerupoutside', onUp);
    handle.on('pointercancel', onUp);
    root.on('pointermove', onMove);
    root.on('pointerup', onUp);
    root.on('pointerupoutside', onUp);

    this._perHandleCleanups.set(handle, () => {
      handle.off('pointerdown', onDown);
      handle.off('pointermove', onMove);
      handle.off('pointerup', onUp);
      handle.off('pointerupoutside', onUp);
      handle.off('pointercancel', onUp);
      root.off('pointermove', onMove);
      root.off('pointerup', onUp);
      root.off('pointerupoutside', onUp);
    });
  }

  private _uninstallDragOnHandle(handle: PIXI.Container): void {
    const cleanup = this._perHandleCleanups.get(handle);
    if (cleanup) {
      cleanup();
      this._perHandleCleanups.delete(handle);
    }
  }

  createSubRegion(
    bounds: Rect,
    opts?: {
      clipToBounds?: boolean;
      dragMode?: SubDragMode;
      dragBounds?: () => Rect | null;
      dragBringToFront?: boolean;
      onDragStart?: (e: { x: number; y: number }) => void;
      onDrag?: (e: { x: number; y: number }) => void;
      onDragEnd?: (e: { x: number; y: number }) => void;
    },
  ): SubCanvas {
    const sub = new SubCanvas({
      rootApp: this.rootApp,
      bounds,
      parent: this,
      clipToBounds: opts?.clipToBounds,
      dragMode: opts?.dragMode,
      dragBounds: opts?.dragBounds,
      dragBringToFront: opts?.dragBringToFront,
      onDragStart: opts?.onDragStart,
      onDrag: opts?.onDrag,
      onDragEnd: opts?.onDragEnd,
      onDestroy: () => {
        const idx = this._subRegions.indexOf(sub);
        if (idx >= 0) this._subRegions.splice(idx, 1);
      },
    });
    this._subRegions.push(sub);
    return sub;
  }

  handlePointer(type: SubPointerType, e: PointerEvent): boolean {
    if (this._destroyed) return false;
    const gb = this.globalBounds;
    const gx = e.clientX;
    const gy = e.clientY;
    if (gx < gb.x || gx > gb.x + gb.width) return false;
    if (gy < gb.y || gy > gb.y + gb.height) return false;

    for (let i = this._subRegions.length - 1; i >= 0; i--) {
      if (this._subRegions[i].handlePointer(type, e)) return true;
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

  destroy(_options?: { children?: boolean; texture?: boolean }): void {
    if (this._destroyed) return;
    this._destroyed = true;
    for (const cleanup of this._perHandleCleanups.values()) cleanup();
    this._perHandleCleanups.clear();
    [...this._subRegions].forEach((c) => c.destroy());
    this._subRegions = [];
    this.listeners.clear();
    this.resizeListeners.clear();
    if (this.stage.parent) this.stage.parent.removeChild(this.stage);
    try {
      this.stage.destroy({ children: true, texture: false });
    } catch {
      // stage already destroyed
    }
    this.onDestroy();
  }
}
