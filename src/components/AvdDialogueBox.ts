/** Dialogue box component for the ADV visual-novel engine. */
import * as PIXI from 'pixi.js';
import type { AvdState } from './Avd';

export interface DialogueBoxOptions {
  boxX: number;
  boxY: number;
  boxWidth: number;
  boxHeight: number;
  boxRadius: number;
  boxPadding: number;
  boxBg: number;
  boxBgAlpha: number;
  textColor: number;
  textSize: number;
  fontFamily: string;
  nameColor: number;
  nameSize: number;
  arrowColor: number;
}

export class DialogueBox {
  readonly container: PIXI.Container;
  private opts: DialogueBoxOptions;
  private boxBg: PIXI.Graphics;
  private nameText: PIXI.Text | null = null;
  private dialogueContainer: PIXI.Container;
  private arrow: PIXI.Graphics;

  constructor(parent: PIXI.Container, opts: DialogueBoxOptions) {
    this.opts = opts;
    this.container = new PIXI.Container();
    parent.addChild(this.container);

    this.boxBg = new PIXI.Graphics();
    this.container.addChild(this.boxBg);
    this.redrawBox();

    this.dialogueContainer = new PIXI.Container();
    this.dialogueContainer.x = opts.boxX + opts.boxPadding;
    this.dialogueContainer.y = opts.boxY + opts.boxPadding + opts.nameSize + 8;
    this.container.addChild(this.dialogueContainer);

    this.arrow = new PIXI.Graphics();
    this.container.addChild(this.arrow);
  }

  setSpeaker(name: string | null): void {
    if (this.nameText) {
      this.nameText.destroy();
      this.nameText = null;
    }
    if (name) {
      this.nameText = new PIXI.Text({
        text: name,
        style: new PIXI.TextStyle({
          fontFamily: this.opts.fontFamily,
          fontSize: this.opts.nameSize,
          fill: this.opts.nameColor,
          fontWeight: 'bold',
        }),
      });
      this.nameText.x = this.opts.boxX + this.opts.boxPadding;
      this.nameText.y = this.opts.boxY + this.opts.boxPadding;
      this.container.addChild(this.nameText);
    }
  }

  getDialogueContainer(): PIXI.Container {
    return this.dialogueContainer;
  }

  setAlpha(a: number): void {
    this.container.alpha = a;
  }

  setBoxOffsetY(y: number): void {
    this.container.y = y;
  }

  redrawBox(): void {
    this.boxBg.clear();
    this.boxBg
      .roundRect(this.opts.boxX, this.opts.boxY, this.opts.boxWidth, this.opts.boxHeight, this.opts.boxRadius)
      .fill({ color: this.opts.boxBg, alpha: this.opts.boxBgAlpha });
  }

  redrawArrow(state: AvdState, phase: number): void {
    this.arrow.clear();
    if (state !== 'between') return;
    const cx = this.opts.boxX + this.opts.boxWidth - 24;
    const cy = this.opts.boxY + this.opts.boxHeight - 16;
    const pulse = 0.7 + 0.3 * Math.sin(phase);
    this.arrow
      .moveTo(cx - 8, cy - 4)
      .lineTo(cx, cy)
      .lineTo(cx - 8, cy + 4)
      .stroke({ color: this.opts.arrowColor, width: 2, alpha: pulse });
  }

  applyOptions(partial: Partial<DialogueBoxOptions>): void {
    const oldBg = this.opts.boxBg;
    const oldAlpha = this.opts.boxBgAlpha;
    const oldNameColor = this.opts.nameColor;
    this.opts = { ...this.opts, ...partial };
    if (this.opts.boxBg !== oldBg || this.opts.boxBgAlpha !== oldAlpha) {
      this.redrawBox();
    }
    if (this.opts.nameColor !== oldNameColor && this.nameText) {
      this.nameText.style.fill = this.opts.nameColor;
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
