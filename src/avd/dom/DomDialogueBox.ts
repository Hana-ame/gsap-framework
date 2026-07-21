import type { AvdState, SpeakerStyle } from '../types';
import { gsap } from 'gsap';
import { DomContainer, DomGraphics, DomText, DomTextStyle } from './DomNode';

export interface DomDialogueBoxOptions {
  boxX: number; boxY: number; boxWidth: number; boxHeight: number;
  boxRadius: number; boxPadding: number;
  boxBg: number; boxBgAlpha: number;
  nameColor: number; nameSize: number;
  fontFamily: string; arrowColor: number;
}

export class DomDialogueBox {
  readonly container: DomContainer;
  private _opts: DomDialogueBoxOptions;
  private _bg: DomGraphics;
  private _nameText: DomText | null = null;
  private _textContainer: DomContainer;
  private _arrow: DomGraphics;

  constructor(parent: DomContainer, opts: DomDialogueBoxOptions) {
    this._opts = opts;
    this.container = new DomContainer();
    this.container.x = opts.boxX;
    this.container.y = opts.boxY;
    parent.addChild(this.container);

    this._bg = new DomGraphics();
    this.container.addChild(this._bg);
    this._redrawBg();

    this._textContainer = new DomContainer();
    this._textContainer.x = opts.boxPadding;
    this._textContainer.y = opts.boxPadding + opts.nameSize + 8;
    this.container.addChild(this._textContainer);

    this._arrow = new DomGraphics();
    this.container.addChild(this._arrow);
  }

  setSpeaker(name: string | null, style?: SpeakerStyle): void {
    if (this._nameText) {
      this._nameText.destroy();
      this._nameText = null;
    }
    if (name) {
      const nameColor = style?.nameColor ?? this._opts.nameColor;
      const nameSize = style?.nameSize ?? this._opts.nameSize;
      this._nameText = new DomText({
        text: name,
        style: {
          fontFamily: this._opts.fontFamily,
          fontSize: nameSize,
          fill: nameColor,
          fontWeight: 'bold',
        },
      });
      this._nameText.x = this._opts.boxPadding;
      this._nameText.y = this._opts.boxPadding;
      this.container.addChild(this._nameText);
    }
  }

  setTextContainer(container: DomContainer): void {
    this._textContainer.removeChildren();
    this._textContainer.addChild(container);
  }

  setAlpha(a: number): void { this.container.alpha = a; }
  setOffsetY(y: number): void { this.container.y = this._opts.boxY + y; }

  updateArrow(state: AvdState, phase: number): void {
    this._arrow.clear();
    if (state !== 'between') return;
    const cx = this._opts.boxWidth - 24;
    const cy = this._opts.boxHeight - 16;
    const pulse = 0.7 + 0.3 * Math.sin(phase);
    this._arrow
      .moveTo(cx - 8, cy - 4)
      .lineTo(cx, cy)
      .lineTo(cx - 8, cy + 4)
      .stroke({ color: this._opts.arrowColor, width: 2, alpha: pulse });
  }

  applyOptions(partial: Partial<DomDialogueBoxOptions>): void {
    const oldBg = this._opts.boxBg;
    const oldAlpha = this._opts.boxBgAlpha;
    this._opts = { ...this._opts, ...partial };
    if (this._opts.boxBg !== oldBg || this._opts.boxBgAlpha !== oldAlpha) {
      this._redrawBg();
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }

  private _redrawBg(): void {
    this._bg.clear();
    this._bg
      .roundRect(0, 0, this._opts.boxWidth, this._opts.boxHeight, this._opts.boxRadius)
      .fill({ color: this._opts.boxBg, alpha: this._opts.boxBgAlpha });
  }
}
