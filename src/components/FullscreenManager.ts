/** Fullscreen image viewer with zoom, pan, and transition animations. */
import * as PIXI from 'pixi.js';
import type { SubCanvasProxy } from '@framework/SubCanvasProxy';
import { gsap } from 'gsap';

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
  readonly stage: PIXI.Container;
  readonly destroyed: boolean;
  destroy(): void;
}

const DRAG_THRESHOLD = 4;
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

  // GSAP animation
  let currentTween: gsap.core.Tween | null = null;
  let hiding = false;

  const killTween = () => {
    if (currentTween) {
      currentTween.kill();
      currentTween = null;
    }
  };

  const animateTo = (x: number, y: number, scale: number, onComplete?: () => void) => {
    killTween();
    if (!sprite) return;
    currentTween = gsap.to(sprite, {
      pixi: { x, y, scale },
      duration: 0.3,
      ease: 'power2.out',
      onComplete: () => {
        currentTween = null;
        onComplete?.();
      },
    });
  };

  // Zoom & drag
  let zoomed = false;
  let fitScale = 1;
  let zoomFactor = 2;
  let isDragging = false;
  let dragStartGlobalX = 0;
  let dragStartGlobalY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  let lastTapMs = 0;
  let suppressClose = false;
  const DBL_TAP_MS = 300;

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
    killTween();
    hiding = true;
    zoomed = false;
    const tx = thumbGlobalX + thumbW / 2;
    const ty = thumbGlobalY + thumbH / 2;
    const ts = Math.min(thumbW / texW, thumbH / texH, 1);
    animateTo(tx, ty, ts, () => {
      hiding = false;
      active = false;
      container.eventMode = 'none';
      container.visible = false;
      destroyOverlay();
      if (sprite) { container.removeChild(sprite); sprite.destroy(); sprite = null; }
      proxy.bus.emit('fullscreen:hide');
      proxy.bus.emit('fullscreen:inactive');
    });
  };

  const toggleZoom = (gx: number, gy: number) => {
    if (!sprite) return;
    killTween();
    const pw = window.innerWidth;
    const ph = window.innerHeight;
    if (zoomed) {
      zoomed = false;
      animateTo(pw / 2, ph / 2, fitScale);
    } else {
      zoomed = true;
      const zf = zoomFactor;
      const newScale = fitScale * zf;
      const tx = pw / 2 + (gx - pw / 2) * (1 - zf);
      const ty = ph / 2 + (gy - ph / 2) * (1 - zf);
      sprite.x = tx;
      sprite.y = ty;
      sprite.scale.set(newScale);
      clampSprite();
    }
  };

  const show = (ev: FullscreenShowEvent) => {
    if (destroyed) return;
    killTween();
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

    animateTo(pw / 2, ph / 2, fitScale);
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
    if (hiding) return;

    const now = performance.now();
    if (lastTapMs > 0 && now - lastTapMs < DBL_TAP_MS) {
      lastTapMs = 0;
      suppressClose = true;
      killTween();
      toggleZoom(e.globalX, e.globalY);
      return;
    }
    lastTapMs = now;
    suppressClose = false;

    dragStartGlobalX = e.globalX;
    dragStartGlobalY = e.globalY;
    dragOriginX = sprite.x;
    dragOriginY = sprite.y;
    isDragging = false;
  });

  container.on('globalpointermove', (e: PIXI.FederatedPointerEvent) => {
    if (!active || !sprite || hiding) return;
    if (!(e.buttons & 1)) { isDragging = false; return; }
    const dx = e.globalX - dragStartGlobalX;
    const dy = e.globalY - dragStartGlobalY;
    const distSq = dx * dx + dy * dy;
    if (!isDragging) {
      if (distSq > DRAG_THRESHOLD * DRAG_THRESHOLD) {
        isDragging = true;
        killTween();
      } else {
        return;
      }
    }
    if (zoomed) {
      sprite.x = dragOriginX + dx;
      sprite.y = dragOriginY + dy;
      clampSprite();
    } else {
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
    if (!pointerDownOnSprite) return;
    if (isDragging) {
      isDragging = false;
      if (!zoomed) {
        const pw = window.innerWidth;
        const ph = window.innerHeight;
        animateTo(pw / 2, ph / 2, fitScale);
      }
      return;
    }
    if (suppressClose) { suppressClose = false; return; }
  });
  container.on('pointerupoutside', (e: PIXI.FederatedPointerEvent) => {
    if (!active || !sprite) return;
    if (isDragging) { isDragging = false; return; }
  });

  const unsubShow = proxy.bus.on('fullscreen:show', (payload: unknown) => {
    show(payload as FullscreenShowEvent);
  });

  return {
    get stage() { return container; },
    get destroyed() { return destroyed; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      killTween();
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
