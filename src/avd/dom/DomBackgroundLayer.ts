import type { AnimationDriver } from '@framework/animation/types';
import { GSAPDriver } from '@framework/animation/GSAPDriver';
import { DomContainer, DomGraphics, DomSprite, DomTexture } from './DomNode';

export interface DomBackgroundLayerOptions {
  screenW: number; screenH: number;
  bgColor?: number; bgFadeMs?: number;
}

export class DomBackgroundLayer {
  readonly container: DomContainer;
  private _sprites: [DomSprite, DomSprite];
  private _activeIndex = 0;
  private _opts: DomBackgroundLayerOptions;
  private _current: DomTexture | null = null;
  private _driver: AnimationDriver;

  constructor(parent: DomContainer, opts: DomBackgroundLayerOptions, driver?: AnimationDriver) {
    this._driver = driver ?? GSAPDriver.INSTANCE;
    this._opts = opts;
    this.container = new DomContainer();
    parent.addChild(this.container);

    const bg = new DomGraphics()
      .rect(0, 0, opts.screenW, opts.screenH)
      .fill({ color: opts.bgColor ?? 0x000000 });
    this.container.addChild(bg);

    this._sprites = [
      new DomSprite(DomTexture.EMPTY),
      new DomSprite(DomTexture.EMPTY),
    ];
    for (const s of this._sprites) {
      s.alpha = 0;
      s.visible = false;
      this.container.addChild(s);
    }
  }

  applyOptions(partial: Partial<DomBackgroundLayerOptions>): void {
    const oldW = this._opts.screenW;
    const oldH = this._opts.screenH;
    this._opts = { ...this._opts, ...partial };
    if (this._opts.screenW !== oldW || this._opts.screenH !== oldH) {
      for (const s of this._sprites) this._fitSprite(s);
    }
  }

  setBackground(texture: DomTexture | null): void {
    if (texture === this._current) return;
    this._current = texture;

    this._driver.killTweensOf(this._sprites[0]);
    this._driver.killTweensOf(this._sprites[1]);

    if (!texture || texture === DomTexture.EMPTY) {
      const s = this._sprites[this._activeIndex];
      s.alpha = 0;
      s.visible = false;
      return;
    }

    const newIdx = 1 - this._activeIndex;
    const next = this._sprites[newIdx];
    const old = this._sprites[this._activeIndex];

    old.alpha = 0;
    old.visible = false;

    next.texture = texture;
    next.visible = true;
    next.alpha = 1;
    this._fitSprite(next);

    this._activeIndex = newIdx;
  }

  destroy(): void {
    for (const s of this._sprites) this._driver.killTweensOf(s);
    this.container.destroy({ children: true });
  }

  private _fitSprite(sprite: DomSprite): void {
    const tex = sprite.texture;
    if (!tex || tex === DomTexture.EMPTY || tex.width <= 0 || tex.height <= 0) return;
    sprite.width = tex.width;
    sprite.height = tex.height;
    const sw = this._opts.screenW;
    const sh = this._opts.screenH;
    const scale = Math.min(sw / tex.width, sh / tex.height);
    sprite.scale.x = scale;
    sprite.scale.y = scale;
    sprite.anchor.set(0, 0);
    sprite.x = (sw - tex.width) / 2;
    sprite.y = (sh - tex.height) / 2;
  }
}
