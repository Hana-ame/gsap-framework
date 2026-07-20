/** PixiJS-based dialogue box with speaker label and text area. */
import * as PIXI from 'pixi.js';
import type { AvdState } from './types';

export interface DialogueBoxOptions {
  boxX: number;
  boxY: number;
  boxWidth: number;
  boxHeight: number;
  boxRadius: number;
  boxPadding: number;
  boxBg: number;
  boxBgAlpha: number;
  nameColor: number;
  nameSize: number;
  fontFamily: string;
  arrowColor: number;
}

export class DialogueBox {
  readonly container: PIXI.Container;
  private _opts: DialogueBoxOptions;
  private _bg: PIXI.Graphics;
  private _nameText: PIXI.Text | null = null;
  private _textContainer: PIXI.Container;
  private _arrow: PIXI.Graphics;

  constructor(parent: PIXI.Container, opts: DialogueBoxOptions) {
    this._opts = opts;

    this.container = new PIXI.Container();
    parent.addChild(this.container);

    this._bg = new PIXI.Graphics();
    this.container.addChild(this._bg);
    this._redrawBg();

    this._textContainer = new PIXI.Container();
    this._textContainer.x = opts.boxPadding;
    this._textContainer.y = opts.boxPadding + opts.nameSize + 8;
    this.container.addChild(this._textContainer);

    this._arrow = new PIXI.Graphics();
    this.container.addChild(this._arrow);
  }

  setSpeaker(name: string | null): void {
    if (this._nameText) {
      this._nameText.destroy();
      this._nameText = null;
    }
    if (name) {
      this._nameText = new PIXI.Text({
        text: name,
        style: new PIXI.TextStyle({
          fontFamily: this._opts.fontFamily,
          fontSize: this._opts.nameSize,
          fill: this._opts.nameColor,
          fontWeight: 'bold',
        }),
      });
      this._nameText.x = this._opts.boxPadding;
      this._nameText.y = this._opts.boxPadding;
      this.container.addChild(this._nameText);
    }
  }

  setTextContainer(container: PIXI.Container): void {
    this._textContainer.removeChildren();
    this._textContainer.addChild(container);
  }

  setAlpha(a: number): void {
    this.container.alpha = a;
  }

  setOffsetY(y: number): void {
    this.container.y = y;
  }

  updateArrow(state: AvdState, phase: number): void {
    this._arrow.clear();
    if (state !== 'between') return;
    const cx = this._opts.boxX + this._opts.boxWidth - 24;
    const cy = this._opts.boxY + this._opts.boxHeight - 16;
    const pulse = 0.7 + 0.3 * Math.sin(phase);
    this._arrow
      .moveTo(cx - 8, cy - 4)
      .lineTo(cx, cy)
      .lineTo(cx - 8, cy + 4)
      .stroke({ color: this._opts.arrowColor, width: 2, alpha: pulse });
  }

  applyOptions(partial: Partial<DialogueBoxOptions>): void {
    const oldBg = this._opts.boxBg;
    const oldAlpha = this._opts.boxBgAlpha;
    const oldNameColor = this._opts.nameColor;
    this._opts = { ...this._opts, ...partial };
    if (this._opts.boxBg !== oldBg || this._opts.boxBgAlpha !== oldAlpha) {
      this._redrawBg();
    }
    if (this._opts.nameColor !== oldNameColor && this._nameText) {
      this._nameText.style.fill = this._opts.nameColor;
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }

  private _redrawBg(): void {
    this._bg.clear();
    this._bg
      .roundRect(
        this._opts.boxX,
        this._opts.boxY,
        this._opts.boxWidth,
        this._opts.boxHeight,
        this._opts.boxRadius,
      )
      .fill({ color: this._opts.boxBg, alpha: this._opts.boxBgAlpha });
  }
}
