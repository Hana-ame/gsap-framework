/**
 * KagLayerManager — Kirikiri2 风格多层管理器
 *
 * Kirikiri 层编号约定：
 *   层 0 — 文字/消息层（最上层）
 *   层 1 — 前景角色/效果
 *   层 2 — 主要角色
 *   层 3 — 次要角色/物品
 *   层 4 — 背景层（最下层）
 *   层 5-9 — 扩展层（粒子、遮罩、UI 等）
 *
 * 每层可独立控制：
 *   - 图片纹理
 *   - 可见性 / 透明度
 *   - 位置（x, y）
 *   - 缩放
 *   - 过渡动画（GSAP）
 */
import { gsap } from 'gsap';
import type { IRenderLayer, IRenderContainer, IRenderSprite } from '../render/types';

export interface KagLayer {
  index: number;
  sprite: IRenderSprite | null;
  container: IRenderContainer;
  texture: any;
  visible: boolean;
  alpha: number;
  x: number;
  y: number;
  scale: number;
}

export class KagLayerManager {
  readonly layers: KagLayer[] = [];
  private _layer: IRenderLayer;
  private _parent: IRenderContainer;

  constructor(parent: IRenderContainer, layer: IRenderLayer, maxLayers: number = 10) {
    this._parent = parent;
    this._layer = layer;

    for (let i = 0; i < maxLayers; i++) {
      const container = layer.createContainer();
      container.eventMode = 'none';
      this._parent.addChild(container);
      this.layers.push({
        index: i,
        sprite: null,
        container,
        texture: layer.emptyTexture,
        visible: true,
        alpha: 1,
        x: 0, y: 0, scale: 1,
      });
    }
  }

  setImage(layerIdx: number, texture: any, opts?: { left?: number; top?: number; opacity?: number; time?: number }): void {
    const L = this._ensure(layerIdx);
    if (!L || !texture) return;

    if (!L.sprite) {
      L.sprite = this._layer.createSprite(texture);
      L.container.addChild(L.sprite);
    }

    gsap.killTweensOf(L.sprite);

    L.texture = texture;
    L.sprite.texture = texture;
    L.visible = true;

    const dur = (opts?.time ?? 0) / 1000;

    if (opts?.left != null) L.x = opts.left;
    if (opts?.top != null) L.y = opts.top;

    L.sprite.anchor.set(0.5, 0.5);
    if (L.sprite.texture.width > 0) {
      L.sprite.x = L.x + (L.sprite.texture.width * L.scale) / 2;
      L.sprite.y = L.y + (L.sprite.texture.height * L.scale) / 2;
    }

    L.sprite.alpha = opts?.opacity ?? 1;
    if (dur > 0) {
      L.sprite.alpha = 0;
      gsap.to(L.sprite, { alpha: opts?.opacity ?? 1, duration: dur, ease: 'power2.out' });
    }
  }

  move(layerIdx: number, opts: { left?: number; top?: number; opacity?: number; scale?: number; time?: number }): void {
    const L = this._ensure(layerIdx);
    if (!L) return;

    const dur = (opts.time ?? 500) / 1000;
    const vars: Record<string, any> = { ease: 'power2.out', duration: dur };

    if (opts.left != null) vars.x = opts.left;
    if (opts.top != null) vars.y = opts.top;
    if (opts.opacity != null && L.sprite) vars['sprite.alpha'] = opts.opacity;
    if (opts.scale != null) vars.scale = opts.scale;

    gsap.killTweensOf(L.container);
    gsap.to(L.container, vars);
  }

  hide(layerIdx: number, time?: number): void {
    const L = this._ensure(layerIdx);
    if (!L) return;

    const dur = (time ?? 300) / 1000;
    if (L.sprite) {
      gsap.killTweensOf(L.sprite);
      if (dur > 0) {
        gsap.to(L.sprite, { alpha: 0, duration: dur, ease: 'power2.in', onComplete: () => { L.visible = false; } });
      } else {
        L.sprite.alpha = 0;
        L.visible = false;
      }
    }
  }

  show(layerIdx: number, time?: number): void {
    const L = this._ensure(layerIdx);
    if (!L) return;
    L.visible = true;
    const dur = (time ?? 300) / 1000;
    if (L.sprite) {
      gsap.killTweensOf(L.sprite);
      gsap.to(L.sprite, { alpha: L.alpha, duration: dur, ease: 'power2.out' });
    }
  }

  clear(layerIdx: number): void {
    const L = this.layers[layerIdx];
    if (!L || !L.sprite) return;
    gsap.killTweensOf(L.sprite);
    L.container.removeChild(L.sprite);
    L.sprite.destroy();
    L.sprite = null;
    L.texture = this._layer.emptyTexture;
    L.visible = true;
  }

  clearAll(): void {
    for (let i = 0; i < this.layers.length; i++) this.clear(i);
  }

  setAlpha(layerIdx: number, alpha: number): void {
    const L = this._ensure(layerIdx);
    if (!L) return;
    L.alpha = alpha;
    L.container.alpha = alpha;
  }

  setVisible(layerIdx: number, visible: boolean): void {
    const L = this._ensure(layerIdx);
    if (!L) return;
    L.visible = visible;
    L.container.visible = visible;
  }

  destroy(): void {
    for (const L of this.layers) {
      gsap.killTweensOf(L.container);
      if (L.sprite) {
        gsap.killTweensOf(L.sprite);
        L.sprite.destroy();
      }
      L.container.destroy({ children: true });
    }
    this.layers.length = 0;
  }

  private _ensure(idx: number): KagLayer | undefined {
    if (idx < 0 || idx >= this.layers.length) return undefined;
    return this.layers[idx];
  }
}
