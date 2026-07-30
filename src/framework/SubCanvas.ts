/** SubCanvas — 可拖拽、可缩放的子画布，管理自身的 pointer 事件与脏矩形。 */
import * as PIXI from 'pixi.js';
import type { Rect, SubPointerType, SubPointerEvent, SubCanvasOptions, SubDragMode } from './SubCanvasTypes';
import { DragController, type DragOptions, type DragContext } from './DragController';
import { bringToFront as zBringToFront, sendToBack as zSendToBack } from './ZOrderManager';
import type { IRenderContainer, IRenderLayer, IRenderGraphics } from '@framework/render/types';

export type { Rect, SubPointerType, SubPointerEvent, SubCanvasOptions, SubDragMode } from './SubCanvasTypes';

type Listener = (e: SubPointerEvent) => void;

const DRAG_HANDLE_LABEL = 'subcanvas-drag-handle';

function isPixiRenderLayer(l: IRenderLayer): boolean {
  return (l as any).constructor?.name === 'PixiLayer';
}

export class SubCanvas {
  readonly stage: IRenderContainer;
  readonly parent: SubCanvas | null;
  readonly rootApp: PIXI.Application | null;
  readonly renderLayer: IRenderLayer | null;

  private _bounds: Rect;
  private _subRegions: SubCanvas[] = [];
  private listeners: Map<SubPointerType, Set<Listener>> = new Map();
  private resizeListeners: Set<(bounds: Rect) => void> = new Set();
  private _destroyed = false;
  private _syncing = false;
  private _mask: IRenderGraphics | PIXI.Graphics | null = null;
  private _drag: DragController | null = null;
  private _tapThreshold: number;
  private _pressStart: { x: number; y: number; clientX: number; clientY: number } | null = null;
  private _pressMoved = false;
  private onDestroy: () => void;
  private onReorder: () => void;

  constructor(opts: SubCanvasOptions) {
    this.rootApp = opts.rootApp ?? null;
    this.renderLayer = opts.renderLayer ?? null;
    this._bounds = opts.bounds;
    this.parent = opts.parent ?? null;
    this.onDestroy = opts.onDestroy ?? (() => {});
    this.onReorder = opts.onReorder ?? (() => {});
    this._tapThreshold = opts.tapThreshold ?? 4;

    if (this.renderLayer) {
      this.stage = this.renderLayer.createContainer();
    } else {
      const c = new PIXI.Container();
      c.sortableChildren = true;
      this.stage = c as unknown as IRenderContainer;
    }
    this.stage.x = opts.bounds.x;
    this.stage.y = opts.bounds.y;

    if (opts.clipToBounds) {
      if (this.renderLayer && !isPixiRenderLayer(this.renderLayer)) {
        this._mask = this.renderLayer.createGraphics();
      } else {
        this._mask = new PIXI.Graphics();
      }
      this.stage.addChild(this._mask);
      if (!this.renderLayer || isPixiRenderLayer(this.renderLayer)) {
        (this.stage as any).mask = this._mask;
      }
      this.updateMask();
    }

    this.stage.eventMode = 'static';

    if (this.parent) {
      this.parent.stage.addChild(this.stage);
    } else if (this.rootApp) {
      this.rootApp.stage.addChild(this.stage as any);
    }

    if (opts.dragMode && opts.dragMode !== 'none') {
      if (!this.renderLayer || isPixiRenderLayer(this.renderLayer)) {
        (this.stage as any).hitArea = new PIXI.Rectangle(0, 0, opts.bounds.width, opts.bounds.height);
      }

      this._drag = new DragController(
        {
          mode: opts.dragMode,
          tapThreshold: opts.tapThreshold,
          dragBounds: opts.dragBounds,
          bringToFront: opts.dragBringToFront !== false,
          onStart: opts.onDragStart,
          onDrag: opts.onDrag,
          onEnd: opts.onDragEnd,
        },
        this._dragContext(),
      );

      if (opts.dragMode === 'title') {
        for (const child of this.stage.children) {
          if (child.label === DRAG_HANDLE_LABEL && !this._drag.hasHandle(child)) {
            this._drag.installHandle(child);
          }
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
    return this.rootApp?.ticker as PIXI.Ticker;
  }

  get renderer(): PIXI.Renderer {
    return this.rootApp?.renderer as PIXI.Renderer;
  }

  get canvas(): HTMLCanvasElement {
    return this.rootApp?.canvas as HTMLCanvasElement;
  }

  get destroyed(): boolean {
    return this._destroyed;
  }

  get dragMode(): SubDragMode {
    return this._drag?.mode ?? 'none';
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

  onTap(fn: Listener): this {
    return this.addListener('tap', fn);
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
    this.stage.x = bounds.x;
    this.stage.y = bounds.y;
    this._syncing = false;
    if (!this.renderLayer || isPixiRenderLayer(this.renderLayer)) {
      (this.stage as any).hitArea = new PIXI.Rectangle(0, 0, bounds.width, bounds.height);
    }
    this.updateMask();
    this.resizeListeners.forEach((fn) => fn(bounds));
  }

  setPosition(x: number, y: number): void {
    if (this._destroyed) return;
    this._syncing = true;
    this._bounds = { ...this._bounds, x, y };
    this.stage.x = x;
    this.stage.y = y;
    this._syncing = false;
  }

  setSize(width: number, height: number): void {
    if (this._destroyed) return;
    this._bounds = { ...this._bounds, width, height };
    if (!this.renderLayer || isPixiRenderLayer(this.renderLayer)) {
      (this.stage as any).hitArea = new PIXI.Rectangle(0, 0, width, height);
    }
    this.updateMask();
    this.resizeListeners.forEach((fn) => fn(this._bounds));
  }

  bringToFront(): void {
    const parent = this.stage.parent;
    if (!parent) return;
    zBringToFront(this.stage);
    if (this.parent) {
      const idx = this.parent._subRegions.indexOf(this);
      if (idx >= 0) this.parent._subRegions.splice(idx, 1);
      this.parent._subRegions.push(this);
    } else {
      this.onReorder();
    }
  }

  sendToBack(): void {
    const parent = this.stage.parent;
    if (!parent) return;
    zSendToBack(this.stage);
    if (this.parent) {
      const idx = this.parent._subRegions.indexOf(this);
      if (idx >= 0) this.parent._subRegions.splice(idx, 1);
      this.parent._subRegions.unshift(this);
    }
  }

  addChild<T extends IRenderContainer>(child: T): T {
    const added = this.stage.addChild(child);
    if (this._drag && this._drag.mode === 'title' && child.label === DRAG_HANDLE_LABEL && !this._drag.hasHandle(child)) {
      this._drag.installHandle(child);
    }
    return added as T;
  }

  removeChild<T extends IRenderContainer>(child: T): T {
    if (this._drag) this._drag.uninstallHandle(child);
    return this.stage.removeChild(child) as T;
  }

  removeChildren(): IRenderContainer[] {
    const internal = new Set<IRenderContainer>();
    if (this._mask) internal.add(this._mask as IRenderContainer);
    const toRemove = this.stage.children.filter((c) => !internal.has(c));
    toRemove.forEach((c) => {
      if (this._drag) this._drag.uninstallHandle(c);
    });
    toRemove.forEach((c) => this.stage.removeChild(c));
    return toRemove;
  }

  getChildAt(index: number): IRenderContainer | null {
    return this.stage.getChildAt(index);
  }

  getChildByLabel(label: string): IRenderContainer | null {
    return this.stage.getChildByLabel(label);
  }

  get children(): readonly IRenderContainer[] {
    return this.stage.children;
  }

  get position(): any {
    return (this.stage as any).position ?? { x: this.stage.x, y: this.stage.y };
  }

  get scale(): any {
    return (this.stage as any).scale ?? { x: 1, y: 1 };
  }

  get pivot(): any {
    return (this.stage as any).pivot ?? { x: 0, y: 0 };
  }

  get rotation(): number { return (this.stage as any).rotation ?? 0; }
  set rotation(v: number) { if ((this.stage as any).rotation !== undefined) (this.stage as any).rotation = v; }

  get angle(): number { return (this.stage as any).angle ?? 0; }
  set angle(v: number) { if ((this.stage as any).angle !== undefined) (this.stage as any).angle = v; }

  get alpha(): number { return this.stage.alpha; }
  set alpha(v: number) { this.stage.alpha = v; }

  get visible(): boolean { return this.stage.visible; }
  set visible(v: boolean) { this.stage.visible = v; }

  get tint(): number { return (this.stage as any).tint ?? 0xffffff; }
  set tint(v: number) { if ((this.stage as any).tint !== undefined) (this.stage as any).tint = v; }

  get eventMode(): string { return this.stage.eventMode; }
  set eventMode(v: string) { this.stage.eventMode = v; }

  get label(): string { return this.stage.label; }
  set label(v: string) { this.stage.label = v; }

  get zIndex(): number { return this.stage.zIndex; }
  set zIndex(v: number) { this.stage.zIndex = v; }

  private addListener(type: SubPointerType, fn: Listener): this {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
    return this;
  }

  private updateMask(): void {
    if (!this._mask) return;
    const w = this._bounds.width;
    const h = this._bounds.height;
    const mask = this._mask as any;
    try {
      mask.clear();
      mask.rect(0, 0, w, h);
      mask.fill({ color: 0xffffff });
    } catch {
      if (mask.parent) mask.parent.removeChild(mask);
      this._mask = this.renderLayer
        ? this.renderLayer.createGraphics()
        : (new PIXI.Graphics() as any);
      (this._mask as any).rect(0, 0, w, h);
      (this._mask as any).fill({ color: 0xffffff });
      this.stage.addChild(this._mask as any);
      if (!this.renderLayer || isPixiRenderLayer(this.renderLayer)) {
        (this.stage as any).mask = this._mask;
      }
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
    return this.createRegion(bounds, opts);
  }

  createRegion(
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
      rootApp: this.rootApp ?? undefined,
      renderLayer: this.renderLayer ?? undefined,
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

    const inBounds = gx >= gb.x && gx <= gb.x + gb.width && gy >= gb.y && gy <= gb.y + gb.height;

    if (type === 'pointermove' || type === 'pointerup' || type === 'pointerleave') {
      if (this._pressStart) {
      } else if (!inBounds) {
        return false;
      }
    } else if (!inBounds) {
      return false;
    }

    let blockedBySibling = false;
    if (type === 'pointerdown' && this._drag?.mode === 'anywhere') {
      for (let i = this._subRegions.length - 1; i >= 0; i--) {
        if (this._subRegions[i].handlePointer(type, e)) {
          this.bringToFront();
          return true;
        }
      }
      if (this.parent) {
        const siblings = this.parent.subRegions;
        for (let i = siblings.length - 1; i >= 0; i--) {
          if (siblings[i] === this) break;
          const cgb = siblings[i].globalBounds;
          if (gx >= cgb.x && gx <= cgb.x + cgb.width && gy >= cgb.y && gy <= cgb.y + cgb.height) {
            blockedBySibling = true;
            break;
          }
        }
        if (!blockedBySibling) {
          this._drag.interceptPointer(type, e);
          this.bringToFront();
          return true;
        }
      } else {
        this._drag.interceptPointer(type, e);
        this.bringToFront();
        return true;
      }
    } else {
      if (this._drag) {
        if (this._drag.interceptPointer(type, e)) return true;
      }
    }

    if (this._drag?.isDragging && (type === 'pointermove' || type === 'pointerup' || type === 'pointerleave')) {
      return true;
    }

    for (let i = this._subRegions.length - 1; i >= 0; i--) {
      if (this._subRegions[i].handlePointer(type, e)) return true;
    }

    const localX = gx - gb.x;
    const localY = gy - gb.y;

    if (type === 'pointerdown') {
      this._pressStart = { x: localX, y: localY, clientX: gx, clientY: gy };
      this._pressMoved = false;
    } else if (type === 'pointermove' && this._pressStart) {
      const dx = gx - this._pressStart.clientX;
      const dy = gy - this._pressStart.clientY;
      if (dx * dx + dy * dy >= this._tapThreshold * this._tapThreshold) {
        this._pressMoved = true;
      }
    } else if (type === 'pointerup' && this._pressStart) {
      const start = this._pressStart;
      this._pressStart = null;
      if (!this._pressMoved) {
        const dx = gx - start.clientX;
        const dy = gy - start.clientY;
        if (dx * dx + dy * dy < this._tapThreshold * this._tapThreshold) {
          const tapEvent: SubPointerEvent = {
            type: 'tap',
            x: localX,
            y: localY,
            globalX: gx,
            globalY: gy,
            originalEvent: e,
          };
          this.listeners.get('tap')?.forEach((fn) => fn(tapEvent));
        }
      }
    } else if (type === 'pointerleave') {
      this._pressStart = null;
      this._pressMoved = false;
    }

    const hasListeners = (this.listeners.get(type)?.size ?? 0) > 0;
    if (!hasListeners) {
      if (type === 'pointerdown' && this._drag && !blockedBySibling) {
        this.bringToFront();
        return true;
      }
      return false;
    }

    if (type === 'pointerdown' && this._drag && !blockedBySibling) this.bringToFront();
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
    this._drag?.destroy();
    this._drag = null;
    [...this._subRegions].forEach((c) => c.destroy());
    this._subRegions = [];
    this.listeners.clear();
    this.resizeListeners.clear();
    if (this.stage.parent) this.stage.parent.removeChild(this.stage);
    try {
      this.stage.destroy({ children: true });
    } catch { /* stage already destroyed by parent */ }
    this.onDestroy();
  }

  private _dragContext(): DragContext {
    return {
      getBounds: () => this._bounds,
      globalBounds: () => this.globalBounds,
      setPosition: (x: number, y: number) => this.setPosition(x, y),
      bringToFront: () => this.bringToFront(),
      parent: this.parent ? () => ({ bounds: this.parent!.bounds }) : undefined,
      rootStage: this.stage,
      stage: this.stage,
    };
  }
}