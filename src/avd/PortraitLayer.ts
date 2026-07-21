/** Manages portrait sprite display and transitions at three positions. */
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import type { AvdPortraitPos } from './types';
import type { Live2DModelView } from './Live2DManager';

export interface PortraitLayerOptions {
  screenW: number;
  portraitY: number;
  portraitMaxH: number;
  portraitFadeMs: number;
}

interface PortraitSlot {
  sprite?: PIXI.Sprite;
  current: PIXI.Texture | null;
  l2dView?: Live2DModelView;
  container: PIXI.Container;
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

  setTarget(pos: AvdPortraitPos | null, texture: PIXI.Texture | null, l2dView?: Live2DModelView | null): void {
    const positions: AvdPortraitPos[] = ['left', 'center', 'right'];
    for (const p of positions) {
      const slot = this._slots.get(p);
      if (p === pos) {
        this._showSlot(p, slot, texture, l2dView);
      } else {
        this._fadeOut(slot);
      }
    }
  }

  setAll(entries: Array<{ pos: AvdPortraitPos; texture: PIXI.Texture | null; alpha: number; l2dView?: Live2DModelView | null }>): void {
    const seen = new Set<AvdPortraitPos>();
    for (const entry of entries) {
      seen.add(entry.pos);
      this._setSlotTarget(entry.pos, entry.texture, entry.alpha, entry.l2dView);
    }
    for (const [pos, slot] of this._slots) {
      if (!seen.has(pos)) this._fadeOut(slot);
    }
  }

  /** 每帧调用，更新 Live2D 模型渲染 */
  updateL2D(deltaMS: number): void {
    for (const slot of this._slots.values()) {
      slot.l2dView?.update(deltaMS);
    }
  }

  destroy(): void {
    for (const slot of this._slots.values()) {
      if (slot.sprite) gsap.killTweensOf(slot.sprite);
    }
    this.container.destroy({ children: true });
  }

  private _setSlotTarget(pos: AvdPortraitPos, texture: PIXI.Texture | null, alpha: number, l2dView?: Live2DModelView | null): void {
    if (l2dView) {
      this._showL2D(pos, l2dView, alpha);
      return;
    }
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
      slot = { sprite, current: null, container: new PIXI.Container() };
      this._slots.set(pos, slot);
    }

    if (slot.current !== texture) {
      slot.sprite!.texture = texture;
      slot.current = texture;
      this._fitSprite(slot.sprite!);
    }

    gsap.killTweensOf(slot.sprite!);
    gsap.to(slot.sprite!, { alpha, duration: this._opts.portraitFadeMs / 1000, ease: 'power2.out', overwrite: 'auto' });
    slot.sprite!.visible = true;
  }

  private _showSlot(pos: AvdPortraitPos, slot: PortraitSlot | undefined, texture: PIXI.Texture | null, l2dView?: Live2DModelView | null): void {
    if (l2dView) {
      this._showL2D(pos, l2dView, 1);
      // 清理旧 sprite
      if (slot?.sprite) { gsap.killTweensOf(slot.sprite); slot.sprite.visible = false; }
      return;
    }
    if (slot?.l2dView) {
      // 从 L2D 切回静态纹理
      this._removeL2D(this._slots.get(pos));
    }

    if (!slot) {
      if (!texture) return;
      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5, 1);
      sprite.x = this._slotX(pos);
      sprite.y = this._opts.portraitY + this._opts.portraitMaxH;
      sprite.alpha = 0;
      this._fitSprite(sprite);
      this.container.addChild(sprite);
      this._slots.set(pos, { sprite, current: texture, container: new PIXI.Container() });
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

  private _showL2D(pos: AvdPortraitPos, view: Live2DModelView, alpha: number): void {
    let slot = this._slots.get(pos);
    if (!slot) {
      slot = { current: null, container: new PIXI.Container() };
      this._slots.set(pos, slot);
    }

    if (slot.l2dView === view) return;

    // 隐藏旧 sprite
    if (slot.sprite) { slot.sprite.visible = false; gsap.killTweensOf(slot.sprite); }

    slot.l2dView = view;
    view.container.alpha = 0;
    view.container.x = this._slotX(pos);
    view.container.y = this._opts.portraitY + this._opts.portraitMaxH;
    const h = this._opts.portraitMaxH;
    const scale = h / view.displayHeight;
    view.container.scale.set(Math.min(1, scale));
    this.container.addChild(view.container);
    gsap.killTweensOf(view.container);
    gsap.to(view.container, { alpha, duration: this._opts.portraitFadeMs / 1000, ease: 'power2.out', overwrite: 'auto' });
    view.container.visible = true;
  }

  private _removeL2D(slot: PortraitSlot | undefined): void {
    if (!slot?.l2dView) return;
    gsap.killTweensOf(slot.l2dView.container);
    slot.l2dView.container.visible = false;
    slot.l2dView = undefined;
  }

  private _fadeOut(slot: PortraitSlot | undefined): void {
    if (!slot) return;
    if (slot.l2dView) {
      this._removeL2D(slot);
    }
    if (!slot.sprite || !slot.current) return;
    gsap.killTweensOf(slot.sprite);
    gsap.to(slot.sprite, { alpha: 0, duration: this._opts.portraitFadeMs / 1000, ease: 'power2.out', onComplete: () => { slot.sprite!.visible = false; } });
    slot.current = null;
  }

  private _fitSprite(sprite: PIXI.Sprite): void {
    if (sprite.texture.width <= 0 || sprite.texture.height <= 0) return;
    const maxH = this._opts.portraitMaxH;
    const scale = Math.min(1, maxH / sprite.texture.height);
    sprite.scale.set(scale);
    sprite.x = this._slotX(
      (['left', 'center', 'right'] as const).find((p) => this._slots.get(p)?.sprite === sprite) ?? 'center',
    );
  }

  private _slotX(pos: AvdPortraitPos): number {
    const slotW = this._opts.screenW / 3;
    if (pos === 'left') return slotW * 0.5;
    if (pos === 'center') return slotW * 1.5;
    return slotW * 2.5;
  }
}
