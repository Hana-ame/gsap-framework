/** Top-level orchestrator for visual novel dialogue scenes. */
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import {
  type AvdLine,
  type AvdRoster,
  type AvdRosterMode,
  type AvdOptions,
  type ResolvedAvdOptions,
  type AvdState,
  resolveAvdOptions,
} from './types';
import { DialogueStateMachine, type StateMachineCallbacks } from './DialogueStateMachine';
import { TypingEngine } from './TypingEngine';
import { RosterManager } from './RosterManager';
import { DialogueBox } from './DialogueBox';
import { PortraitLayer } from './PortraitLayer';

export class AvdController {
  private _lines: AvdLine[] = [];
  private _opts: ResolvedAvdOptions;
  private _ticker: PIXI.Ticker;
  private _fsm: DialogueStateMachine;
  private _typing: TypingEngine;
  private _roster: RosterManager;
  private _dialogueBox: DialogueBox;
  private _portraitLayer: PortraitLayer;
  private _clickOverlay: PIXI.Graphics;
  private _arrowPhase = 0;
  private _tickFn: () => void;

  constructor(
    parent: PIXI.Container,
    ticker: PIXI.Ticker,
    options: AvdOptions,
  ) {
    this._opts = resolveAvdOptions(options);
    this._ticker = ticker;

    this._roster = new RosterManager();

    this._portraitLayer = new PortraitLayer(parent, {
      screenW: this._opts.screenW,
      portraitY: this._opts.portraitY,
      portraitMaxH: this._opts.portraitMaxH,
      portraitFadeMs: this._opts.portraitFadeMs,
    });

    this._dialogueBox = new DialogueBox(parent, {
      boxX: this._opts.boxX,
      boxY: this._opts.boxY,
      boxWidth: this._opts.boxWidth,
      boxHeight: this._opts.boxHeight,
      boxRadius: this._opts.boxRadius,
      boxPadding: this._opts.boxPadding,
      boxBg: this._opts.boxBg,
      boxBgAlpha: this._opts.boxBgAlpha,
      nameColor: this._opts.nameColor,
      nameSize: this._opts.nameSize,
      fontFamily: this._opts.fontFamily,
      arrowColor: this._opts.arrowColor,
    });

    this._typing = new TypingEngine();

    const callbacks: StateMachineCallbacks = {
      onStateChange: (s) => this._onStateChange(s),
      onLineEnter: (i) => this._loadLine(i),
    };

    this._fsm = new DialogueStateMachine(callbacks);

    this._clickOverlay = new PIXI.Graphics();
    parent.addChild(this._clickOverlay);
    this._clickOverlay.eventMode = 'static';
    this._clickOverlay.cursor = 'pointer';
    this._clickOverlay.on('pointerdown', () => this._onClick());
    this._redrawOverlay();

    this._tickFn = () => this._tick();
    this._ticker.add(this._tickFn);
  }

  setScript(lines: AvdLine[]): void {
    this._lines = lines;
    this._arrowPhase = 0;
    this._fsm.setScript(lines.length);
  }

  next(): void {
    this._onClick();
  }

  applyOptions(partial: Partial<AvdOptions>): void {
    const oldPortraitY = this._opts.portraitY;

    this._opts = { ...this._opts, ...partial };

    this._dialogueBox.applyOptions({
      boxBg: this._opts.boxBg,
      boxBgAlpha: this._opts.boxBgAlpha,
      nameColor: this._opts.nameColor,
      arrowColor: this._opts.arrowColor,
    });

    if (this._opts.portraitY !== oldPortraitY) {
      this._portraitLayer.applyOptions({ portraitY: this._opts.portraitY });
    }
  }

  setTypewriterSpeed(charsPerSec: number): void {
    this._opts.typewriterSpeed = Math.max(1, charsPerSec);
  }

  setRoster(roster: AvdRoster): void {
    this._roster.setRoster(roster);
  }

  setRosterMode(mode: AvdRosterMode): void {
    this._roster.setMode(mode);
  }

  getRoster(): AvdRoster {
    return this._roster.roster;
  }

  getRosterMode(): AvdRosterMode {
    return this._roster.mode;
  }

  getState(): AvdState {
    return this._fsm.state;
  }

  getLineIndex(): number {
    return this._fsm.lineIndex;
  }

  getLineCount(): number {
    return this._lines.length;
  }

  destroy(): void {
    this._ticker.remove(this._tickFn);
    this._typing.destroy();
    this._dialogueBox.destroy();
    this._portraitLayer.destroy();
    this._clickOverlay.removeFromParent();
    this._clickOverlay.destroy();
  }

  private _onClick(): void {
    if (this._fsm.isComplete) return;

    if (this._fsm.state === 'typing') {
      this._typing.complete();
    }
    this._fsm.advance();
  }

  private _tick(): void {
    if (this._fsm.state === 'typing') {
      this._typing.update(this._ticker.deltaMS);
      if (!this._typing.active && this._typing.totalUnits > 0) {
        this._fsm.advance();
      }
    }

    if (this._fsm.state === 'between') {
      this._arrowPhase += (this._ticker.deltaMS / 1000) * Math.PI * 2;
      this._dialogueBox.updateArrow(this._fsm.state, this._arrowPhase);
    }

    this._redrawOverlay();
  }

  private _loadLine(index: number): void {
    const line = this._lines[index];
    this._opts.onLineEnter?.(line, index);

    this._dialogueBox.setSpeaker(line.speaker ?? null);

    const resolved = this._roster.getPortraitForSpeaker(
      line.speaker ?? null,
      line.portrait ?? null,
      line.portraitPos ?? null,
    );
    this._roster.setSpeaker(line.speaker ?? null);

    if (this._roster.mode === 'persistent') {
      this._portraitLayer.setAll(this._roster.getActivePortraits());
    } else if (resolved.pos && resolved.texture) {
      this._portraitLayer.setTarget(resolved.pos, resolved.texture);
    } else {
      this._portraitLayer.setTarget(null, null);
    }

    const textStyle = new PIXI.TextStyle({
      fontFamily: this._opts.fontFamily,
      fontSize: this._opts.textSize,
      fill: this._opts.textColor,
      wordWrap: true,
      wordWrapWidth: this._opts.boxWidth - this._opts.boxPadding * 2,
      lineHeight: Math.round(this._opts.textSize * 1.4),
    });

    const textContainer = this._typing.start(
      line.text,
      this._opts.typewriterSpeed,
      textStyle,
      this._opts.boxWidth - this._opts.boxPadding * 2,
      Math.round(this._opts.textSize * 1.4),
    );
    this._dialogueBox.setTextContainer(textContainer);

    this._dialogueBox.setAlpha(0);
    gsap.killTweensOf(this._dialogueBox.container);
    gsap.to(this._dialogueBox.container, {
      alpha: 1,
      duration: this._opts.textFadeMs / 1000,
      ease: 'power2.out',
    });

    if (index === 0) {
      this._dialogueBox.setOffsetY(this._opts.boxEnterOffsetY);
      gsap.to(this._dialogueBox.container, {
        y: 0,
        duration: this._opts.boxEnterMs / 1000,
        ease: 'power3.out',
      });
    } else {
      this._dialogueBox.setOffsetY(0);
    }
  }

  private _onStateChange(state: AvdState): void {
    this._opts.onStateChange?.(state);
    if (state === 'done') {
      this._opts.onComplete?.();
    }
  }

  private _redrawOverlay(): void {
    this._clickOverlay.clear();
    if (this._fsm.isComplete) {
      this._clickOverlay.eventMode = 'none';
      return;
    }
    this._clickOverlay.eventMode = 'static';
    this._clickOverlay
      .rect(0, 0, this._opts.screenW, this._opts.screenH)
      .fill({ color: 0x000000, alpha: 0.001 });
  }
}
