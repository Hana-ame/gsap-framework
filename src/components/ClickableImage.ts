import * as PIXI from 'pixi.js';
import type { SubCanvas } from '../framework/SubCanvas';

export interface ClickableImageOptions {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ClickableImage {
  readonly stage: PIXI.Container;
  setUrl(url: string): void;
  destroy(): void;
  readonly destroyed: boolean;
}

type Mode = 'thumb' | 'fit' | 'zoom';

export function createClickableImage(parent: SubCanvas, opts: ClickableImageOptions): ClickableImage {
  const stage = new PIXI.Container();
  stage.x = opts.x;
  stage.y = opts.y;
  stage.eventMode = 'static';
  stage.cursor = 'pointer';
  parent.stage.addChild(stage);

  const thumbW = opts.width;
  const thumbH = opts.height;
  let mode: Mode = 'thumb';
  let sprite: PIXI.Sprite | null = null;
  let texW = 0;
  let texH = 0;
  let destroyed = false;

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

  const hitArea = new PIXI.Graphics().rect(0, 0, thumbW, thumbH);
  hitArea.eventMode = 'none';
  stage.addChild(hitArea);

  const fitScale = () => {
    if (!sprite) return 1;
    const pw = parent.bounds.width;
    const ph = parent.bounds.height;
    return Math.min(pw / texW, ph / texH, 2);
  };

  const zoomScale = () => fitScale() * 2;

  const applyMode = () => {
    if (!sprite) return;
    const pw = parent.bounds.width;
    const ph = parent.bounds.height;
    sprite.anchor.set(0.5);
    if (mode === 'thumb') {
      stage.x = opts.x;
      stage.y = opts.y;
      sprite.x = thumbW / 2;
      sprite.y = thumbH / 2;
      const s = Math.min(thumbW / texW, thumbH / texH, 1);
      sprite.scale.set(s);
      stage.hitArea = new PIXI.Rectangle(0, 0, thumbW, thumbH);
      stage.cursor = 'pointer';
    } else {
      stage.x = 0;
      stage.y = 0;
      sprite.x = pw / 2;
      sprite.y = ph / 2;
      sprite.scale.set(mode === 'fit' ? fitScale() : zoomScale());
      stage.hitArea = new PIXI.Rectangle(0, 0, pw, ph);
      stage.cursor = 'grab';
    }
  };

  let clickTimer: ReturnType<typeof setTimeout> | null = null;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let origX = 0;
  let origY = 0;

  stage.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
    if (mode === 'thumb') {
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
        mode = 'zoom';
      } else {
        clickTimer = setTimeout(() => {
          clickTimer = null;
          mode = 'fit';
          applyMode();
        }, 250);
      }
    } else {
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
        mode = 'thumb';
      } else {
        clickTimer = setTimeout(() => {
          clickTimer = null;
        }, 250);
      }
      dragging = true;
      dragStartX = e.globalX;
      dragStartY = e.globalY;
      origX = sprite?.x ?? 0;
      origY = sprite?.y ?? 0;
      stage.cursor = 'grabbing';
    }
    applyMode();
  });

  const onMove = (e: PIXI.FederatedPointerEvent) => {
    if (!dragging || !sprite) return;
    const dx = e.globalX - dragStartX;
    const dy = e.globalY - dragStartY;
    sprite.x = origX + dx;
    sprite.y = origY + dy;
  };

  const onUp = () => {
    dragging = false;
    if (mode !== 'thumb') stage.cursor = 'grab';
  };

  stage.on('pointermove', onMove);
  stage.on('pointerup', onUp);
  stage.on('pointerupoutside', onUp);
  stage.on('pointercancel', onUp);

  const load = (url: string) => {
    PIXI.Assets.load(url).then((texture) => {
      if (destroyed) return;
      if (!texture || texture.width === 0 || texture.height === 0) return;
      if (sprite) { sprite.destroy(); sprite = null; }
      placeholder.destroy();
      placeholderText.destroy();
      hitArea.destroy();
      texW = texture.width;
      texH = texture.height;
      sprite = new PIXI.Sprite(texture);
      sprite.eventMode = 'none';
      stage.addChild(sprite);
      applyMode();
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
      stage.off('pointermove', onMove);
      stage.off('pointerup', onUp);
      stage.off('pointerupoutside', onUp);
      stage.off('pointercancel', onUp);
      if (stage.parent) stage.parent.removeChild(stage);
      stage.destroy({ children: true });
    },
    get destroyed() { return destroyed; },
  };
}
