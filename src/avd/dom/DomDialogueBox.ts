import type { AvdState, SpeakerStyle } from '../types';
import { DomContainer, DomGraphics, DomText, measureText } from './DomNode';
import type { DomTextStyle } from './DomNode';

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
  private _nameCap: DomGraphics | null = null;
  private _textContainer: DomContainer;
  private _arrow: DomGraphics;

  constructor(parent: DomContainer, opts: DomDialogueBoxOptions) {
    this._opts = opts;
    this.container = new DomContainer();
    this.container.x = opts.boxX;
    this.container.y = opts.boxY;
    this.container.width = opts.boxWidth;
    this.container.height = opts.boxHeight;
    parent.addChild(this.container);

    this._bg = new DomGraphics();
    this.container.addChild(this._bg);
    this._redrawBg();

    this._textContainer = new DomContainer();
    this._textContainer.x = opts.boxPadding;
    this._textContainer.y = opts.boxPadding + opts.nameSize + 8;
    this._textContainer.width = opts.boxWidth - opts.boxPadding * 2;
    this.container.addChild(this._textContainer);

    this._arrow = new DomGraphics();
    this.container.addChild(this._arrow);
  }

  setSpeaker(name: string | null, style?: SpeakerStyle): void {
    if (this._nameText) {
      this._nameText.destroy();
      this._nameText = null;
    }
    if (this._nameCap) {
      this._nameCap.destroy();
      this._nameCap = null;
    }
    if (name) {
      const nameColor = style?.nameColor ?? this._opts.nameColor;
      const nameSize = style?.nameSize ?? this._opts.nameSize;
      const namePaddingX = 14;
      const padY = 5;

      // 名字背景胶囊
      const nameW = measureText(name, {
        fontFamily: this._opts.fontFamily,
        fontSize: nameSize,
        fontWeight: 'bold',
      }).width;
      const capW = nameW + 28;
      const cap = new DomGraphics();
      cap.roundRect(0, 0, capW, nameSize + padY * 2 + 6, 6)
        .fill({ color: this._opts.boxBg, alpha: 0.9 })
        .stroke({ color: nameColor, width: 1, alpha: 0.4 });
      cap.x = this._opts.boxPadding;
      cap.y = this._opts.boxPadding - padY - 2;
      this._nameCap = cap;
      this.container.addChild(cap);

      this._nameText = new DomText({
        text: name,
        style: {
          fontFamily: this._opts.fontFamily,
          fontSize: nameSize,
          fill: nameColor,
          fontWeight: 'bold',
        },
      });
      this._nameText.x = this._opts.boxPadding + namePaddingX;
      this._nameText.y = this._opts.boxPadding + 2;
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
    // 底部面板：垂直渐变（下深上浅）+ 顶部细高光描边
    this._bg
      .roundRect(0, 0, this._opts.boxWidth, this._opts.boxHeight, this._opts.boxRadius)
      .fillGradient({
        from: 0,
        to: this._opts.boxHeight,
        stops: [
          { offset: 0, color: this._opts.boxBg, alpha: this._opts.boxBgAlpha * 0.6 },
          { offset: 1, color: this._opts.boxBg, alpha: this._opts.boxBgAlpha },
        ],
      });
    // 顶部细高光
    this._bg
      .roundRect(0, 0, this._opts.boxWidth, this._opts.boxHeight, this._opts.boxRadius)
      .stroke({ color: 0xffffff, width: 1, alpha: 0.18 });
  }
}
