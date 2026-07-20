/** Scrollable container with mouse-wheel and drag support for PixiJS. */
import * as PIXI from 'pixi.js';
import type { SubCanvas } from '@framework/SubCanvas';

export interface ScrollableOptions {
  parent: SubCanvas;
  width: number;
  height: number;
  direction?: 'vertical' | 'horizontal';
  scrollbar?: boolean;
  accept?: { x?: number; y?: number };
}

export interface Scrollable {
  readonly stage: PIXI.Container;
  readonly content: PIXI.Container;
  readonly bounds: { width: number; height: number };
  scrollTo(x: number, y: number): void;
  scrollBy(dx: number, dy: number): void;
  recalc(): void;
  destroy(): void;
  readonly destroyed: boolean;
  sync(): void;
}

const SCROLLBAR_SIZE = 6;
const SCROLLBAR_PAD = 2;
const DRAG_THRESHOLD = 2;

export function createScrollable(opts: ScrollableOptions): Scrollable {
  const parent = opts.parent;
  const w = opts.width;
  const h = opts.height;
  const dir = opts.direction ?? 'vertical';
  const showScrollbar = opts.scrollbar !== false;

  const stage = new PIXI.Container();
  stage.eventMode = 'static';
  stage.hitArea = new PIXI.Rectangle(0, 0, w, h);
  parent.stage.addChild(stage);

  const mask = new PIXI.Graphics().rect(0, 0, w, h).fill({ color: 0xffffff });
  stage.addChild(mask);

  const content = new PIXI.Container();
  content.eventMode = 'passive';
  content.mask = mask;
  stage.addChild(content);

  let scrollX = opts.accept?.x ?? 0;
  let scrollY = opts.accept?.y ?? 0;
  let contentW = 0;
  let contentH = 0;
  let destroyed = false;

  let scrollbarV: PIXI.Graphics | null = null;
  let scrollbarH: PIXI.Graphics | null = null;

  if (showScrollbar) {
    if (dir === 'vertical') {
      scrollbarV = new PIXI.Graphics();
      scrollbarV.x = w - SCROLLBAR_SIZE - SCROLLBAR_PAD;
      scrollbarV.y = SCROLLBAR_PAD;
      scrollbarV.eventMode = 'none';
      stage.addChild(scrollbarV);
    } else {
      scrollbarH = new PIXI.Graphics();
      scrollbarH.x = SCROLLBAR_PAD;
      scrollbarH.y = h - SCROLLBAR_SIZE - SCROLLBAR_PAD;
      scrollbarH.eventMode = 'none';
      stage.addChild(scrollbarH);
    }
  }

  const calcBounds = () => {
    let maxW = 0;
    let maxH = 0;
    for (const child of content.children) {
      const b = child.getBounds().rectangle;
      const right = child.x + b.width;
      const bottom = child.y + b.height;
      if (right > maxW) maxW = right;
      if (bottom > maxH) maxH = bottom;
    }
    contentW = maxW;
    contentH = maxH;
  };

  const clamp = () => {
    const maxW = Math.max(0, contentW - w);
    const maxH = Math.max(0, contentH - h);
    scrollX = Math.max(0, Math.min(scrollX, maxW));
    scrollY = Math.max(0, Math.min(scrollY, maxH));
  };

  const updateScrollbar = () => {
    if (destroyed) return;
    if (scrollbarV) {
      const ratio = h / Math.max(contentH, h);
      const barH = Math.max(20, h * ratio);
      const maxScroll = Math.max(1, contentH - h);
      const barY = (scrollY / maxScroll) * (h - barH);
      scrollbarV.clear();
      scrollbarV.roundRect(0, barY, SCROLLBAR_SIZE, barH, 3).fill({ color: 0xffffff, alpha: 0.4 });
    }
    if (scrollbarH) {
      const ratio = w / Math.max(contentW, w);
      const barW = Math.max(20, w * ratio);
      const maxScroll = Math.max(1, contentW - w);
      const barX = (scrollX / maxScroll) * (w - barW);
      scrollbarH.clear();
      scrollbarH.roundRect(barX, 0, barW, SCROLLBAR_SIZE, 3).fill({ color: 0xffffff, alpha: 0.4 });
    }
  };

  const sync = () => {
    if (destroyed) return;
    content.x = -scrollX;
    content.y = -scrollY;
    if (scrollbarV) scrollbarV.visible = dir === 'vertical' && contentH > h;
    if (scrollbarH) scrollbarH.visible = dir === 'horizontal' && contentW > w;
    updateScrollbar();
  };

  const recalc = () => {
    if (destroyed) return;
    calcBounds();
    clamp();
    sync();
  };

  const onWheel = (e: PIXI.FederatedWheelEvent) => {
    e.stopPropagation();
    if (dir === 'vertical') {
      scrollY += e.deltaY;
    } else {
      scrollX += e.deltaY;
    }
    clamp();
    sync();
  };
  stage.on('wheel', onWheel);

  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartScrollX = 0;
  let dragStartScrollY = 0;
  let moved = false;

  const applyDrag = (cx: number, cy: number) => {
    if (!dragging) return;
    const dx = cx - dragStartX;
    const dy = cy - dragStartY;
    if (!moved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
    moved = true;
    if (dir === 'vertical') {
      scrollY = dragStartScrollY - dy;
    } else {
      scrollX = dragStartScrollX - dx;
    }
    clamp();
    sync();
  };

  stage.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
    if (dragging) return;
    dragging = true;
    moved = false;
    dragStartX = e.globalX;
    dragStartY = e.globalY;
    dragStartScrollX = scrollX;
    dragStartScrollY = scrollY;
    window.addEventListener('pointermove', onWindowMove);
    window.addEventListener('pointerup', onWindowUp);
    window.addEventListener('pointercancel', onWindowUp);
  });

  const onPxiMove = (e: PIXI.FederatedPointerEvent) => applyDrag(e.globalX, e.globalY);
  const onWindowMove = (e: PointerEvent) => applyDrag(e.clientX, e.clientY);

  const onPxiUp = () => endDrag();
  const onWindowUp = () => endDrag();
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    window.removeEventListener('pointermove', onWindowMove);
    window.removeEventListener('pointerup', onWindowUp);
    window.removeEventListener('pointercancel', onWindowUp);
  };

  stage.on('pointermove', onPxiMove);
  stage.on('pointerup', onPxiUp);
  stage.on('pointerupoutside', onPxiUp);
  stage.on('pointercancel', onPxiUp);

  return {
    stage,
    content,
    get bounds() {
      return { width: w, height: h };
    },
    scrollTo(x: number, y: number) {
      if (destroyed) return;
      scrollX = x;
      scrollY = y;
      clamp();
      sync();
    },
    scrollBy(dx: number, dy: number) {
      if (destroyed) return;
      scrollX += dx;
      scrollY += dy;
      clamp();
      sync();
    },
    recalc,
    sync,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      endDrag();
      stage.off('wheel', onWheel);
      stage.off('pointerdown');
      stage.off('pointermove', onPxiMove);
      stage.off('pointerup', onPxiUp);
      stage.off('pointerupoutside', onPxiUp);
      stage.off('pointercancel', onPxiUp);
      if (stage.parent) stage.parent.removeChild(stage);
      stage.destroy({ children: true });
    },
    get destroyed() {
      return destroyed;
    },
  };
}
