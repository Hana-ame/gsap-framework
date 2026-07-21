/** Window background + border outline — redraws on resize (gown.js invalidation pattern). */
import * as PIXI from 'pixi.js';

export interface WindowBorderOptions {
  width: number;
  height: number;
  borderWidth?: number;
  borderColor?: number;
  borderAlpha?: number;
  fillColor?: number;
  fillAlpha?: number;
  cornerRadius?: number;
}

export class WindowBorder {
  readonly bg: PIXI.Graphics;

  private _opts: Required<WindowBorderOptions>;
  private _dirty = true;

  constructor(opts: WindowBorderOptions) {
    this._opts = {
      width: opts.width,
      height: opts.height,
      borderWidth: opts.borderWidth ?? 1,
      borderColor: opts.borderColor ?? 0x3a4a6a,
      borderAlpha: opts.borderAlpha ?? 0.6,
      fillColor: opts.fillColor ?? 0x101018,
      fillAlpha: opts.fillAlpha ?? 0.95,
      cornerRadius: opts.cornerRadius ?? 0,
    };

    this.bg = new PIXI.Graphics();
    this.bg.eventMode = 'none';
    this._redraw();
  }

  resize(w: number, h: number): void {
    if (this._opts.width === w && this._opts.height === h) return;
    this._opts.width = w;
    this._opts.height = h;
    this._dirty = true;
    this._redraw();
  }

  private _redraw(): void {
    if (!this._dirty) return;
    this._dirty = false;

    const { width: w, height: h, borderWidth: bw, borderColor, borderAlpha, fillColor, fillAlpha, cornerRadius: r } = this._opts;

    this.bg.clear();

    if (r > 0) {
      const inset = bw / 2;
      if (bw > 0) {
        this.bg.roundRect(inset, inset, w - bw, h - bw, r).stroke({ width: bw, color: borderColor, alpha: borderAlpha });
      }
      this.bg.roundRect(bw, bw, w - bw * 2, h - bw * 2, Math.max(0, r - bw)).fill({ color: fillColor, alpha: fillAlpha });
    } else {
      if (bw > 0) {
        this.bg.rect(0, 0, w, h).stroke({ width: bw, color: borderColor, alpha: borderAlpha });
      }
      this.bg.rect(0, 0, w, h).fill({ color: fillColor, alpha: fillAlpha });
    }
  }

  destroy(): void {
    this.bg.destroy();
  }
}
