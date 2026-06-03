import * as PIXI from 'pixi.js';
import type { SubCanvas } from '../framework/SubCanvas';

export interface ClickableImageOptions {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  overlayColor?: number;
  overlayAlpha?: number;
  zoomFactor?: number;
}

export interface ClickableImage {
  readonly stage: PIXI.Container;
  setUrl(url: string): void;
  destroy(): void;
  readonly destroyed: boolean;
}

const LERP = 0.15;
const SNAP = 0.5;
const CLICK_MS = 300;
const DRAG_THRESHOLD = 4;

export function createClickableImage(parent: SubCanvas, opts: ClickableImageOptions): ClickableImage {
  const stage = new PIXI.Container();
  stage.x = opts.x;
  stage.y = opts.y;
  stage.eventMode = 'static';
  stage.hitArea = new PIXI.Rectangle(0, 0, opts.width, opts.height);
  stage.cursor = 'pointer';
  parent.stage.addChild(stage);

  const thumbW = opts.width;
  const thumbH = opts.height;
  let expanded = false;
  let sprite: PIXI.Sprite | null = null;
  let texW = 0;
  let texH = 0;
  let destroyed = false;
  let overlay: PIXI.Graphics | null = null;

  let targetX = opts.x;
  let targetY = opts.y;
  let targetSpriteX = thumbW / 2;
  let targetSpriteY = thumbH / 2;
  let targetScale = 1;
  let animating = false;
  let onAnimDone: (() => void) | null = null;

  let zoomed = false;
  let fitScale = 1;
  const zoomFactor = opts.zoomFactor ?? 2;
  let isDragging = false;
  let dragStartGlobalX = 0;
  let dragStartGlobalY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  let clickTimer: ReturnType<typeof setTimeout> | null = null;

  const getThumbGlobalPos = (): { x: number; y: number } => {
    const gb = parent.globalBounds;
    return { x: gb.x + opts.x, y: gb.y + opts.y };
  };

  const placeholder = new PIXI.Graphics()
    .rect(0, 0, thumbW, thumbH)
    .fill({ color: 0x1a1a2a })
    .stroke({ width: 1, color: 0x2a2a3a });
  placeholder.eventMode = 'none';
  stage.addChild(placeholder);

  const placeholderText = new PIXI.Text({
    text: 'loading...',
    style: { fontSize: 11, fill: 0x888888, fontFamily: 'monospace' },
  });
  placeholderText.x = (thumbW - placeholderText.width) / 2;
  placeholderText.y = (thumbH - placeholderText.height) / 2;
  placeholderText.eventMode = 'none';
  stage.addChild(placeholderText);

  const snap = (v: number, t: number) => Math.abs(v - t) < SNAP;

  const tick = () => {
    if (!sprite || destroyed) return;
    stage.x += (targetX - stage.x) * LERP;
    stage.y += (targetY - stage.y) * LERP;
    sprite.x += (targetSpriteX - sprite.x) * LERP;
    sprite.y += (targetSpriteY - sprite.y) * LERP;
    const cs = sprite.scale.x;
    sprite.scale.set(cs + (targetScale - cs) * LERP);
    if (
      snap(stage.x, targetX) && snap(stage.y, targetY) &&
      snap(sprite.x, targetSpriteX) && snap(sprite.y, targetSpriteY) &&
      snap(sprite.scale.x, targetScale)
    ) {
      stage.x = targetX;
      stage.y = targetY;
      sprite.x = targetSpriteX;
      sprite.y = targetSpriteY;
      sprite.scale.set(targetScale);
      parent.ticker.remove(tick);
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
      parent.ticker.add(tick);
    }
  };

  const clampStage = () => {
    if (!sprite || !zoomed) return;
    const pw = window.innerWidth;
    const ph = window.innerHeight;
    const sc = sprite.scale.x;
    const imgW = texW * sc;
    const imgH = texH * sc;
    const minX = pw / 2 - imgW / 2;
    const maxX = -pw / 2 + imgW / 2;
    const minY = ph / 2 - imgH / 2;
    const maxY = -ph / 2 + imgH / 2;
    const cx = Math.max(minX, Math.min(targetX, maxX));
    const cy = Math.max(minY, Math.min(targetY, maxY));
    if (cx !== targetX || cy !== targetY) {
      targetX = cx;
      targetY = cy;
    }
  };

  const destroyOverlay = () => {
    if (!overlay) return;
    if (overlay.parent) overlay.parent.removeChild(overlay);
    overlay.destroy();
    overlay = null;
  };

  const toggleZoom = (gx: number, gy: number) => {
    if (!sprite) return;
    if (zoomed) {
      zoomed = false;
      targetX = 0;
      targetY = 0;
      targetScale = fitScale;
      sprite.x = window.innerWidth / 2;
      sprite.y = window.innerHeight / 2;
      startAnim();
    } else {
      zoomed = true;
      const pw = window.innerWidth;
      const ph = window.innerHeight;
      const zf = zoomFactor;
      const newScale = fitScale * zf;
      const nx = (gx - pw / 2) * (1 - zf);
      const ny = (gy - ph / 2) * (1 - zf);
      targetX = nx;
      targetY = ny;
      targetScale = newScale;
      clampStage();
      sprite.x = pw / 2;
      sprite.y = ph / 2;
      startAnim();
    }
  };

  const goFullScreen = () => {
    if (!sprite) return;
    expanded = true;
    zoomed = false;
    const pw = window.innerWidth;
    const ph = window.innerHeight;
    fitScale = Math.min(pw / texW, ph / texH, 1);

    const ovColor = opts.overlayColor ?? 0x000000;
    const ovAlpha = opts.overlayAlpha ?? 0.6;
    overlay = new PIXI.Graphics();
    overlay.rect(0, 0, pw, ph).fill({ color: ovColor, alpha: ovAlpha });
    overlay.eventMode = 'none';
    parent.rootApp.stage.addChild(overlay);

    const global = getThumbGlobalPos();
    parent.rootApp.stage.addChild(stage);
    stage.x = global.x;
    stage.y = global.y;
    sprite.anchor.set(0.5);
    sprite.x = thumbW / 2;
    sprite.y = thumbH / 2;

    targetX = 0;
    targetY = 0;
    targetSpriteX = pw / 2;
    targetSpriteY = ph / 2;
    targetScale = fitScale;
    stage.hitArea = new PIXI.Rectangle(0, 0, pw, ph);
    stage.cursor = 'pointer';
    startAnim();
  };

  const goToThumb = () => {
    if (!sprite) return;
    expanded = false;
    zoomed = false;
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }

    const global = getThumbGlobalPos();
    targetX = global.x;
    targetY = global.y;
    targetSpriteX = thumbW / 2;
    targetSpriteY = thumbH / 2;
    targetScale = Math.min(thumbW / texW, thumbH / texH, 1);

    onAnimDone = () => {
      destroyOverlay();
      stage.x = opts.x;
      stage.y = opts.y;
      sprite.anchor.set(0.5);
      sprite.x = thumbW / 2;
      sprite.y = thumbH / 2;
      stage.hitArea = new PIXI.Rectangle(0, 0, thumbW, thumbH);
      stage.cursor = 'pointer';
      parent.stage.addChild(stage);
    };

    startAnim();
  };

  // --- interaction ---
  const root = parent.rootApp.stage;

  stage.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
    if (!sprite) return;
    if (!expanded) {
      goFullScreen();
      return;
    }
    dragStartGlobalX = e.globalX;
    dragStartGlobalY = e.globalY;
    dragOriginX = stage.x;
    dragOriginY = stage.y;
    isDragging = false;
  });

  root.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
    if (!expanded || !sprite) return;
    if (!isDragging) {
      const dx = e.globalX - dragStartGlobalX;
      const dy = e.globalY - dragStartGlobalY;
      if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
        if (zoomed) {
          isDragging = true;
          if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
          if (animating) {
            parent.ticker.remove(tick);
            animating = false;
          }
        }
      }
    }
    if (isDragging && zoomed) {
      const dx = e.globalX - dragStartGlobalX;
      const dy = e.globalY - dragStartGlobalY;
      targetX = dragOriginX + dx;
      targetY = dragOriginY + dy;
      clampStage();
      stage.x = targetX;
      stage.y = targetY;
    }
  });

  root.on('pointerup', () => {
    if (!expanded || !sprite) return;
    if (isDragging) { isDragging = false; return; }
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      toggleZoom(dragStartGlobalX, dragStartGlobalY);
    } else {
      clickTimer = setTimeout(() => {
        clickTimer = null;
        goToThumb();
      }, CLICK_MS);
    }
  });
  root.on('pointerupoutside', () => {
    if (!expanded || !sprite) return;
    if (isDragging) { isDragging = false; return; }
  });

  const load = (url: string) => {
    PIXI.Assets.load(url).then((texture) => {
      if (destroyed) return;
      if (!texture || texture.width === 0 || texture.height === 0) return;
      if (sprite) { sprite.destroy(); sprite = null; }
      placeholder.destroy();
      placeholderText.destroy();
      texW = texture.width;
      texH = texture.height;
      sprite = new PIXI.Sprite(texture);
      sprite.eventMode = 'none';
      sprite.anchor.set(0.5);
      sprite.x = thumbW / 2;
      sprite.y = thumbH / 2;
      sprite.scale.set(Math.min(thumbW / texW, thumbH / texH, 1));
      stage.addChild(sprite);
      stage.hitArea = new PIXI.Rectangle(0, 0, thumbW, thumbH);
    }).catch(() => {});
  };

  load(opts.url);

  return {
    stage,
    setUrl(url: string) {
      if (destroyed) return;
      load(url);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (clickTimer) clearTimeout(clickTimer);
      if (animating) parent.ticker.remove(tick);
      root.off('pointermove');
      root.off('pointerup');
      root.off('pointerupoutside');
      destroyOverlay();
      if (stage.parent) stage.parent.removeChild(stage);
      stage.destroy({ children: true });
    },
    get destroyed() { return destroyed; },
  };
}
