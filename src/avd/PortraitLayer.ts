/** Manages portrait sprite display and transitions at three positions. */
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import type { AvdPortraitPos } from './types';

export interface PortraitLayerOptions {
  screenW: number;
  portraitY: number;
  portraitMaxH: number;
  portraitFadeMs: number;
}

interface PortraitSlot {
  sprite: PIXI.Sprite;
  current: PIXI.Texture | null;
}

export class PortraitLayer {
  readonly container: PIXI.Container;
  private _opts: PortraitLayerOptions;
  private _slots: Map<AvdPortraitPos, PortraitSlot> = new Map();

  constructor(parent: PIXI.Container, opts: PortraitLayerOptions) {
    this._opts = opts;
    this.container = new PIXI.Container();
    parent.addChild(this.container);
  }

  applyOptions(partial: Partial<PortraitLayerOptions>): void {
    this._opts = { ...this._opts, ...partial };
  }

  setTarget(pos: AvdPortraitPos | null, texture: PIXI.Texture | null): void {
    const positions: AvdPortraitPos[] = ['left', 'center', 'right'];
    for (const p of positions) {
      const slot = this._slots.get(p);
      if (p === pos) {
        this._showSlot(p, slot, texture);
      } else {
        this._fadeOut(slot);
      }
    }
  }

  setAll(entries: Array<{ pos: AvdPortraitPos; texture: PIXI.Texture | null; alpha: number }>): void {
    const seen = new Set<AvdPortraitPos>();
    for (const entry of entries) {
      seen.add(entry.pos);
      this._setSlotTarget(entry.pos, entry.texture, entry.alpha);
    }
    for (const [pos, slot] of this._slots) {
      if (!seen.has(pos)) {
        this._fadeOut(slot);
      }
    }
  }

  destroy(): void {
    for (const slot of this._slots.values()) gsap.killTweensOf(slot.sprite);
    this.container.destroy({ children: true });
  }

  private _setSlotTarget(pos: AvdPortraitPos, texture: PIXI.Texture | null, alpha: number): void {
    if (texture === null) {
      this._fadeOut(this._slots.get(pos));
      return;
    }

    let slot = this._slots.get(pos);
    if (!slot) {
      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5, 1);
      sprite.x = this._slotX(pos);
      sprite.y = this._opts.portraitY + this._opts.portraitMaxH;
      sprite.alpha = 0;
      this._fitSprite(sprite);
      this.container.addChild(sprite);
      slot = { sprite, current: null };
      this._slots.set(pos, slot);
    }

    if (slot.current !== texture) {
      slot.sprite.texture = texture;
      slot.current = texture;
      this._fitSprite(slot.sprite);
    }

    gsap.killTweensOf(slot.sprite);
    gsap.to(slot.sprite, {
      alpha,
      duration: this._opts.portraitFadeMs / 1000,
      ease: 'power2.out',
      overwrite: 'auto',
    });
    slot.sprite.visible = true;
  }

  private _showSlot(pos: AvdPortraitPos, slot: PortraitSlot | undefined, texture: PIXI.Texture | null): void {
    if (!slot) {
      if (!texture) return;
      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5, 1);
      sprite.x = this._slotX(pos);
      sprite.y = this._opts.portraitY + this._opts.portraitMaxH;
      sprite.alpha = 0;
      this._fitSprite(sprite);
      this.container.addChild(sprite);
      this._slots.set(pos, { sprite, current: texture });
      gsap.to(sprite, {
        alpha: 1,
        duration: this._opts.portraitFadeMs / 1000,
        ease: 'power2.out',
      });
      return;
    }

    if (slot.current === texture) return;

    if (texture) {
      slot.sprite.texture = texture;
      slot.current = texture;
      this._fitSprite(slot.sprite);
      slot.sprite.alpha = 0;
      slot.sprite.visible = true;
      gsap.killTweensOf(slot.sprite);
      gsap.to(slot.sprite, {
        alpha: 1,
        duration: this._opts.portraitFadeMs / 1000,
        ease: 'power2.out',
      });
    } else {
      this._fadeOut(slot);
    }
  }

  private _fadeOut(slot: PortraitSlot | undefined): void {
    if (!slot || !slot.current) return;
    gsap.killTweensOf(slot.sprite);
    gsap.to(slot.sprite, {
      alpha: 0,
      duration: this._opts.portraitFadeMs / 1000,
      ease: 'power2.out',
      onComplete: () => { slot.sprite.visible = false; },
    });
    slot.current = null;
  }

  private _fitSprite(sprite: PIXI.Sprite): void {
    if (sprite.texture.width <= 0 || sprite.texture.height <= 0) return;
    const maxH = this._opts.portraitMaxH;
    const scale = Math.min(1, maxH / sprite.texture.height);
    sprite.scale.set(scale);
    sprite.x = this._slotX(
      (['left', 'center', 'right'] as const).find(
        (p) => this._slots.get(p)?.sprite === sprite,
      ) ?? 'center',
    );
  }

  private _slotX(pos: AvdPortraitPos): number {
    const slotW = this._opts.screenW / 3;
    if (pos === 'left') return slotW * 0.5;
    if (pos === 'center') return slotW * 1.5;
    return slotW * 2.5;
  }
}
