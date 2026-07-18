import * as PIXI from 'pixi.js';
import { gsap } from '../framework/gsap-pixi';
import { DialogueBox, type DialogueBoxOptions } from './AvdDialogueBox';
import { PortraitLayer, type AvdPortraitPos } from './AvdPortraitLayer';
import {
  buildInlineLayout,
  destroyInlineLayout,
  updateInlineLayout,
  type AvdTextSegment,
  type InlineLayout,
} from './AvdInlineLayout';

export { type AvdPortraitPos, type AvdTextSegment };
export type AvdText = string | AvdTextSegment[];

export interface AvdLine {
  speaker?: string;
  text: AvdText;
  portrait?: PIXI.Texture | null;
  portraitPos?: AvdPortraitPos;
}

export type AvdState = 'typing' | 'between' | 'done';

export interface AvdRosterEntry {
  pos: AvdPortraitPos;
  texture: PIXI.Texture | null;
}

export type AvdRoster = Record<string, AvdRosterEntry>;

export type AvdRosterMode = 'speaker-only' | 'persistent';

export interface AvdOptions {
  boxWidth?: number;
  boxHeight?: number;
  boxX?: number;
  boxY?: number;
  boxBg?: number;
  boxBgAlpha?: number;
  boxRadius?: number;
  boxPadding?: number;
  textColor?: number;
  textSize?: number;
  fontFamily?: string;
  typewriterSpeed?: number;
  textFadeMs?: number;
  nameColor?: number;
  nameSize?: number;
  portraitMaxH?: number;
  portraitY?: number;
  portraitFadeMs?: number;
  arrowColor?: number;
  boxEnterMs?: number;
  boxEnterOffsetY?: number;
  onLineEnter?: (line: AvdLine, index: number) => void;
  onLineExit?: (line: AvdLine, index: number) => void;
  onComplete?: () => void;
  onStateChange?: (state: AvdState) => void;
}

interface Resolved {
  boxWidth: number;
  boxHeight: number;
  boxX: number;
  boxY: number;
  boxBg: number;
  boxBgAlpha: number;
  boxRadius: number;
  boxPadding: number;
  textColor: number;
  textSize: number;
  fontFamily: string;
  typewriterSpeed: number;
  textFadeMs: number;
  nameColor: number;
  nameSize: number;
  portraitMaxH: number;
  portraitY: number;
  portraitFadeMs: number;
  arrowColor: number;
  boxEnterMs: number;
  boxEnterOffsetY: number;
  onLineEnter?: (line: AvdLine, index: number) => void;
  onLineExit?: (line: AvdLine, index: number) => void;
  onComplete?: () => void;
  onStateChange?: (state: AvdState) => void;
}

export class Avd {
  readonly container: PIXI.Container;
  private W: number;
  private H: number;
  private ticker: PIXI.Ticker;
  private opts: Resolved;

  private dialogueBox: DialogueBox;
  private portraitLayer: PortraitLayer;
  private clickOverlay: PIXI.Graphics;

  private dialogueText: PIXI.Text;
  private inlineLayout: InlineLayout | null = null;
  private inlineMode: boolean = false;

  private lines: AvdLine[] = [];
  private lineIndex: number = 0;
  private state: AvdState = 'typing';

  private roster: AvdRoster = {};
  private rosterMode: AvdRosterMode = 'speaker-only';
  private currentSpeaker: string | null = null;

  private fullText: string = '';
  private totalUnits: number = 0;
  private revealedChars: number = 0;
  private typewriterSpeed: number;

  private arrowPhase: number = 0;

  constructor(parent: PIXI.Container, screenW: number, screenH: number, ticker: PIXI.Ticker, options: AvdOptions = {}) {
    this.W = screenW;
    this.H = screenH;
    this.ticker = ticker;
    const narrow = screenW < 720;
    const dBoxW = narrow ? screenW - 24 : 920;
    const dBoxH = narrow ? Math.min(180, Math.floor(screenH * 0.26)) : 200;
    const dBoxX = narrow ? 12 : Math.floor((screenW - 920) / 2);
    const dBoxY = narrow ? screenH - dBoxH - 16 : screenH - 200 - 40;
    const dPortMaxH = narrow
      ? Math.min(380, Math.floor(screenH * 0.5))
      : Math.min(560, Math.floor(screenH * 0.7));
    const dPortY = narrow ? screenH - dPortMaxH - 8 : screenH - dPortMaxH - 20;
    this.opts = {
      boxWidth: dBoxW,
      boxHeight: dBoxH,
      boxX: dBoxX,
      boxY: dBoxY,
      boxBg: 0x0a0a1e,
      boxBgAlpha: 0.92,
      boxRadius: narrow ? 10 : 12,
      boxPadding: narrow ? 14 : 24,
      textColor: 0xffffff,
      textSize: narrow ? Math.max(15, Math.min(20, Math.floor((screenW - 48) / 26))) : 24,
      fontFamily: 'sans-serif',
      typewriterSpeed: 30,
      textFadeMs: 200,
      nameColor: 0x88ccff,
      nameSize: narrow ? Math.max(14, Math.min(18, Math.floor((screenW - 48) / 30))) : 22,
      portraitMaxH: dPortMaxH,
      portraitY: dPortY,
      portraitFadeMs: 300,
      arrowColor: 0x88ccff,
      boxEnterMs: 400,
      boxEnterOffsetY: 80,
      ...options,
    };
    if (options.boxX !== undefined) this.opts.boxX = options.boxX;
    if (options.boxY !== undefined) this.opts.boxY = options.boxY;
    if (options.portraitY !== undefined) this.opts.portraitY = options.portraitY;
    this.typewriterSpeed = Math.max(1, this.opts.typewriterSpeed);

    this.container = new PIXI.Container();
    parent.addChild(this.container);

    this.portraitLayer = new PortraitLayer(this.container, {
      W: this.W,
      portraitY: this.opts.portraitY,
      portraitMaxH: this.opts.portraitMaxH,
      portraitFadeMs: this.opts.portraitFadeMs,
    });

    this.dialogueBox = new DialogueBox(this.container, {
      boxX: this.opts.boxX,
      boxY: this.opts.boxY,
      boxWidth: this.opts.boxWidth,
      boxHeight: this.opts.boxHeight,
      boxRadius: this.opts.boxRadius,
      boxPadding: this.opts.boxPadding,
      boxBg: this.opts.boxBg,
      boxBgAlpha: this.opts.boxBgAlpha,
      textColor: this.opts.textColor,
      textSize: this.opts.textSize,
      fontFamily: this.opts.fontFamily,
      nameColor: this.opts.nameColor,
      nameSize: this.opts.nameSize,
      arrowColor: this.opts.arrowColor,
    });

    this.dialogueText = new PIXI.Text({
      text: '',
      style: new PIXI.TextStyle({
        fontFamily: this.opts.fontFamily,
        fontSize: this.opts.textSize,
        fill: this.opts.textColor,
        wordWrap: true,
        wordWrapWidth: this.opts.boxWidth - this.opts.boxPadding * 2,
        lineHeight: Math.round(this.opts.textSize * 1.4),
      }),
    });
    this.dialogueBox.getDialogueContainer().addChild(this.dialogueText);

    this.clickOverlay = new PIXI.Graphics();
    this.container.addChild(this.clickOverlay);
    this.clickOverlay.eventMode = 'static';
    this.clickOverlay.cursor = 'pointer';
    this.clickOverlay.on('pointerdown', () => this._onAdvanceClick());

    this.ticker.add(this._tick, this);
  }

  destroy(): void {
    this.ticker.remove(this._tick, this);
    gsap.killTweensOf(this.dialogueBox.container);
    this.container.destroy({ children: true });
  }

  applyOptions(partial: Partial<AvdOptions>): void {
    const oldBoxBg = this.opts.boxBg;
    const oldBoxBgAlpha = this.opts.boxBgAlpha;
    const oldTextColor = this.opts.textColor;
    const oldNameColor = this.opts.nameColor;
    const oldPortraitY = this.opts.portraitY;
    this.opts = { ...this.opts, ...partial };
    this.dialogueBox.applyOptions({
      boxBg: this.opts.boxBg,
      boxBgAlpha: this.opts.boxBgAlpha,
      textColor: this.opts.textColor,
      nameColor: this.opts.nameColor,
      arrowColor: this.opts.arrowColor,
    });
    if (this.opts.textColor !== oldTextColor) {
      this.dialogueText.style.fill = this.opts.textColor;
    }
    if (this.opts.portraitY !== oldPortraitY) {
      this.portraitLayer.applyOptions({ portraitY: this.opts.portraitY });
    }
    if (this.opts.boxBg !== oldBoxBg || this.opts.boxBgAlpha !== oldBoxBgAlpha) {
      this.dialogueBox.redrawBox();
    }
    if (this.opts.nameColor !== oldNameColor) {
      this.dialogueBox.applyOptions({ nameColor: this.opts.nameColor });
    }
  }

  setScript(lines: AvdLine[]): void {
    this.lines = lines;
    this.lineIndex = 0;
    this.currentSpeaker = null;
    this.portraitLayer.setPortrait(null, null);
    this._enterLine(0);
  }

  next(): void {
    this._onAdvanceClick();
  }

  setTypewriterSpeed(charsPerSec: number): void {
    this.typewriterSpeed = Math.max(1, charsPerSec);
  }

  goTo(index: number): void {
    if (index < 0 || index >= this.lines.length) return;
    this.lineIndex = index;
    this._enterLine(index);
  }

  setRoster(roster: AvdRoster): void {
    this.roster = { ...roster };
    this._applyRosterHighlight(this.currentSpeaker);
  }

  setRosterMode(mode: AvdRosterMode): void {
    this.rosterMode = mode;
    this._applyRosterHighlight(this.currentSpeaker);
  }

  getRoster(): AvdRoster {
    return { ...this.roster };
  }

  getRosterMode(): AvdRosterMode {
    return this.rosterMode;
  }

  getState(): AvdState {
    return this.state;
  }

  getLineIndex(): number {
    return this.lineIndex;
  }

  getLineCount(): number {
    return this.lines.length;
  }

  private _onAdvanceClick(): void {
    if (this.state === 'done') return;
    if (this.state === 'typing') {
      this._completeTypewriter();
      return;
    }
    if (this.state === 'between') {
      const cur = this.lines[this.lineIndex];
      this.opts.onLineExit?.(cur, this.lineIndex);
      this.lineIndex++;
      if (this.lineIndex >= this.lines.length) {
        this._setState('done');
        this.opts.onComplete?.();
        return;
      }
      this._enterLine(this.lineIndex);
    }
  }

  private _setState(s: AvdState): void {
    this.state = s;
    this.opts.onStateChange?.(s);
  }

  private _enterLine(index: number): void {
    const line = this.lines[index];
    this.opts.onLineEnter?.(line, index);
    this.revealedChars = 0;

    this.dialogueBox.setSpeaker(line.speaker ?? null);

    if (this.inlineLayout) {
      destroyInlineLayout(this.inlineLayout);
      this.inlineLayout = null;
    }

    if (typeof line.text === 'string') {
      this.inlineMode = false;
      this.fullText = line.text;
      this.totalUnits = line.text.length;
      this.dialogueText.visible = true;
      this.dialogueText.text = '';
    } else {
      this.inlineMode = true;
      this.fullText = '';
      this.totalUnits = 0;
      this.dialogueText.visible = false;
      this.inlineLayout = buildInlineLayout(line.text, {
        maxWidth: this.opts.boxWidth - this.opts.boxPadding * 2,
        lineHeight: Math.round(this.opts.textSize * 1.4),
        fontSize: this.opts.textSize,
        fontFamily: this.opts.fontFamily,
        fill: this.opts.textColor,
      });
      this.dialogueBox.getDialogueContainer().addChild(this.inlineLayout.container);
      this.totalUnits = this.inlineLayout.totalUnits;
    }

    this.currentSpeaker = line.speaker ?? null;
    const resolved = this._resolvePortrait(line);
    this._applyPortrait(resolved.pos, resolved.texture);

    this.dialogueBox.setAlpha(0);
    gsap.killTweensOf(this.dialogueBox.container);
    gsap.to(this.dialogueBox.container, {
      alpha: 1,
      duration: this.opts.textFadeMs / 1000,
      ease: 'power2.out',
    });

    if (index === 0) {
      this.dialogueBox.setBoxOffsetY(this.opts.boxEnterOffsetY);
      gsap.to(this.dialogueBox.container, {
        y: 0,
        duration: this.opts.boxEnterMs / 1000,
        ease: 'power3.out',
      });
    } else {
      this.dialogueBox.setBoxOffsetY(0);
    }

    this._setState('typing');
  }

  private _completeTypewriter(): void {
    this.revealedChars = this.totalUnits;
    if (this.inlineMode && this.inlineLayout) {
      updateInlineLayout(this.inlineLayout, this.revealedChars);
    } else {
      const chars = Array.from(this.fullText);
      this.dialogueText.text = chars.join('');
    }
    this._setState('between');
    this.arrowPhase = 0;
  }

  private _resolvePortrait(line: AvdLine): { pos: AvdPortraitPos | null; texture: PIXI.Texture | null } {
    if (line.portrait && line.portraitPos) {
      return { pos: line.portraitPos, texture: line.portrait };
    }
    if (line.speaker && this.roster[line.speaker]) {
      return { pos: this.roster[line.speaker].pos, texture: this.roster[line.speaker].texture };
    }
    if (line.portrait) {
      return { pos: line.portraitPos ?? null, texture: line.portrait };
    }
    return { pos: null, texture: null };
  }

  private _applyPortrait(pos: AvdPortraitPos | null, texture: PIXI.Texture | null): void {
    if (this.rosterMode === 'persistent' && this.currentSpeaker && this.roster[this.currentSpeaker]) {
      this._applyRosterHighlight(this.currentSpeaker);
      return;
    }
    this.portraitLayer.setPortrait(pos, texture);
  }

  private _applyRosterHighlight(speaker: string | null): void {
    if (this.rosterMode !== 'persistent') {
      if (speaker && this.roster[speaker]) {
        const entry = this.roster[speaker];
        this.portraitLayer.setPortrait(entry.pos, entry.texture);
      } else {
        this.portraitLayer.setPortrait(null, null);
      }
      return;
    }
    for (const [name, entry] of Object.entries(this.roster)) {
      this.portraitLayer.setPortrait(entry.pos, entry.texture);
      const target = name === speaker ? 1.0 : 0.4;
      this.portraitLayer.setSlotAlpha(entry.pos, target, true);
    }
    if (!speaker) {
      for (const entry of Object.values(this.roster)) {
        this.portraitLayer.setSlotAlpha(entry.pos, 0.4, true);
      }
    }
  }

  private _redrawClickOverlay(): void {
    this.clickOverlay.clear();
    if (this.state === 'done') {
      this.clickOverlay.eventMode = 'none';
      return;
    }
    this.clickOverlay.eventMode = 'static';
    this.clickOverlay.rect(0, 0, this.W, this.H).fill({ color: 0x000000, alpha: 0.001 });
  }

  private _tick(ticker: PIXI.Ticker): void {
    const dt = ticker.deltaMS;

    if (this.state === 'typing' && this.revealedChars < this.totalUnits) {
      this.revealedChars = Math.min(
        this.totalUnits,
        this.revealedChars + (this.typewriterSpeed * dt) / 1000,
      );
      if (this.inlineMode && this.inlineLayout) {
        updateInlineLayout(this.inlineLayout, this.revealedChars);
      } else {
        const chars = Array.from(this.fullText);
        this.dialogueText.text = chars.slice(0, Math.floor(this.revealedChars)).join('');
      }
      if (this.revealedChars >= this.totalUnits) {
        this._setState('between');
        this.arrowPhase = 0;
      }
    }

    if (this.state === 'between') {
      this.arrowPhase += (dt / 1000) * Math.PI * 2;
      this.dialogueBox.redrawArrow(this.state, this.arrowPhase);
    }

    this._redrawClickOverlay();
  }
}
