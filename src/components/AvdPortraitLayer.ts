import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

export type AvdPortraitPos = 'left' | 'center' | 'right';

interface PortraitSlot {
  sprite: PIXI.Sprite;
  current: PIXI.Texture | null;
}

export interface PortraitLayerOptions {
  W: number;
  portraitY: number;
  portraitMaxH: number;
  portraitFadeMs: number;
}

export class PortraitLayer {
  readonly container: PIXI.Container;
  private opts: PortraitLayerOptions;
  private slots: Map<AvdPortraitPos, PortraitSlot> = new Map();

  constructor(parent: PIXI.Container, opts: PortraitLayerOptions) {
    this.opts = opts;
    this.container = new PIXI.Container();
    parent.addChild(this.container);
  }

  setPortrait(targetPos: AvdPortraitPos | null, texture: PIXI.Texture | null): void {
    const positions: AvdPortraitPos[] = ['left', 'center', 'right'];
    for (const pos of positions) {
      const slot = this.slots.get(pos);
      if (pos === targetPos) {
        this._showSlot(pos, slot, texture);
      } else {
        this._fadeOutSlot(slot);
      }
    }
  }

  setSlotAlpha(pos: AvdPortraitPos, alpha: number, animate: boolean = true): void {
    const slot = this.slots.get(pos);
    if (!slot) return;
    if (alpha >= 0.999) slot.sprite.visible = true;
    if (animate) {
      gsap.killTweensOf(slot.sprite);
      gsap.to(slot.sprite, {
        alpha,
        duration: this.opts.portraitFadeMs / 1000,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    } else {
      gsap.killTweensOf(slot.sprite);
      slot.sprite.alpha = alpha;
    }
  }

  getSlotTexture(pos: AvdPortraitPos): PIXI.Texture | null {
    return this.slots.get(pos)?.current ?? null;
  }

  private _showSlot(pos: AvdPortraitPos, slot: PortraitSlot | undefined, texture: PIXI.Texture | null): void {
    if (!slot) {
      const sprite = new PIXI.Sprite(texture ?? PIXI.Texture.EMPTY);
      sprite.anchor.set(0.5, 1);
      sprite.x = this._x(pos);
      sprite.y = this.opts.portraitY + this.opts.portraitMaxH;
      sprite.alpha = texture ? 0 : 1;
      this.container.addChild(sprite);
      this.slots.set(pos, { sprite, current: texture });
      if (texture) {
        gsap.to(sprite, {
          alpha: 1,
          duration: this.opts.portraitFadeMs / 1000,
          ease: 'power2.out',
        });
      }
      return;
    }
    if (slot.current === texture) return;
    if (texture) {
      slot.sprite.texture = texture;
      slot.current = texture;
      slot.sprite.alpha = 0;
      slot.sprite.visible = true;
      gsap.killTweensOf(slot.sprite);
      gsap.to(slot.sprite, {
        alpha: 1,
        duration: this.opts.portraitFadeMs / 1000,
        ease: 'power2.out',
      });
    } else {
      this._fadeOutSlot(slot);
    }
  }

  private _fadeOutSlot(slot: PortraitSlot | undefined): void {
    if (!slot) return;
    if (!slot.current) return;
    gsap.killTweensOf(slot.sprite);
    gsap.to(slot.sprite, {
      alpha: 0,
      duration: this.opts.portraitFadeMs / 1000,
      ease: 'power2.out',
      onComplete: () => { slot.sprite.visible = false; },
    });
    slot.current = null;
  }

  applyOptions(partial: Partial<PortraitLayerOptions>): void {
    this.opts = { ...this.opts, ...partial };
  }

  private _x(pos: AvdPortraitPos): number {
    const slotW = this.opts.W / 3;
    if (pos === 'left') return slotW * 0.5;
    if (pos === 'center') return slotW * 1.5;
    return slotW * 2.5;
  }

  destroy(): void {
    for (const slot of this.slots.values()) gsap.killTweensOf(slot.sprite);
    this.container.destroy({ children: true });
  }
}
