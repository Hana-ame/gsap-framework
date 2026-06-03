import * as PIXI from 'pixi.js';
import type { SubCanvas } from '../framework/SubCanvas';
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

  stage.on('pointerdown', () => {
    if (!loadedTexture) return;
    const gb = parent.globalBounds;
    const ev: FullscreenShowEvent = {
      texture: loadedTexture,
      texW,
      texH,
      thumbGlobalX: gb.x + opts.x,
      thumbGlobalY: gb.y + opts.y,
      thumbW,
      thumbH,
      overlayColor: opts.overlayColor,
      overlayAlpha: opts.overlayAlpha,
      zoomFactor: opts.zoomFactor,
    };
    bus.emit('fullscreen:show', ev);
  });

  const load = (url: string) => {
    PIXI.Assets.load(url).then((texture) => {
      if (destroyed) return;
      if (!texture || texture.width === 0 || texture.height === 0) return;
      if (sprite) { sprite.destroy(); sprite = null; }
      placeholder.destroy();
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
      if (stage.parent) stage.parent.removeChild(stage);
      stage.destroy({ children: true });
    },
    get destroyed() { return destroyed; },
  };
}
