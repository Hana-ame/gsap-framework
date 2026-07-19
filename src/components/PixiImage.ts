import * as PIXI from 'pixi.js';
import type { SubCanvas } from '../framework/SubCanvas';

const DEFAULT_BG = 0x1a1a2a;
const DEFAULT_BORDER = 0x2a2a3a;
const DEFAULT_TEXT_COLOR = 0x888888;
const DEFAULT_ERROR_COLOR = 0xff5577;
const FONT = 'monospace';
const TEXT_BASE = 12;

export interface PixiImageOptions {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  maxWidth?: number;
  maxHeight?: number;
  placeholderText?: string;
  placeholderBg?: number;
  placeholderBorder?: number;
  placeholderTextColor?: number;
  showErrorHint?: boolean;
  onLoad?: (texture: PIXI.Texture) => void;
  onError?: (err: Error) => void;
}

export interface PixiImageHandle {
  setUrl(url: string): void;
  setErrorHintVisible(visible: boolean): void;
  destroy(): void;
  readonly destroyed: boolean;
  readonly stage: PIXI.Container;
}

export function createLoadingImage(parent: SubCanvas, opts: PixiImageOptions): PixiImageHandle {
  const container = new PIXI.Container();
  container.x = opts.x;
  container.y = opts.y;
  container.eventMode = 'none';
  parent.stage.addChild(container);

  const maxW = opts.maxWidth ?? opts.width;
  const maxH = opts.maxHeight ?? opts.height;
  const phBg = opts.placeholderBg ?? DEFAULT_BG;
  const phBorder = opts.placeholderBorder ?? DEFAULT_BORDER;
  const phTextColor = opts.placeholderTextColor ?? DEFAULT_TEXT_COLOR;

  let placeholder: PIXI.Container | null = null;
  let sprite: PIXI.Sprite | null = null;
  let currentToken = 0;
  let destroyed = false;
  let errorHintVisible = opts.showErrorHint ?? true;
  let lastError: string | null = null;

  const buildPlaceholder = (text: string, color: number) => {
    if (placeholder) {
      placeholder.destroy({ children: true });
      placeholder = null;
    }
    const c = new PIXI.Container();
    const bg = new PIXI.Graphics()
      .rect(0, 0, opts.width, opts.height)
      .fill({ color: phBg, alpha: 0.9 })
      .stroke({ width: 1, color: phBorder });
    bg.eventMode = 'none';
    c.addChild(bg);
    const t = new PIXI.Text({
      text,
      style: {
        fontSize: TEXT_BASE,
        fill: color,
        fontFamily: FONT,
        wordWrap: true,
        wordWrapWidth: opts.width - 16,
      },
    });
    t.x = (opts.width - t.width) / 2;
    t.y = (opts.height - t.height) / 2;
    t.eventMode = 'none';
    c.addChild(t);
    const mask = new PIXI.Graphics().rect(0, 0, opts.width, opts.height).fill({ color: 0xffffff });
    c.addChild(mask);
    c.mask = mask;
    container.addChild(c);
    placeholder = c;
  };

  const showSprite = (texture: PIXI.Texture) => {
    if (placeholder) {
      placeholder.destroy({ children: true });
      placeholder = null;
    }
    if (sprite) {
      sprite.destroy();
      sprite = null;
    }
    const s = new PIXI.Sprite(texture);
    s.eventMode = 'none';
    s.anchor.set(0.5);
    s.x = opts.width / 2;
    s.y = opts.height / 2;
    const scale = Math.min(maxW / texture.width, maxH / texture.height, 1);
    s.scale.set(scale);
    container.addChild(s);
    sprite = s;
  };

  const buildError = (msg: string) => {
    lastError = msg;
    if (errorHintVisible) {
      buildPlaceholder(`(load failed: ${msg})`, DEFAULT_ERROR_COLOR);
    } else {
      buildPlaceholder('(load failed)', DEFAULT_ERROR_COLOR);
    }
  };

  const load = (url: string) => {
    const token = ++currentToken;
    lastError = null;
    buildPlaceholder(opts.placeholderText ?? 'loading...', phTextColor);
    const timeout = setTimeout(() => {
      if (destroyed || token !== currentToken) return;
      buildError('timeout');
      opts.onError?.(new Error('timeout'));
    }, 15000);
    PIXI.Assets.load({ src: url })
      .then((texture) => {
        clearTimeout(timeout);
        if (destroyed || token !== currentToken) return;
        if (!texture || texture.width === 0 || texture.height === 0) {
          buildError('empty texture');
          opts.onError?.(new Error('empty texture'));
          return;
        }
        showSprite(texture);
        opts.onLoad?.(texture);
      })
      .catch((err: unknown) => {
        clearTimeout(timeout);
        if (destroyed || token !== currentToken) return;
        const msg = err instanceof Error ? err.message : String(err);
        buildError(msg);
        opts.onError?.(err instanceof Error ? err : new Error(msg));
      });
  };

  load(opts.url);

  return {
    setUrl(url: string) {
      if (destroyed) return;
      load(url);
    },
    setErrorHintVisible(visible: boolean) {
      if (destroyed) return;
      errorHintVisible = visible;
      if (lastError) {
        if (visible) {
          buildPlaceholder(`(load failed: ${lastError})`, DEFAULT_ERROR_COLOR);
        } else {
          buildPlaceholder('(load failed)', DEFAULT_ERROR_COLOR);
        }
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      currentToken++;
      if (placeholder) {
        placeholder.destroy({ children: true });
        placeholder = null;
      }
      if (sprite) {
        sprite.destroy();
        sprite = null;
      }
      if (container.parent) container.parent.removeChild(container);
      container.destroy({ children: true });
    },
    get destroyed() {
      return destroyed;
    },
    get stage() { return container; },
  };
}
