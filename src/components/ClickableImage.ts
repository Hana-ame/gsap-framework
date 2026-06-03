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
}

export interface ClickableImage {
  readonly stage: PIXI.Container;
  setUrl(url: string): void;
  destroy(): void;
  readonly destroyed: boolean;
}

const LERP = 0.15;
const SNAP = 0.5;


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
    }
  };

  const startAnim = () => {
    if (!animating) {
      animating = true;
      parent.ticker.add(tick);
    }
  };

  const destroyOverlay = () => {
    if (!overlay) return;
    if (overlay.parent) overlay.parent.removeChild(overlay);
    overlay.destroy();
    overlay = null;
  };

  const goFullScreen = () => {
    if (!sprite) return;
    const pw = window.innerWidth;
    const ph = window.innerHeight;
    expanded = true;

    const ovColor = opts.overlayColor ?? 0x000000;
    const ovAlpha = opts.overlayAlpha ?? 0.6;
    overlay = new PIXI.Graphics();
    overlay.rect(0, 0, pw, ph).fill({ color: ovColor, alpha: ovAlpha });
    overlay.eventMode = 'none';
    parent.rootApp.stage.addChildAt(overlay, 0);

    targetX = 0;
    targetY = 0;
    targetSpriteX = pw / 2;
    targetSpriteY = ph / 2;
    targetScale = Math.min(pw / texW, ph / texH, 1);
    stage.hitArea = new PIXI.Rectangle(0, 0, pw, ph);
    stage.cursor = 'pointer';
    parent.rootApp.stage.addChild(stage);
    startAnim();
  };

  const goToThumb = () => {
    if (!sprite) return;
    expanded = false;
    destroyOverlay();
    targetX = opts.x;
    targetY = opts.y;
    targetSpriteX = thumbW / 2;
    targetSpriteY = thumbH / 2;
    targetScale = Math.min(thumbW / texW, thumbH / texH, 1);
    stage.hitArea = new PIXI.Rectangle(0, 0, thumbW, thumbH);
    stage.cursor = 'pointer';
    parent.stage.addChild(stage);
    startAnim();
  };

  stage.on('pointerdown', () => {
    if (!sprite) return;
    if (expanded) {
      goToThumb();
    } else {
      goFullScreen();
    }
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
      if (animating) parent.ticker.remove(tick);
      destroyOverlay();
      if (stage.parent) stage.parent.removeChild(stage);
      stage.destroy({ children: true });
    },
    get destroyed() { return destroyed; },
  };
}
