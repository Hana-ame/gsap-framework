import * as PIXI from 'pixi.js';
import type { SubCanvas, SubPointerEvent } from '../framework/SubCanvas';
import type { EventBus } from '../framework/EventBus';
import type { FullscreenShowEvent } from './FullscreenManager';

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
  destroy(): void;
  readonly destroyed: boolean;
}

const CLICK_THRESHOLD_PX = 4;

export function createClickableImage(parent: SubCanvas, bus: EventBus, opts: ClickableImageOptions): ClickableImage {
  const stage = new PIXI.Container();
  stage.x = opts.x;
  stage.y = opts.y;
  stage.eventMode = 'static';
  stage.hitArea = new PIXI.Rectangle(0, 0, opts.width, opts.height);
  stage.cursor = 'pointer';
  parent.stage.addChild(stage);

  const thumbW = opts.width;
  const thumbH = opts.height;
  let destroyed = false;
  let sprite: PIXI.Sprite | null = null;
  let loadedTexture: PIXI.Texture | null = null;
  let texW = 0;
  let texH = 0;

  // Press/release click-threshold state
  let pressGlobalX = 0;
  let pressGlobalY = 0;
  let pressTexture: PIXI.Texture | null = null;
  let pressBounds = { x: 0, y: 0, width: 0, height: 0 };

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

  // Track whether FullscreenManager is active — when FM is on top,
  // AABB routing still receives pointer events (window listeners bypass
  // PIXI event consumption), so we must guard the emit ourselves.
  let fullscreenActive = false;
  const unsubActive = bus.on('fullscreen:active', () => { fullscreenActive = true; });
  const unsubInactive = bus.on('fullscreen:inactive', () => { fullscreenActive = false; });

  const onPress = (e: SubPointerEvent) => {
    if (fullscreenActive) return;
    if (!loadedTexture) return;
    const rx = e.x - opts.x;
    const ry = e.y - opts.y;
    if (rx < 0 || rx > thumbW || ry < 0 || ry > thumbH) return;
    pressGlobalX = e.x;
    pressGlobalY = e.y;
    pressTexture = loadedTexture;
    pressBounds = {
      x: parent.globalBounds.x + opts.x,
      y: parent.globalBounds.y + opts.y,
      width: thumbW,
      height: thumbH,
    };
  };

  const onRelease = (e: SubPointerEvent) => {
    if (fullscreenActive) return;
    if (!pressTexture) return;
    const texture = pressTexture;
    const bounds = pressBounds;
    pressTexture = null;
    const dx = e.x - pressGlobalX;
    const dy = e.y - pressGlobalY;
    if (Math.abs(dx) > CLICK_THRESHOLD_PX || Math.abs(dy) > CLICK_THRESHOLD_PX) return;
    const ev: FullscreenShowEvent = {
      texture,
      texW,
      texH,
      thumbGlobalX: bounds.x,
      thumbGlobalY: bounds.y,
      thumbW: bounds.width,
      thumbH: bounds.height,
      overlayColor: opts.overlayColor,
      overlayAlpha: opts.overlayAlpha,
      zoomFactor: opts.zoomFactor,
    };
    bus.emit('fullscreen:show', ev);
  };

  parent.onPress(onPress);
  parent.onRelease(onRelease);

  const load = (url: string) => {
    PIXI.Assets.load({ src: url }).then((texture) => {
      if (destroyed) return;
      if (!texture || texture.width === 0 || texture.height === 0) return;
      if (sprite) { sprite.removeFromParent(); sprite.destroy(); sprite = null; }
      placeholder.removeFromParent();
      placeholder.destroy();
      placeholderText.removeFromParent();
      placeholderText.destroy();
      loadedTexture = texture;
      texW = texture.width;
      texH = texture.height;
      sprite = new PIXI.Sprite(texture);
      sprite.eventMode = 'none';
      const scale = Math.min(thumbW / texW, thumbH / texH, 1);
      sprite.width = texW * scale;
      sprite.height = texH * scale;
      sprite.x = (thumbW - sprite.width) / 2;
      sprite.y = (thumbH - sprite.height) / 2;
      stage.addChild(sprite);
      stage.hitArea = new PIXI.Rectangle(0, 0, thumbW, thumbH);
    }).catch(() => {});
  };

  load(opts.url);

  return {
    stage,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      unsubActive();
      unsubInactive();
      parent.offPointer('pointerdown', onPress);
      parent.offPointer('pointerup', onRelease);
      if (stage.parent) stage.parent.removeChild(stage);
      stage.destroy({ children: true });
    },
    get destroyed() { return destroyed; },
  };
}
