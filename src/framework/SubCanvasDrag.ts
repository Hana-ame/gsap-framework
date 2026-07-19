import * as PIXI from 'pixi.js';
import type { Rect, DragHandlers } from './SubCanvasTypes';

export function installDragOnHandle(
  handle: PIXI.Container,
  handlers: DragHandlers,
  ctx: {
    getBounds: () => Rect;
    parentBounds: () => Rect | null;
    setPosition: (x: number, y: number) => void;
    bringToFront: () => void;
    rootStage: PIXI.Container;
    stage: PIXI.Container;
    onDragActive?: () => void;
    onDragInactive?: () => void;
  },
): () => void {
  const root = ctx.rootStage;
  let dragging = false;
  let startLocalX = 0;
  let startLocalY = 0;
  let startBoundsX = 0;
  let startBoundsY = 0;

  const applyDrag = (clientX: number, clientY: number) => {
    const local = { x: clientX, y: clientY };
    let nx = startBoundsX + (local.x - startLocalX);
    let ny = startBoundsY + (local.y - startLocalY);
    const constraint = handlers.getBounds?.() ?? ctx.parentBounds() ?? null;
    if (constraint) {
      nx = Math.max(0, Math.min(nx, constraint.width - ctx.getBounds().width));
      ny = Math.max(0, Math.min(ny, constraint.height - ctx.getBounds().height));
    }
    ctx.setPosition(nx, ny);
    handlers.onDrag?.({ x: nx, y: ny });
  };

  const onDown = (e: PIXI.FederatedPointerEvent) => {
    e.stopPropagation();
    const parent = ctx.stage.parent;
    if (!parent) return;
    const local = e.getLocalPosition(parent);
    dragging = true;
    startLocalX = local.x;
    startLocalY = local.y;
    startBoundsX = ctx.getBounds().x;
    startBoundsY = ctx.getBounds().y;
    if (handlers.bringToFront) ctx.bringToFront();
    ctx.onDragActive?.();
    window.addEventListener('pointermove', onWindowMove);
    window.addEventListener('pointerup', onWindowUp);
    window.addEventListener('pointercancel', onWindowUp);
    handlers.onStart?.({ x: ctx.getBounds().x, y: ctx.getBounds().y });
  };

  const onWindowMove = (e: PointerEvent) => {
    if (!dragging) return;
    applyDrag(e.clientX, e.clientY);
  };

  const onWindowUp = () => {
    if (!dragging) return;
    dragging = false;
    window.removeEventListener('pointermove', onWindowMove);
    window.removeEventListener('pointerup', onWindowUp);
    window.removeEventListener('pointercancel', onWindowUp);
    ctx.onDragInactive?.();
    handlers.onEnd?.({ x: ctx.getBounds().x, y: ctx.getBounds().y });
  };

  const onPxiMove = (e: PIXI.FederatedPointerEvent) => {
    if (!dragging) return;
    const parent = ctx.stage.parent;
    if (!parent) return;
    const local = e.getLocalPosition(parent);
    applyDrag(local.x, local.y);
  };

  const onPxiUp = () => {
    if (!dragging) return;
    onWindowUp();
  };

  handle.on('pointerdown', onDown);
  root.on('pointermove', onPxiMove);
  root.on('pointerup', onPxiUp);
  root.on('pointerupoutside', onPxiUp);

  return () => {
    handle.off('pointerdown', onDown);
    root.off('pointermove', onPxiMove);
    root.off('pointerup', onPxiUp);
    root.off('pointerupoutside', onPxiUp);
    window.removeEventListener('pointermove', onWindowMove);
    window.removeEventListener('pointerup', onWindowUp);
    window.removeEventListener('pointercancel', onWindowUp);
  };
}
