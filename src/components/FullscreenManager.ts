import * as PIXI from 'pixi.js';
import type { SubCanvasProxy } from '../framework/SubCanvasProxy';

export interface FullscreenShowEvent {
  texture: PIXI.Texture;
  texW: number;
  texH: number;
  thumbGlobalX: number;
  thumbGlobalY: number;
  thumbW: number;
  thumbH: number;
  overlayColor?: number;
  overlayAlpha?: number;
  zoomFactor?: number;
}

export interface FullscreenManager {
  destroy(): void;
}

const LERP = 0.15;
const SNAP = 0.5;
const CLICK_MS = 300;
const DRAG_THRESHOLD = 4;

export function createFullscreenManager(proxy: SubCanvasProxy): FullscreenManager {
  const container = new PIXI.Container();
  container.eventMode = 'none';
  container.zIndex = 99999;
  proxy.stage.sortableChildren = true;
  proxy.stage.addChild(container);

  let active = false;
  let destroyed = false;
  let sprite: PIXI.Sprite | null = null;
  let overlay: PIXI.Graphics | null = null;
  let texW = 0;
  let texH = 0;
  let thumbGlobalX = 0;
  let thumbGlobalY = 0;
  let thumbW = 0;
  let thumbH = 0;

  // Animation targets
  let targetX = 0;
  let targetY = 0;
  let targetScale = 1;
  let animating = false;
  let onAnimDone: (() => void) | null = null;
  let justOpened = false;

  // Zoom & drag
  let zoomed = false;
  let fitScale = 1;
  let zoomFactor = 2;
  let isDragging = false;
  let dragStartGlobalX = 0;
  let dragStartGlobalY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  let clickTimer: ReturnType<typeof setTimeout> | null = null;

  const snap = (v: number, t: number) => Math.abs(v - t) < SNAP;

  const tick = () => {
    if (!sprite || destroyed) return;
    sprite.x += (targetX - sprite.x) * LERP;
    sprite.y += (targetY - sprite.y) * LERP;
    const cs = sprite.scale.x;
    sprite.scale.set(cs + (targetScale - cs) * LERP);
    if (
      snap(sprite.x, targetX) && snap(sprite.y, targetY) &&
      snap(sprite.scale.x, targetScale)
    ) {
      sprite.x = targetX;
      sprite.y = targetY;
      sprite.scale.set(targetScale);
      proxy.ticker.remove(tick);
      animating = false;
      if (onAnimDone) {
        const cb = onAnimDone;
        onAnimDone = null;
        cb();
      }
    }
  };

  const startAnim = () => {
    if (!animating) {
      animating = true;
      proxy.ticker.add(tick);
    }
  };

  const clampDim = (v: number, imgDim: number, viewDim: number): number => {
    if (imgDim <= viewDim) return viewDim / 2;
    const lo = viewDim - imgDim / 2;
    const hi = imgDim / 2;
    return Math.max(lo, Math.min(v, hi));
  };

  const clampSprite = () => {
    if (!sprite) return;
    const pw = window.innerWidth;
    const ph = window.innerHeight;
    const sc = sprite.scale.x;
    sprite.x = clampDim(sprite.x, texW * sc, pw);
    sprite.y = clampDim(sprite.y, texH * sc, ph);
  };

  const destroyOverlay = () => {
    if (!overlay) return;
    if (overlay.parent) overlay.parent.removeChild(overlay);
    overlay.destroy();
    overlay = null;
  };

  const hide = () => {
    if (!active || destroyed) return;
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
    if (animating) {
      proxy.ticker.remove(tick);
      animating = false;
      onAnimDone = null;
    }
    zoomed = false;
    targetX = thumbGlobalX + thumbW / 2;
    targetY = thumbGlobalY + thumbH / 2;
    targetScale = Math.min(thumbW / texW, thumbH / texH, 1);
    onAnimDone = () => {
      active = false;
      container.eventMode = 'none';
      container.visible = false;
      destroyOverlay();
      if (sprite) { container.removeChild(sprite); sprite.destroy(); sprite = null; }
    };
    startAnim();
  };

  const toggleZoom = (gx: number, gy: number) => {
    if (!sprite) return;
    const pw = window.innerWidth;
    const ph = window.innerHeight;
    if (zoomed) {
      zoomed = false;
      targetX = pw / 2;
      targetY = ph / 2;
      targetScale = fitScale;
      startAnim();
    } else {
      zoomed = true;
      const zf = zoomFactor;
      const newScale = fitScale * zf;
      targetX = pw / 2 + (gx - pw / 2) * (1 - zf);
      targetY = ph / 2 + (gy - ph / 2) * (1 - zf);
      targetScale = newScale;
      clampSprite();
      startAnim();
    }
  };

  const show = (ev: FullscreenShowEvent) => {
    if (destroyed) return;
    hide(); // close any current view first
    if (sprite) { container.removeChild(sprite); sprite.destroy(); sprite = null; }
    destroyOverlay();

    texW = ev.texW;
    texH = ev.texH;
    thumbGlobalX = ev.thumbGlobalX;
    thumbGlobalY = ev.thumbGlobalY;
    thumbW = ev.thumbW;
    thumbH = ev.thumbH;
    zoomed = false;
    zoomFactor = ev.zoomFactor ?? 2;

    const pw = window.innerWidth;
    const ph = window.innerHeight;
    fitScale = Math.min(pw / texW, ph / texH, 1);
    const thumbScale = Math.min(thumbW / texW, thumbH / texH, 1);

    const ovColor = ev.overlayColor ?? 0x000000;
    const ovAlpha = ev.overlayAlpha ?? 0.6;
    overlay = new PIXI.Graphics();
    overlay.rect(0, 0, pw, ph).fill({ color: ovColor, alpha: ovAlpha });
    overlay.eventMode = 'none';
    container.addChild(overlay);

    sprite = new PIXI.Sprite(ev.texture);
    sprite.anchor.set(0.5);
    sprite.x = thumbGlobalX + thumbW / 2;
    sprite.y = thumbGlobalY + thumbH / 2;
    sprite.scale.set(thumbScale);
    sprite.eventMode = 'none';
    container.addChild(sprite);

    active = true;
    justOpened = true;
    container.visible = true;
    container.eventMode = 'static';
    container.hitArea = new PIXI.Rectangle(0, 0, pw, ph);
    container.cursor = 'pointer';

    targetX = pw / 2;
    targetY = ph / 2;
    targetScale = fitScale;
    startAnim();
  };

  // --- interaction ---
  container.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
    if (!active || !sprite) return;
    dragStartGlobalX = e.globalX;
    dragStartGlobalY = e.globalY;
    dragOriginX = sprite.x;
    dragOriginY = sprite.y;
    isDragging = false;
  });

  proxy.stage.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
    if (!active || !sprite) return;
    if (!isDragging) {
      const dx = e.globalX - dragStartGlobalX;
      const dy = e.globalY - dragStartGlobalY;
      if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
        if (zoomed) {
          isDragging = true;
          if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
          if (animating) {
            proxy.ticker.remove(tick);
            animating = false;
          }
        }
      }
    }
    if (isDragging && zoomed) {
      const dx = e.globalX - dragStartGlobalX;
      const dy = e.globalY - dragStartGlobalY;
      sprite.x = dragOriginX + dx;
      sprite.y = dragOriginY + dy;
      targetX = sprite.x;
      targetY = sprite.y;
      clampSprite();
    }
  });

  proxy.stage.on('pointerup', () => {
    if (!active || !sprite) return;
    if (justOpened) { justOpened = false; return; }
    if (isDragging) { isDragging = false; return; }
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      toggleZoom(dragStartGlobalX, dragStartGlobalY);
    } else {
      clickTimer = setTimeout(() => {
        clickTimer = null;
        hide();
      }, CLICK_MS);
    }
  });
  proxy.stage.on('pointerupoutside', () => {
    if (!active || !sprite) return;
    if (isDragging) { isDragging = false; return; }
  });

  const unsubShow = proxy.bus.on('fullscreen:show', (payload: unknown) => {
    show(payload as FullscreenShowEvent);
  });

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (clickTimer) clearTimeout(clickTimer);
      if (animating) proxy.ticker.remove(tick);
      unsubShow();
      proxy.stage.off('pointermove');
      proxy.stage.off('pointerup');
      proxy.stage.off('pointerupoutside');
      destroyOverlay();
      if (sprite) { container.removeChild(sprite); sprite.destroy(); }
      if (container.parent) container.parent.removeChild(container);
      container.destroy({ children: true });
    },
  };
}
