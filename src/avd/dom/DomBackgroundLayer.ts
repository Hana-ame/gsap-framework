import { gsap } from 'gsap';
import { DomContainer, DomGraphics, DomSprite, DomTexture } from './DomNode';

export interface DomBackgroundLayerOptions {
  screenW: number; screenH: number;
  bgColor?: number; bgFadeMs?: number;
}

export class DomBackgroundLayer {
  readonly container: DomContainer;
  private _sprite: DomSprite;
  private _opts: DomBackgroundLayerOptions;
  private _current: DomTexture | null = null;

  constructor(parent: DomContainer, opts: DomBackgroundLayerOptions) {
    this._opts = opts;
    this.container = new DomContainer();
    parent.addChild(this.container);

    this._sprite = new DomSprite(DomTexture.EMPTY);
    this._sprite.alpha = 0;
    this.container.addChild(this._sprite);

    const bg = new DomGraphics()
      .rect(0, 0, opts.screenW, opts.screenH)
      .fill({ color: opts.bgColor ?? 0x000000 });
    this.container.addChild(bg);
  }

  applyOptions(partial: Partial<DomBackgroundLayerOptions>): void {
    const oldW = this._opts.screenW;
    const oldH = this._opts.screenH;
    this._opts = { ...this._opts, ...partial };
    if (this._opts.screenW !== oldW || this._opts.screenH !== oldH) {
      this._fitSprite();
    }
  }

  setBackground(texture: DomTexture | null): void {
    if (texture === this._current) return;
    this._current = texture;

    gsap.killTweensOf(this._sprite);

    if (!texture || texture === DomTexture.EMPTY) {
      gsap.to(this._sprite, {
        alpha: 0,
        duration: this._opts.bgFadeMs != null ? this._opts.bgFadeMs / 1000 : 0.5,
        ease: 'power2.out',
        onComplete: () => {
          this._sprite.texture = DomTexture.EMPTY;
          this._sprite.visible = false;
        },
      });
      return;
    }

    const wasEmpty = !this._sprite.texture || this._sprite.texture === DomTexture.EMPTY;
    this._sprite.texture = texture;
    this._fitSprite();
    this._sprite.visible = true;

    if (wasEmpty) {
      this._sprite.alpha = 1;
    } else {
      this._sprite.alpha = 0;
      gsap.to(this._sprite, {
        alpha: 1,
        duration: this._opts.bgFadeMs != null ? this._opts.bgFadeMs / 1000 : 0.5,
        ease: 'power2.out',
      });
    }
  }

  destroy(): void {
    gsap.killTweensOf(this._sprite);
    this.container.destroy({ children: true });
  }

  private _fitSprite(): void {
    const tex = this._sprite.texture;
    if (!tex || tex === DomTexture.EMPTY || tex.width <= 0 || tex.height <= 0) return;
    const sw = this._opts.screenW;
    const sh = this._opts.screenH;
    const scale = Math.max(sw / tex.width, sh / tex.height);
    this._sprite.scale.x = scale;
    this._sprite.scale.y = scale;
    this._sprite.scale; // force access to avoid unused
  }
}
