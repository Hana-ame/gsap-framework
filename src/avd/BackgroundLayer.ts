/** Manages full-screen background image display with crossfade. */
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
  private _sprite: PIXI.Sprite;
  private _opts: BackgroundLayerOptions;
  private _current: PIXI.Texture | null = null;

  constructor(parent: PIXI.Container, opts: BackgroundLayerOptions) {
    this._opts = opts;

    this.container = new PIXI.Container();
    parent.addChildAt(this.container, 0);

    this._sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    this._sprite.alpha = 0;
    this.container.addChild(this._sprite);

    this._redrawBg(opts.bgColor ?? 0x000000);
  }

  applyOptions(partial: Partial<BackgroundLayerOptions>): void {
    const oldW = this._opts.screenW;
    const oldH = this._opts.screenH;
    this._opts = { ...this._opts, ...partial };
    if (this._opts.screenW !== oldW || this._opts.screenH !== oldH) {
      this._fitSprite();
    }
  }

  setBackground(texture: PIXI.Texture | null): void {
    if (texture === this._current) return;
    this._current = texture;

    gsap.killTweensOf(this._sprite);

    if (!texture || texture === PIXI.Texture.EMPTY) {
      gsap.to(this._sprite, {
        alpha: 0,
        duration: this._opts.bgFadeMs != null ? this._opts.bgFadeMs / 1000 : 500 / 1000,
        ease: 'power2.out',
        onComplete: () => {
          this._sprite.texture = PIXI.Texture.EMPTY;
          this._sprite.visible = false;
        },
      });
      return;
    }

    const wasEmpty = this._sprite.texture === PIXI.Texture.EMPTY || this._sprite.texture.width <= 0;
    this._sprite.texture = texture;
    this._fitSprite();
    this._sprite.visible = true;

    if (wasEmpty) {
      this._sprite.alpha = 1;
    } else {
      this._sprite.alpha = 0;
      gsap.to(this._sprite, {
        alpha: 1,
        duration: this._opts.bgFadeMs != null ? this._opts.bgFadeMs / 1000 : 500 / 1000,
        ease: 'power2.out',
      });
    }
  }

  destroy(): void {
    gsap.killTweensOf(this._sprite);
    this.container.destroy({ children: true });
  }

  private _fitSprite(): void {
    if (this._sprite.texture.width <= 0 || this._sprite.texture.height <= 0) return;
    const sw = this._opts.screenW;
    const sh = this._opts.screenH;
    const scale = Math.max(sw / this._sprite.texture.width, sh / this._sprite.texture.height);
    this._sprite.scale.set(scale);
    this._sprite.anchor.set(0.5);
    this._sprite.x = sw / 2;
    this._sprite.y = sh / 2;
  }

  private _redrawBg(color: number): void {
    const bg = new PIXI.Graphics()
      .rect(0, 0, this._opts.screenW, this._opts.screenH)
      .fill({ color });
    this.container.addChildAt(bg, 0);
  }
}
