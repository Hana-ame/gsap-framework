import * as PIXI from 'pixi.js';

export type AvdPortraitPos = 'left' | 'center' | 'right';

interface PortraitSlot {
  sprite: PIXI.Sprite;
  current: PIXI.Texture | null;
  alpha: number;
  fading: boolean;
  fadeStart: number;
  fadeFrom: number;
  fadeTo: number;
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

  private _showSlot(pos: AvdPortraitPos, slot: PortraitSlot | undefined, texture: PIXI.Texture | null): void {
    if (!slot) {
      const sprite = new PIXI.Sprite(texture ?? PIXI.Texture.EMPTY);
      sprite.anchor.set(0.5, 1);
      sprite.x = this._x(pos);
      sprite.y = this.opts.portraitY + this.opts.portraitMaxH;
      sprite.alpha = texture ? 0 : 1;
      this.container.addChild(sprite);
      this.slots.set(pos, {
        sprite,
        current: texture,
        alpha: texture ? 0 : 1,
        fading: texture ? true : false,
        fadeStart: performance.now(),
        fadeFrom: 0,
        fadeTo: 1,
      });
      return;
    }
    if (slot.current === texture) return;
    if (texture) {
      slot.sprite.texture = texture;
      slot.current = texture;
      slot.alpha = 0;
      slot.fading = true;
      slot.fadeStart = performance.now();
      slot.fadeFrom = 0;
      slot.fadeTo = 1;
      slot.sprite.visible = true;
    } else {
      slot.fading = true;
      slot.fadeStart = performance.now();
      slot.fadeFrom = slot.alpha;
      slot.fadeTo = 0;
      slot.current = null;
    }
  }

  private _fadeOutSlot(slot: PortraitSlot | undefined): void {
    if (!slot) return;
    if (!slot.current || slot.alpha <= 0) return;
    slot.fading = true;
    slot.fadeStart = performance.now();
    slot.fadeFrom = slot.alpha;
    slot.fadeTo = 0;
    slot.current = null;
  }

  update(now: number): void {
    for (const slot of this.slots.values()) {
      if (!slot.fading) continue;
      const t = Math.min(1, (now - slot.fadeStart) / this.opts.portraitFadeMs);
      slot.alpha = slot.fadeFrom + (slot.fadeTo - slot.fadeFrom) * t;
      slot.sprite.alpha = slot.alpha;
      if (t >= 1) {
        slot.fading = false;
        if (slot.fadeTo === 0 && slot.current === null) {
          slot.sprite.visible = false;
        }
      }
    }
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
    this.container.destroy({ children: true });
  }
}
