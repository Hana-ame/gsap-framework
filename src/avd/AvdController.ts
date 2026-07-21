/** Top-level orchestrator for visual novel dialogue scenes. */
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import {
  type AvdChoice,
  type AvdLine,
  type AvdRoster,
  type AvdRosterMode,
  type AvdOptions,
  type ResolvedAvdOptions,
  type AvdState,
  type BacklogEntry,
  type AvdSaveData,
  type AvdSettingsData,
  type SpeakerStyle,
  resolveAvdOptions,
} from './types';
import { DialogueStateMachine, type StateMachineCallbacks } from './DialogueStateMachine';
import { TypingEngine, type TextEffect } from './TypingEngine';
import { RosterManager } from './RosterManager';
import { DialogueBox } from './DialogueBox';
import { PortraitLayer } from './PortraitLayer';
import { BackgroundLayer } from './BackgroundLayer';
import { AudioManager } from './AudioManager';
import { ScreenEffects } from './ScreenEffects';
import { Live2DManager, type Live2DModelView } from './Live2DManager';
import { ParticleSystem, type ParticlePreset, type EmitterPosition } from './ParticleSystem';
import { NotificationSystem, type NotifOptions, type NotificationSystemOptions } from './NotificationSystem';

export class AvdController {
  private _lines: AvdLine[] = [];
  private _opts: ResolvedAvdOptions;
  private _ticker: PIXI.Ticker;
  private _fsm: DialogueStateMachine;
  private _typing: TypingEngine;
  private _roster: RosterManager;
  private _dialogueBox: DialogueBox;
  private _portraitLayer: PortraitLayer;
  private _backgroundLayer: BackgroundLayer;
  private _audio: AudioManager;
  private _parent: PIXI.Container;
  private _screenFx: ScreenEffects;
  private _clickOverlay: PIXI.Graphics;
  private _particles: ParticleSystem;
  private _notifications: NotificationSystem;
  private _choiceContainer: PIXI.Container;
  private _choiceButtons: PIXI.Container[] = [];
  private _arrowPhase = 0;
  private _tickFn: () => void;
  private _segmentMap: Map<string, number> = new Map();
  private _flags: Set<string> = new Set();
  private _backlog: BacklogEntry[] = [];
  private _autoMode = false;
  private _skipMode = false;
  private _autoTimer: ReturnType<typeof setTimeout> | null = null;
  private _choiceTimer: ReturnType<typeof setTimeout> | null = null;
  private _audioMap: Record<string, AudioBuffer> = {};
  private _expressionOverride: string | null = null;
  private _speakerStyles: Map<string, SpeakerStyle> = new Map();
  private _currentBgKey: string | null = null;
  private _currentBgmKey: string | null = null;
  private _bgTextureMap: Record<string, PIXI.Texture> = {};
  private _l2dManager: Live2DManager | null = null;
  private _speakerL2D: Map<string, Live2DModelView> = new Map();
  private _keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(
    parent: PIXI.Container,
    ticker: PIXI.Ticker,
    options: AvdOptions,
  ) {
    this._opts = resolveAvdOptions(options);
    this._parent = parent;
    this._ticker = ticker;

    this._roster = new RosterManager();

    this._portraitLayer = new PortraitLayer(parent, {
      screenW: this._opts.screenW,
      portraitY: this._opts.portraitY,
      portraitMaxH: this._opts.portraitMaxH,
      portraitFadeMs: this._opts.portraitFadeMs,
    });

    this._backgroundLayer = new BackgroundLayer(parent, {
      screenW: this._opts.screenW,
      screenH: this._opts.screenH,
      bgColor: 0x0a0a14,
    });

    this._audio = new AudioManager();
    this._screenFx = new ScreenEffects(parent);
    this._screenFx.resize(this._opts.screenW, this._opts.screenH);
    this._screenFx.setTarget(parent);

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

    this._choiceContainer = new PIXI.Container();
    this._choiceContainer.eventMode = 'passive';
    parent.addChild(this._choiceContainer);

    this._particles = new ParticleSystem();
    this._notifications = new NotificationSystem(parent);

    this._keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'F5') { e.preventDefault(); this.quickSave(); }
      if (e.key === 'F8') { e.preventDefault(); this.quickLoad(); }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this._keyHandler);
    }

    this._tickFn = () => this._tick();
    this._ticker.add(this._tickFn);
  }

  setScript(lines: AvdLine[]): void {
    this._lines = lines;
    this._arrowPhase = 0;
    this._segmentMap.clear();
    this._flags.clear();
    this._backlog = [];
    lines.forEach((line, i) => {
      if (line.segment) this._segmentMap.set(line.segment, i);
    });
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

  setLineExpression(expr: string): void {
    this._expressionOverride = expr;
  }

  setTextEffect(effect: TextEffect): void {
    this._typing.setEffect(effect);
  }

  applySettings(settings: AvdSettingsData): void {
    this._audio?.setBgmVolume(settings.bgmVolume);
    this._audio?.setSfxVolume(settings.sfxVolume);
    this.setTypewriterSpeed(settings.textSpeed);
    this._opts.autoModeDelay = settings.autoModeDelay;
  }

  startParticles(
    preset: ParticlePreset,
    position: EmitterPosition,
    container?: PIXI.Container,
  ): void {
    this._particles.createEmitter(
      container ?? this._parent,
      preset,
      position,
    ).play();
  }

  get particleSystem(): ParticleSystem { return this._particles; }

  notify(opts: string | NotifOptions): void {
    this._notifications.show(opts);
  }

  get notificationSystem(): NotificationSystem { return this._notifications; }

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

  goTo(index: number): void {
    if (this._lines.length === 0) return;
    const clamped = Math.max(0, Math.min(index, this._lines.length - 1));
    if (this._typing.active) this._typing.complete();
    this._fsm.goTo(clamped);
  }

  goToLast(): void {
    this.goTo(this._lines.length - 1);
  }

  reset(): void {
    if (this._lines.length === 0) return;
    if (this._typing.active) this._typing.complete();
    this._flags.clear();
    this._backlog = [];
    this._fsm.reset();
  }

  // ---- flag system ----
  setFlag(name: string): void { this._flags.add(name); }
  clearFlag(name: string): void { this._flags.delete(name); }
  hasFlag(name: string): boolean { return this._flags.has(name); }
  getFlags(): string[] { return Array.from(this._flags); }

  // ---- backlog ----
  getBacklog(): readonly BacklogEntry[] { return this._backlog; }

  // ---- speaker styles ----
  setSpeakerStyle(speaker: string, style: SpeakerStyle): void {
    this._speakerStyles.set(speaker, style);
  }

  clearSpeakerStyle(speaker: string): void {
    this._speakerStyles.delete(speaker);
  }

  // ---- save / load ----
  save(label?: string): AvdSaveData {
    const line = this._lines[this._fsm.lineIndex];
    return {
      version: 1,
      timestamp: Date.now(),
      lineIndex: this._fsm.lineIndex,
      flags: Array.from(this._flags),
      backlog: [...this._backlog],
      autoMode: this._autoMode,
      skipMode: this._skipMode,
      label,
      bgKey: this._currentBgKey,
      bgmKey: this._currentBgmKey,
    };
  }

  load(data: AvdSaveData): void {
    if (this._lines.length === 0) return;
    if (this._typing.active) this._typing.complete();
    this._flags = new Set(data.flags);
    this._backlog = data.backlog.map((e) => ({ ...e }));
    this._autoMode = data.autoMode;
    this._skipMode = data.skipMode;

    try {
      if (data.bgKey != null) {
        const tex = this._bgTextureMap[data.bgKey];
        if (tex) {
          this._backgroundLayer.setBackground(tex);
          this._currentBgKey = data.bgKey;
        }
      } else {
        this._backgroundLayer.setBackground(null);
        this._currentBgKey = null;
      }
    } catch {
      this._currentBgKey = null;
    }

    try {
      if (data.bgmKey != null) {
        const buf = this._audioMap[data.bgmKey];
        if (buf) {
          this._audio.playBgm(buf);
          this._currentBgmKey = data.bgmKey;
        }
      } else {
        this._audio.playBgm(null);
        this._currentBgmKey = null;
      }
    } catch {
      this._currentBgmKey = null;
    }

    const idx = Math.max(0, Math.min(data.lineIndex, this._lines.length - 1));
    this._fsm.goTo(idx);
  }

  private static readonly QUICK_SAVE_KEY = 'avd_quicksave';

  quickSave(): void {
    const data = this.save('quicksave');
    try {
      localStorage.setItem(AvdController.QUICK_SAVE_KEY, JSON.stringify(data));
      this._notifications.show({ text: '快速存档', type: 'success', duration: 1200 });
    } catch {
      this._notifications.show({ text: '存档失败', type: 'error', duration: 1200 });
    }
  }

  quickLoad(): void {
    try {
      const raw = localStorage.getItem(AvdController.QUICK_SAVE_KEY);
      if (!raw) {
        this._notifications.show({ text: '无快速存档', type: 'warn', duration: 1200 });
        return;
      }
      const data = JSON.parse(raw) as AvdSaveData;
      this.load(data);
      this._notifications.show({ text: '快速读档', type: 'info', duration: 1200 });
    } catch {
      this._notifications.show({ text: '读档失败', type: 'error', duration: 1200 });
    }
  }

  // ---- auto / skip ----
  setAutoMode(on: boolean): void {
    this._autoMode = on;
    if (on) this._skipMode = false;
  }
  isAutoMode(): boolean { return this._autoMode; }
  setSkipMode(on: boolean): void {
    this._skipMode = on;
    if (on) this._autoMode = true;
  }
  isSkipMode(): boolean { return this._skipMode; }

  // ---- scene transitions ----
  fadeOut(duration?: number, onComplete?: () => void): void {
    this._screenFx.fadeOut(duration, onComplete);
  }

  fadeIn(duration?: number, onComplete?: () => void): void {
    this._screenFx.fadeIn(duration, onComplete);
  }

  setAudioMap(map: Record<string, AudioBuffer>): void {
    this._audioMap = map;
  }

  setBgTextureMap(map: Record<string, PIXI.Texture>): void {
    this._bgTextureMap = map;
  }

  // ---- Live2D ----
  setLive2DManager(mgr: Live2DManager): void {
    this._l2dManager = mgr;
  }

  registerSpeakerL2D(speaker: string, view: Live2DModelView): void {
    this._speakerL2D.set(speaker, view);
  }

  getSpeakerL2D(speaker: string): Live2DModelView | undefined {
    return this._speakerL2D.get(speaker);
  }

  destroy(): void {
    this._clearAutoTimer();
    this._ticker.remove(this._tickFn);
    this._typing.destroy();
    this._dialogueBox.destroy();
    this._portraitLayer.destroy();
    this._backgroundLayer.destroy();
    this._audio.destroy();
    this._screenFx.destroy();
    this._particles.destroy();
    this._notifications.destroy();
    this._speakerL2D.forEach((v) => v.destroy());
    this._speakerL2D.clear();
    this._clickOverlay.removeFromParent();
    this._clickOverlay.destroy();
    this._choiceContainer.removeFromParent();
    this._choiceContainer.destroy({ children: true });
    if (this._keyHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this._keyHandler);
    }
  }

  private _onClick(): void {
    if (this._fsm.isComplete) return;
    if (this._fsm.state === 'choice') return;
    this._clearAutoTimer();

    if (this._fsm.state === 'typing') {
      this._typing.complete();
      this._onTypingComplete();
      return;
    }
    this._fsm.advance();
  }

  private _tick(): void {
    if (this._fsm.state === 'typing') {
      this._typing.update(this._ticker.deltaMS);
      if (!this._typing.active && this._typing.totalUnits > 0) {
        this._onTypingComplete();
      }
    }

    if (this._fsm.state === 'between') {
      this._arrowPhase += (this._ticker.deltaMS / 1000) * Math.PI * 2;
      this._dialogueBox.updateArrow(this._fsm.state, this._arrowPhase);
    }

    if (this._fsm.state === 'choice') {
      this._arrowPhase += (this._ticker.deltaMS / 1000) * Math.PI * 2;
      this._dialogueBox.updateArrow('between', this._arrowPhase);
    }

    this._redrawOverlay();

    // Live2D 渲染同步
    this._portraitLayer.updateL2D(this._ticker.deltaMS);

    // 粒子系统
    this._particles.update(this._ticker.deltaMS);
  }

  private _onTypingComplete(): void {
    const line = this._lines[this._fsm.lineIndex];
    if (line.choices?.length) {
      this._fsm.enterChoice();
      this._showChoices(line.choices);
      this._opts.onChoiceEnter?.(line.choices);
      this._skipMode = false;
    } else if (line.end) {
      this._fsm.finish();
    } else {
      this._fsm.advance();
      if (this._autoMode && !this._skipMode) {
        this._clearAutoTimer();
        this._autoTimer = setTimeout(() => this._onClick(), this._opts.autoModeDelay);
      }
    }
  }

  private _loadLine(index: number): void {
    const line = this._lines[index];
    this._hideChoices();
    this._opts.onLineEnter?.(line, index);

    if (line.bg != null) {
      this._backgroundLayer.setBackground(line.bg);
      this._currentBgKey = line.bgKey ?? null;
    }

    if (line.bgmKey != null) {
      const buf = this._audioMap[line.bgmKey];
      if (buf) {
        this._audio.playBgm(buf);
        this._currentBgmKey = line.bgmKey;
      }
    }

    if (line.sfxKey != null) {
      const buf = this._audioMap[line.sfxKey];
      if (buf) this._audio.playSfx(buf);
    }

    // Stop previous voice when a new line starts
    this._audio.stopAllSfx();
    if (line.voiceKey != null) {
      const buf = this._audioMap[line.voiceKey];
      if (buf) this._audio.playSfx(buf);
    }

    if (line.effect === 'shake') {
      this._screenFx.shake();
    } else if (line.effect === 'flash') {
      this._screenFx.flash();
    }

    // 收集对话历史
    if (typeof line.text === 'string') {
      this._backlog.push({ speaker: line.speaker ?? null, text: line.text });
    }

    // 应用说话人风格
    const spStyle = line.speaker ? this._speakerStyles.get(line.speaker) : undefined;
    this._dialogueBox.setSpeaker(line.speaker ?? null, spStyle);

    const expr = this._expressionOverride ?? line.expression ?? null;
    const resolved = this._roster.getPortraitForSpeaker(
      line.speaker ?? null,
      line.portrait ?? null,
      line.portraitPos ?? null,
      expr,
    );
    this._roster.setSpeaker(line.speaker ?? null);

    if (this._roster.mode === 'persistent') {
      this._portraitLayer.setAll(this._roster.getActivePortraits());
    } else if (resolved.pos && resolved.texture) {
      const l2dView = line.speaker ? this._speakerL2D.get(line.speaker) : undefined;
      this._portraitLayer.setTarget(resolved.pos, resolved.texture, l2dView);
    } else {
      this._portraitLayer.setTarget(null, null);
    }

    const textStyle = new PIXI.TextStyle({
      fontFamily: this._opts.fontFamily,
      fontSize: spStyle?.textSize ?? this._opts.textSize,
      fill: spStyle?.textColor ?? this._opts.textColor,
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
        y: this._opts.boxY,
        duration: this._opts.boxEnterMs / 1000,
        ease: 'power3.out',
      });
    } else {
      this._dialogueBox.setOffsetY(0);
    }
  }

  private _clearAutoTimer(): void {
    if (this._autoTimer != null) {
      clearTimeout(this._autoTimer);
      this._autoTimer = null;
    }
    if (this._choiceTimer != null) {
      clearTimeout(this._choiceTimer);
      this._choiceTimer = null;
    }
  }

  private _showChoices(choices: AvdChoice[]): void {
    this._hideChoices();
    const cx = this._opts.boxX + this._opts.boxPadding;
    const cy = this._opts.boxY + this._opts.boxPadding + this._opts.nameSize + 8 + 60;
    const btnH = 34;
    const gap = 8;
    const maxW = this._opts.boxWidth - this._opts.boxPadding * 2;

    // 按 flag 条件过滤选项
    const visible = choices.filter((c) => {
      if (c.conditionFlag && !this._flags.has(c.conditionFlag)) return false;
      if (c.conditionNotFlag && this._flags.has(c.conditionNotFlag)) return false;
      return true;
    });

    // 选项自动超时：在 _onChoiceSelected 中被清除
    if (this._opts.choiceTimeoutMs && visible.length > 0) {
      this._choiceTimer = setTimeout(() => {
        this._onChoiceSelected(visible[0], 0);
      }, this._opts.choiceTimeoutMs);
    }

    visible.forEach((choice, i) => {
      const y = cy + i * (btnH + gap);
      const btn = new PIXI.Container();
      btn.eventMode = 'static';
      btn.cursor = 'pointer';

      const bg = new PIXI.Graphics()
        .roundRect(0, 0, maxW, btnH, 6)
        .fill({ color: 0x1a1a3a, alpha: 0.95 })
        .stroke({ width: 1, color: 0x446 });
      btn.addChild(bg);

      const label = new PIXI.Text({
        text: choice.text,
        style: { fontSize: 14, fill: 0xffffff, fontFamily: this._opts.fontFamily },
      });
      label.x = 12;
      label.y = (btnH - label.height) / 2;
      btn.addChild(label);

      btn.on('pointerdown', () => this._onChoiceSelected(choice, i));
      btn.on('pointerover', () => {
        bg.clear()
          .roundRect(0, 0, maxW, btnH, 6)
          .fill({ color: 0x3a4a7a, alpha: 0.95 })
          .stroke({ width: 1, color: 0x88ccff });
      });
      btn.on('pointerout', () => {
        bg.clear()
          .roundRect(0, 0, maxW, btnH, 6)
          .fill({ color: 0x1a1a3a, alpha: 0.95 })
          .stroke({ width: 1, color: 0x446 });
      });

      btn.x = cx;
      btn.y = y;
      this._choiceContainer.addChild(btn);
      this._choiceButtons.push(btn);
    });
  }

  private _hideChoices(): void {
    this._choiceContainer.removeChildren();
    this._choiceButtons = [];
  }

  private _resolveTarget(choice: AvdChoice): number {
    if (choice.targetSegment != null) {
      const idx = this._segmentMap.get(choice.targetSegment);
      if (idx != null) return idx;
    }
    return choice.targetLine ?? this._fsm.lineIndex;
  }

  private _onChoiceSelected(choice: AvdChoice, index: number): void {
    if (this._fsm.state !== 'choice') return;
    this._clearAutoTimer();
    this._hideChoices();
    this._opts.onChoiceSelect?.(choice, index);
    if (choice.conditionFlag) this._flags.add(choice.conditionFlag);
    this._fsm.choose(this._resolveTarget(choice));
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
