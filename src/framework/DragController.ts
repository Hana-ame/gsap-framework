/** DragController — 拖拽交互控制器，支持鼠标/触摸拖拽、拖拽手柄与边界约束。 */
import * as PIXI from 'pixi.js';
import type { Rect, SubPointerType } from './SubCanvasTypes';

export const DRAG_HANDLE_LABEL = 'subcanvas-drag-handle';

export type DragMode = 'title' | 'anywhere' | 'none';

export interface DragOptions {
  mode: DragMode;
  tapThreshold?: number;
  dragBounds?: () => Rect | null;
  bringToFront?: boolean;
  onStart?: (p: { x: number; y: number }) => void;
  onDrag?: (p: { x: number; y: number }) => void;
  onEnd?: (p: { x: number; y: number }) => void;
}

export interface DragContext {
  getBounds(): Rect;
  globalBounds(): Rect;
  setPosition(x: number, y: number): void;
  bringToFront(): void;
  parent?(): { bounds: Rect } | null;
  rootStage: PIXI.Container;
  stage: PIXI.Container;
}

export class DragController {
  readonly mode: DragMode;
  private _opts: DragOptions;
  private _ctx: DragContext;

  private _isDragging = false;
  private _perHandleCleanups = new Map<PIXI.Container, () => void>();
  private _dragHandles = new WeakSet<PIXI.Container>();

  private _dragLocalStart: { x: number; y: number } | null = null;
  private _onWindowMove: ((e: PointerEvent) => void) | null = null;
  private _onWindowUp: ((e: PointerEvent) => void) | null = null;

  constructor(opts: DragOptions, ctx: DragContext) {
    this._opts = opts;
    this._ctx = ctx;
    this.mode = opts.mode;
  }

  get isDragging(): boolean {
    return this._isDragging;
  }

  installHandle(handle: PIXI.Container): void {
    if (this.mode !== 'title') return;
    if (this._dragHandles.has(handle)) return;
    this._dragHandles.add(handle);
    this._perHandleCleanups.set(handle, this._installOnHandle(handle));
  }

  uninstallHandle(handle: PIXI.Container): void {
    const cleanup = this._perHandleCleanups.get(handle);
    if (cleanup) {
      cleanup();
      this._perHandleCleanups.delete(handle);
    }
    this._dragHandles.delete(handle);
  }

  hasHandle(handle: PIXI.Container): boolean {
    return this._dragHandles.has(handle);
  }

  interceptPointer(type: SubPointerType, e: PointerEvent): boolean {
    if (this.mode !== 'anywhere') return false;

    if (type === 'pointerdown') {
      this._dragLocalStart = { x: e.clientX, y: e.clientY };
      this._isDragging = false;
      this._installWindowFallback();
      return false;
    }

    if (type === 'pointermove' && this._dragLocalStart) {
      this._applyAnywhereDrag(e.clientX, e.clientY);
      if (this._isDragging) return true;
      return false;
    }

    if ((type === 'pointerup' || type === 'pointerleave') && this._dragLocalStart) {
      this._endAnywhereDrag();
      return this._isDragging;
    }

    return false;
  }

  destroy(): void {
    this._uninstallWindowFallback();
    for (const cleanup of this._perHandleCleanups.values()) cleanup();
    this._perHandleCleanups.clear();
    this._dragHandles = new WeakSet();
    this._dragLocalStart = null;
    this._isDragging = false;
  }

  private _installOnHandle(handle: PIXI.Container): () => void {
    const ctx = this._ctx;
    const opts = this._opts;

    const root = ctx.rootStage;
    let localDragging = false;
    let startLocalX = 0;
    let startLocalY = 0;
    let startBoundsX = 0;
    let startBoundsY = 0;

    const applyDrag = (clientX: number, clientY: number) => {
      let nx = startBoundsX + (clientX - startLocalX);
      let ny = startBoundsY + (clientY - startLocalY);
      const constraint = opts.dragBounds?.() ?? ctx.parent?.()?.bounds ?? null;
      if (constraint) {
        nx = Math.max(0, Math.min(nx, constraint.width - ctx.getBounds().width));
        ny = Math.max(0, Math.min(ny, constraint.height - ctx.getBounds().height));
      }
      ctx.setPosition(nx, ny);
      opts.onDrag?.({ x: nx, y: ny });
    };

    const onDown = (pixiEvent: PIXI.FederatedPointerEvent) => {
      pixiEvent.stopPropagation();
      localDragging = true;
      this._isDragging = true;
      startLocalX = pixiEvent.clientX;
      startLocalY = pixiEvent.clientY;
      startBoundsX = ctx.getBounds().x;
      startBoundsY = ctx.getBounds().y;
      if (opts.bringToFront !== false) ctx.bringToFront();
      window.addEventListener('pointermove', onWindowMove);
      window.addEventListener('pointerup', onWindowUp);
      window.addEventListener('pointercancel', onWindowUp);
      opts.onStart?.({ x: ctx.getBounds().x, y: ctx.getBounds().y });
    };

    const onWindowMove = (e: PointerEvent) => {
      if (!localDragging) return;
      applyDrag(e.clientX, e.clientY);
    };

    const onWindowUp = () => {
      if (!localDragging) return;
      localDragging = false;
      this._isDragging = false;
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
      opts.onEnd?.({ x: ctx.getBounds().x, y: ctx.getBounds().y });
    };

    const onPixiMove = (pixiEvent: PIXI.FederatedPointerEvent) => {
      if (!localDragging) return;
      applyDrag(pixiEvent.clientX, pixiEvent.clientY);
    };

    const onPixiUp = () => {
      if (!localDragging) return;
      onWindowUp();
    };

    handle.on('pointerdown', onDown);
    root.on('pointermove', onPixiMove);
    root.on('pointerup', onPixiUp);
    root.on('pointerupoutside', onPixiUp);

    // 手柄离开场景图时自动注销，无需手动调用 uninstallHandle
    const onRemoved = () => this.uninstallHandle(handle);
    handle.on('removed', onRemoved);

    return () => {
      handle.off('removed', onRemoved);
      handle.off('pointerdown', onDown);
      root.off('pointermove', onPixiMove);
      root.off('pointerup', onPixiUp);
      root.off('pointerupoutside', onPixiUp);
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
    };
  }

  private _installWindowFallback(): void {
    this._uninstallWindowFallback();
    this._onWindowMove = (e: PointerEvent) => {
      if (!this._isDragging || !this._dragLocalStart) return;
      this._applyAnywhereDrag(e.clientX, e.clientY);
    };
    this._onWindowUp = () => {
      this._endAnywhereDrag();
    };
    window.addEventListener('pointermove', this._onWindowMove);
    window.addEventListener('pointerup', this._onWindowUp);
  }

  private _uninstallWindowFallback(): void {
    if (this._onWindowMove) {
      window.removeEventListener('pointermove', this._onWindowMove);
      this._onWindowMove = null;
    }
    if (this._onWindowUp) {
      window.removeEventListener('pointerup', this._onWindowUp);
      this._onWindowUp = null;
    }
  }

  private _applyAnywhereDrag(clientX: number, clientY: number): void {
    if (!this._dragLocalStart) return;

    const bounds = this._ctx.getBounds();
    const dx = clientX - this._dragLocalStart.x;
    const dy = clientY - this._dragLocalStart.y;
    const tapThreshold = this._opts.tapThreshold ?? 4;

    if (!this._isDragging && dx * dx + dy * dy >= tapThreshold * tapThreshold) {
      this._isDragging = true;
      if (this._opts.bringToFront !== false) this._ctx.bringToFront();
      this._opts.onStart?.({ x: bounds.x, y: bounds.y });
    }
    if (!this._isDragging) return;

    let nx = bounds.x + dx;
    let ny = bounds.y + dy;
    const constraint = this._opts.dragBounds?.() ?? this._ctx.parent?.()?.bounds ?? null;
    if (constraint) {
      nx = Math.max(0, Math.min(nx, constraint.width - bounds.width));
      ny = Math.max(0, Math.min(ny, constraint.height - bounds.height));
    }
    this._ctx.setPosition(nx, ny);
    this._opts.onDrag?.({ x: nx, y: ny });
    this._dragLocalStart = { x: clientX, y: clientY };
  }

  private _endAnywhereDrag(): void {
    if (this._isDragging) {
      const bounds = this._ctx.getBounds();
      this._opts.onEnd?.({ x: bounds.x, y: bounds.y });
    }
    this._uninstallWindowFallback();
    this._dragLocalStart = null;
    this._isDragging = false;
  }
}
