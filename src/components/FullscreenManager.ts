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
const DRAG_THRESHOLD = 4;
// Swipe-to-close: if not zoomed and drag-distance exceeds this, close.
const CLOSE_DRAG_THRESHOLD = 80;

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

  // Zoom & drag
  let zoomed = false;
  let fitScale = 1;
  let zoomFactor = 2;
  let isDragging = false;
  let dragStartGlobalX = 0;
  let dragStartGlobalY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  // Double-tap detection — timestamp of last pointerdown; 0 means reset.
  let lastTapMs = 0;
  // Set on double-tap to prevent the immediately following pointerup from closing.
  let suppressClose = false;
  const DBL_TAP_MS = 300;

  const snap = (v: number, t: number) => Math.abs(v - t) < SNAP;

  const tick = (ticker?: PIXI.Ticker) => {
    if (!sprite || destroyed) return;
    const dt = ticker?.deltaTime ?? 1;
    const f = Math.min(LERP * dt, 1);
    sprite.x += (targetX - sprite.x) * f;
    sprite.y += (targetY - sprite.y) * f;
    const cs = sprite.scale.x;
    sprite.scale.set(cs + (targetScale - cs) * f);
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
      proxy.bus.emit('fullscreen:hide');
      proxy.bus.emit('fullscreen:inactive');
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
    if (animating) {
      proxy.ticker.remove(tick);
      animating = false;
      onAnimDone = null;
    }
    zoomed = false;
    isDragging = false;
    lastTapMs = 0;
    suppressClose = false;
    pointerDownOnSprite = false;

    texW = ev.texW;
    texH = ev.texH;
    thumbGlobalX = ev.thumbGlobalX;
    thumbGlobalY = ev.thumbGlobalY;
    thumbW = ev.thumbW;
    thumbH = ev.thumbH;
    zoomFactor = ev.zoomFactor ?? 2;
    const pw = window.innerWidth;
    const ph = window.innerHeight;
    fitScale = Math.min(pw / texW, ph / texH, 1);
    const thumbScale = Math.min(thumbW / texW, thumbH / texH, 1);

    // Reuse overlay — clear+redraw instead of destroy+recreate to avoid
    // PIXI GraphicsContext null reference in the render batch.
    const ovColor = ev.overlayColor ?? 0x000000;
    const ovAlpha = ev.overlayAlpha ?? 0.6;
    if (overlay) {
      overlay.clear().rect(0, 0, pw, ph).fill({ color: ovColor, alpha: ovAlpha });
    } else {
      overlay = new PIXI.Graphics();
      overlay.rect(0, 0, pw, ph).fill({ color: ovColor, alpha: ovAlpha });
      overlay.eventMode = 'none';
      container.addChild(overlay);
    }

    // Reuse sprite — swap texture instead of destroy+recreate.
    if (sprite) {
      sprite.texture = ev.texture;
      sprite.anchor.set(0.5);
    } else {
      sprite = new PIXI.Sprite(ev.texture);
      sprite.anchor.set(0.5);
      sprite.eventMode = 'static';
      container.addChild(sprite);
    }
    sprite.x = thumbGlobalX + thumbW / 2;
    sprite.y = thumbGlobalY + thumbH / 2;
    sprite.scale.set(thumbScale);

    active = true;
    proxy.bus.emit('fullscreen:active');
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
  // Three rules:
  //   1. Single click on overlay (outside image) = close immediately
  //   2. Single click on sprite (image) = nothing
  //   3. Double click on sprite = toggle zoom in/out
  // Distinguish sprite vs overlay via PIXI federated event target:
  //   sprite has eventMode='static' → e.target === sprite for image clicks
  //   overlay has eventMode='none'  → e.target === container for overlay clicks
  let pointerDownOnSprite = false;

  container.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
    if (!active || !sprite) return;
    e.originalEvent?.stopPropagation();
    e.originalEvent?.preventDefault(); // block browser native double-tap zoom

    pointerDownOnSprite = e.target === sprite;

    if (!pointerDownOnSprite) {
      // Rule 1: overlay click → close immediately.
      hide();
      return;
    }

    // Rule 2 & 3: sprite click.
    // If a closing animation is still running, ignore sprite clicks.
    if (onAnimDone) return;

    const now = performance.now();
    if (lastTapMs > 0 && now - lastTapMs < DBL_TAP_MS) {
      // Rule 3: second tap in quick succession → toggle zoom.
      lastTapMs = 0; // prevent triple-tap re-detection
      suppressClose = true;
      if (animating) {
        proxy.ticker.remove(tick);
        animating = false;
        onAnimDone = null;
      }
      toggleZoom(e.globalX, e.globalY);
      return;
    }
    lastTapMs = now;
    suppressClose = false;

    // Track for potential drag (only meaningful when zoomed).
    dragStartGlobalX = e.globalX;
    dragStartGlobalY = e.globalY;
    dragOriginX = sprite.x;
    dragOriginY = sprite.y;
    isDragging = false;
  });

  container.on('globalpointermove', (e: PIXI.FederatedPointerEvent) => {
    if (!active || !sprite) return;
    if (!(e.buttons & 1)) { isDragging = false; return; }
    const dx = e.globalX - dragStartGlobalX;
    const dy = e.globalY - dragStartGlobalY;
    const distSq = dx * dx + dy * dy;
    if (!isDragging) {
      if (distSq > DRAG_THRESHOLD * DRAG_THRESHOLD) {
        isDragging = true;
        if (animating) {
          proxy.ticker.remove(tick);
          animating = false;
        }
      } else {
        return;
      }
    }
    if (zoomed) {
      // Rule: pan when zoomed.
      sprite.x = dragOriginX + dx;
      sprite.y = dragOriginY + dy;
      targetX = sprite.x;
      targetY = sprite.y;
      clampSprite();
    } else {
      // Rule 4: swipe-to-close when not zoomed.
      sprite.x = dragOriginX + dx;
      sprite.y = dragOriginY + dy;
      if (distSq > CLOSE_DRAG_THRESHOLD * CLOSE_DRAG_THRESHOLD) {
        isDragging = false;
        hide();
      }
    }
  });

  container.on('pointerup', (e: PIXI.FederatedPointerEvent) => {
    if (!active || !sprite) return;
    e.originalEvent?.stopPropagation();
    if (!pointerDownOnSprite) return; // rule 1 handled on pointerdown
    if (isDragging) {
      isDragging = false;
      if (!zoomed) {
        // Swipe under close threshold — bounce back to center.
        targetX = window.innerWidth / 2;
        targetY = window.innerHeight / 2;
        targetScale = fitScale;
        startAnim();
      }
      return;
    }
    if (suppressClose) { suppressClose = false; return; }
    // Rule 2: single click on sprite → nothing.
  });
  container.on('pointerupoutside', (e: PIXI.FederatedPointerEvent) => {
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
      if (animating) proxy.ticker.remove(tick);
      unsubShow();
      container.off('globalpointermove');
      container.off('pointerdown');
      container.off('pointerup');
      container.off('pointerupoutside');
      destroyOverlay();
      if (sprite) { container.removeChild(sprite); sprite.destroy(); }
      if (container.parent) container.parent.removeChild(container);
      container.destroy({ children: true });
    },
  };
}
