import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

export interface BackgroundLayerOptions {
  screenW: number;
  screenH: number;
  bgColor?: number;
  bgFadeMs?: number;
}

export class BackgroundLayer {
  readonly container: PIXI.Container;
  private _sprites: [PIXI.Sprite, PIXI.Sprite];
  private _activeIndex = 0;
  private _opts: BackgroundLayerOptions;
  private _current: PIXI.Texture | null = null;

  constructor(parent: PIXI.Container, opts: BackgroundLayerOptions) {
    this._opts = opts;
    this.container = new PIXI.Container();
    parent.addChildAt(this.container, 0);

    this._sprites = [
      new PIXI.Sprite(PIXI.Texture.EMPTY),
      new PIXI.Sprite(PIXI.Texture.EMPTY),
    ];
    for (const s of this._sprites) {
      s.alpha = 0;
      s.visible = false;
      this.container.addChild(s);
    }

    this._redrawBg(opts.bgColor ?? 0x000000);
  }

  applyOptions(partial: Partial<BackgroundLayerOptions>): void {
    const oldW = this._opts.screenW;
    const oldH = this._opts.screenH;
    this._opts = { ...this._opts, ...partial };
    if (this._opts.screenW !== oldW || this._opts.screenH !== oldH) {
      for (const s of this._sprites) this._fitSprite(s);
    }
  }

  setBackground(texture: PIXI.Texture | null): void {
    if (texture === this._current) return;
    this._current = texture;

    const old = this._sprites[this._activeIndex];
    gsap.killTweensOf(old);

    if (!texture || texture === PIXI.Texture.EMPTY) {
      gsap.to(old, {
        alpha: 0,
        duration: this._opts.bgFadeMs != null ? this._opts.bgFadeMs / 1000 : 0.5,
        ease: 'power2.out',
        onComplete: () => {
          old.texture = PIXI.Texture.EMPTY;
          old.visible = false;
        },
      });
      return;
    }

    const wasEmpty = old.texture === PIXI.Texture.EMPTY || old.texture.width <= 0;
    const newIdx = 1 - this._activeIndex;
    const next = this._sprites[newIdx];
    gsap.killTweensOf(next);

    next.texture = texture;
    next.visible = true;
    this._fitSprite(next);

    if (wasEmpty) {
      next.alpha = 0;
      gsap.to(next, {
        alpha: 1,
        duration: this._opts.bgFadeMs != null ? this._opts.bgFadeMs / 1000 : 0.5,
        ease: 'power2.out',
      });
    } else {
      next.alpha = 0;
      old.alpha = 1;
      gsap.to(old, {
        alpha: 0,
        duration: this._opts.bgFadeMs != null ? this._opts.bgFadeMs / 1000 : 0.5,
        ease: 'power2.out',
        onComplete: () => {
          old.texture = PIXI.Texture.EMPTY;
          old.visible = false;
        },
      });
      gsap.to(next, {
        alpha: 1,
        duration: this._opts.bgFadeMs != null ? this._opts.bgFadeMs / 1000 : 0.5,
        ease: 'power2.out',
      });
    }

    this._activeIndex = newIdx;
  }

  destroy(): void {
    for (const s of this._sprites) gsap.killTweensOf(s);
    this.container.destroy({ children: true });
  }

  private _fitSprite(sprite: PIXI.Sprite): void {
    if (sprite.texture.width <= 0 || sprite.texture.height <= 0) return;
    const sw = this._opts.screenW;
    const sh = this._opts.screenH;
    const scale = Math.min(sw / sprite.texture.width, sh / sprite.texture.height);
    sprite.scale.set(scale);
    sprite.anchor.set(0.5);
    sprite.x = sw / 2;
    sprite.y = sh / 2;
  }

  private _redrawBg(color: number): void {
    const bg = new PIXI.Graphics()
      .rect(0, 0, this._opts.screenW, this._opts.screenH)
      .fill({ color });
    this.container.addChildAt(bg, 0);
  }
}
