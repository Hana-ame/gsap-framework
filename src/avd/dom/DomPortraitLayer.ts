import { gsap } from 'gsap';
import type { AvdPortraitPos } from '../types';
import { DomContainer, DomSprite, DomTexture } from './DomNode';

export interface DomPortraitLayerOptions {
  screenW: number;
  portraitY: number;
  portraitMaxH: number;
  portraitFadeMs: number;
}

interface PortraitSlot {
  sprite?: DomSprite;
  current: DomTexture | null;
  container: DomContainer;
}

export class DomPortraitLayer {
  readonly container: DomContainer;
  private _opts: DomPortraitLayerOptions;
  private _slots: Map<AvdPortraitPos, PortraitSlot> = new Map();

  constructor(parent: DomContainer, opts: DomPortraitLayerOptions) {
    this._opts = opts;
    this.container = new DomContainer();
    parent.addChild(this.container);
  }

  applyOptions(partial: Partial<DomPortraitLayerOptions>): void {
    this._opts = { ...this._opts, ...partial };
  }

  setTarget(pos: AvdPortraitPos | null, texture: DomTexture | null): void {
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

  setAll(entries: Array<{ pos: AvdPortraitPos; texture: DomTexture | null; alpha: number }>): void {
    const seen = new Set<AvdPortraitPos>();
    for (const entry of entries) {
      seen.add(entry.pos);
      this._setSlotTarget(entry.pos, entry.texture, entry.alpha);
    }
    for (const [pos, slot] of this._slots) {
      if (!seen.has(pos)) this._fadeOut(slot);
    }
  }

  updateL2D(_deltaMS: number): void {
    // DOM 模式不支持 Live2D
  }

  destroy(): void {
    for (const slot of this._slots.values()) {
      if (slot.sprite) gsap.killTweensOf(slot.sprite);
    }
    this.container.destroy({ children: true });
  }

  private _setSlotTarget(pos: AvdPortraitPos, texture: DomTexture | null, alpha: number): void {
    if (texture === null) {
      this._fadeOut(this._slots.get(pos));
      return;
    }

    let slot = this._slots.get(pos);
    if (!slot) {
      const sprite = new DomSprite(texture);
      sprite.anchor.set(0.5, 1);
      sprite.x = this._slotX(pos);
      sprite.y = this._opts.portraitY + this._opts.portraitMaxH;
      sprite.alpha = 0;
      this._fitSprite(sprite);
      this.container.addChild(sprite);
      slot = { sprite, current: null, container: new DomContainer() };
      this._slots.set(pos, slot);
    }

    if (slot.current !== texture) {
      slot.sprite!.texture = texture;
      slot.current = texture;
      this._fitSprite(slot.sprite!);
    }

    gsap.killTweensOf(slot.sprite!);
    gsap.to(slot.sprite!, {
      alpha,
      duration: this._opts.portraitFadeMs / 1000,
      ease: 'power2.out',
      overwrite: 'auto',
    });
    slot.sprite!.visible = true;
  }

  private _showSlot(pos: AvdPortraitPos, slot: PortraitSlot | undefined, texture: DomTexture | null): void {
    if (!slot) {
      if (!texture) return;
      const sprite = new DomSprite(texture);
      sprite.anchor.set(0.5, 1);
      sprite.x = this._slotX(pos);
      sprite.y = this._opts.portraitY + this._opts.portraitMaxH;
      sprite.alpha = 0;
      this._fitSprite(sprite);
      this.container.addChild(sprite);
      this._slots.set(pos, { sprite, current: texture, container: new DomContainer() });
      gsap.to(sprite, { alpha: 1, duration: this._opts.portraitFadeMs / 1000, ease: 'power2.out' });
      return;
    }

    if (slot.current === texture) return;

    if (texture) {
      slot.sprite!.texture = texture;
      slot.current = texture;
      this._fitSprite(slot.sprite!);
      slot.sprite!.alpha = 0;
      slot.sprite!.visible = true;
      gsap.killTweensOf(slot.sprite!);
      gsap.to(slot.sprite!, { alpha: 1, duration: this._opts.portraitFadeMs / 1000, ease: 'power2.out' });
    } else {
      this._fadeOut(slot);
    }
  }

  private _fadeOut(slot: PortraitSlot | undefined): void {
    if (!slot || !slot.sprite || !slot.current) return;
    gsap.killTweensOf(slot.sprite);
    gsap.to(slot.sprite, {
      alpha: 0,
      duration: this._opts.portraitFadeMs / 1000,
      ease: 'power2.out',
      onComplete: () => { slot.sprite!.visible = false; },
    });
    slot.current = null;
  }

  private _fitSprite(sprite: DomSprite): void {
    const img = sprite['_img'] as HTMLImageElement | undefined;
    const nw = img?.naturalWidth ?? 0;
    const nh = img?.naturalHeight ?? 0;
    if (nw <= 0 || nh <= 0) return;
    const maxH = this._opts.portraitMaxH;
    const scale = Math.min(1, maxH / nh);
    sprite.scale.x = scale;
    sprite.scale.y = scale;
  }

  private _slotX(pos: AvdPortraitPos): number {
    const slotW = this._opts.screenW / 3;
    if (pos === 'left') return slotW * 0.5;
    if (pos === 'center') return slotW * 1.5;
    return slotW * 2.5;
  }
}
