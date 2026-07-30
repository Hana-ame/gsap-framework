import type { AnimationDriver } from '@framework/animation/types';
import { GSAPDriver } from '@framework/animation/GSAPDriver';
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
import { RosterManager } from './RosterManager';
import { AudioService } from './AudioService';
import { SaveLoadService } from './SaveLoadService';
import { EventBus } from './EventBus';
import { ChoiceService } from './ChoiceService';
import { FlagService } from './FlagService';
import { BacklogService } from './BacklogService';
import { BgState } from './BgState';
import { SpeakerState } from './SpeakerState';
import { Live2DState } from './Live2DState';
import { AutoSkipService } from './AutoSkipService';
import { InputService } from './InputService';
import { ParticleSystem, type ParticlePreset, type EmitterPosition } from './ParticleSystem';
import { NotificationSystem, type NotifOptions } from './NotificationSystem';
import { Live2DManager, type Live2DModelView } from './Live2DManager';
import { PixiLayer } from './render/PixiLayer';
import { DomLayer } from './render/DomLayer';
import type { IRenderContainer, IRenderGraphics, IRenderText } from '@framework/render/types';
import type {
  IAvdRenderLayer,
  IDialogueBoxHandle, IPortraitLayerHandle,
  IBackgroundLayerHandle, IScreenEffectsHandle, ITypingEngineHandle,
} from './render/types';

import type { TextEffect } from '@framework/render/types';
import type * as PIXI from 'pixi.js';
import type { DomGraphics } from './dom/DomNode';

export class AvdController {
  private _lines: AvdLine[] = [];
  private _opts: ResolvedAvdOptions;
  private _ticker: any | null = null;
  private _fsm: DialogueStateMachine;
  private _typing!: ITypingEngineHandle;
  private _roster: RosterManager;
  private _dialogueBox!: IDialogueBoxHandle;
  private _portraitLayer!: IPortraitLayerHandle;
  private _backgroundLayer!: IBackgroundLayerHandle;
  private _audioService: AudioService;
  private _saveLoadService: SaveLoadService;
  private _eventBus: EventBus;
  private _parent!: IRenderContainer;
  private _screenFx!: IScreenEffectsHandle;
  private _clickOverlay!: IRenderGraphics;
  private _particles: ParticleSystem;
  private _notifications: NotificationSystem;
  private _choiceContainer!: IRenderContainer;
  private _choiceService!: ChoiceService;
  private _arrowPhase = 0;
  private _tickFn: (() => void) | null = null;
  private _rafId: number | null = null;
  private _segmentMap: Map<string, number> = new Map();
  private _flagService: FlagService;
  private _backlogService: BacklogService;
  private _autoSkipService: AutoSkipService;
  private _inputService: InputService;
  private _destroyed = false;
  private _bgState: BgState;
  private _speakerState: SpeakerState;
  private _l2dState: Live2DState;
  private _hideUi = false;
  private _layer: IAvdRenderLayer | null = null;
  private _renderMode: 'pixi' | 'dom';
  private _driver: AnimationDriver;

  constructor(
    parent: any,
    ticker: any,
    options: AvdOptions,
    mode?: 'pixi' | 'dom',
    driver?: AnimationDriver,
  ) {
    this._driver = driver ?? GSAPDriver.INSTANCE;
    this._opts = resolveAvdOptions(options);
    this._roster = new RosterManager();
    this._audioService = new AudioService();
    this._saveLoadService = new SaveLoadService();
    this._eventBus = new EventBus();
    this._flagService = new FlagService();
    this._backlogService = new BacklogService();
    this._autoSkipService = new AutoSkipService();
    this._inputService = new InputService();
    this._bgState = new BgState();
    this._speakerState = new SpeakerState();
    this._l2dState = new Live2DState();

    if (this._opts.renderLayer) {
      this._layer = this._opts.renderLayer;
      this._parent = this._layer.root;
      this._ticker = ticker;
      this._renderMode = 'pixi';
    } else {
      this._renderMode = mode === 'dom' || !ticker ? 'dom' : 'pixi';
      if (this._renderMode === 'dom') {
        const layer = new DomLayer(parent as HTMLElement, this._opts.screenW, this._opts.screenH);
        this._layer = layer;
        this._parent = layer.root;
        this._ticker = null;
      } else {
        const layer = new PixiLayer(parent, ticker, this._opts.screenW, this._opts.screenH);
        this._layer = layer;
        this._parent = layer.root;
        this._ticker = ticker;
      }
    }

    this._initComponents();
    this._inputService.setCallbacks({
      quickSave: () => this.quickSave(),
      quickLoad: () => this.quickLoad(),
      advance: () => this._onClick(),
    });
    this._inputService.init();
    this._saveLoadService.setCallbacks({
      notify: (text, type) => {
        if (this._notifications) this._notifications.show({ text, type, duration: 1200 });
      },
    });
    this._startTicker();
  }

  get layer(): IAvdRenderLayer | null { return this._layer; }
  get parent(): IRenderContainer { return this._parent; }
  get screenW(): number { return this._opts.screenW; }
  get screenH(): number { return this._opts.screenH; }
  get fontFamily(): string { return this._opts.fontFamily; }
  get textSize(): number { return this._opts.textSize; }
  get dialogueBox(): IDialogueBoxHandle { return this._dialogueBox; }
  get portraitLayer(): IPortraitLayerHandle { return this._portraitLayer; }
  get backgroundLayer(): IBackgroundLayerHandle { return this._backgroundLayer; }
  get choiceContainer(): IRenderContainer { return this._choiceContainer; }

  private _initComponents(): void {
    const L = this._layer!;

    this._backgroundLayer = L.createBackgroundLayer(this._parent, {
      screenW: this._opts.screenW,
      screenH: this._opts.screenH,
    });

    this._dialogueBox = L.createDialogueBox(this._parent, {
      boxX: this._opts.boxX, boxY: this._opts.boxY,
      boxWidth: this._opts.boxWidth, boxHeight: this._opts.boxHeight,
      boxRadius: this._opts.boxRadius, boxPadding: this._opts.boxPadding,
      boxBg: this._opts.boxBg, boxBgAlpha: this._opts.boxBgAlpha,
      nameColor: this._opts.nameColor, nameSize: this._opts.nameSize,
      fontFamily: this._opts.fontFamily, arrowColor: this._opts.arrowColor,
    });

    this._portraitLayer = L.createPortraitLayer(this._parent, {
      screenW: this._opts.screenW,
      portraitY: this._opts.portraitY,
      portraitMaxH: this._opts.portraitMaxH,
      portraitFadeMs: this._opts.portraitFadeMs,
    });

    this._screenFx = L.createScreenEffects(this._parent);
    this._screenFx.resize(this._opts.screenW, this._opts.screenH);
    this._screenFx.setTarget(this._parent);

    this._typing = L.createTypingEngine();

    const callbacks: StateMachineCallbacks = {
      onStateChange: (s) => this._onStateChange(s),
      onLineEnter: (i) => this._loadLine(i),
    };
    this._fsm = new DialogueStateMachine(callbacks);

    this._clickOverlay = L.createGraphics();
    this._clickOverlay.eventMode = 'static';
    this._clickOverlay.cursor = 'pointer';
    if (this._renderMode === 'dom') {
      (this._clickOverlay as unknown as DomGraphics).el.addEventListener('pointerdown', () => this._onClick());
    } else {
      (this._clickOverlay as unknown as PIXI.Graphics).on('pointerdown', () => this._onClick());
    }
    this._parent.addChild(this._clickOverlay);
    this._redrawOverlay();

    this._choiceContainer = L.createContainer();
    this._choiceContainer.eventMode = 'passive';
    this._parent.addChild(this._choiceContainer);

    this._choiceService = new ChoiceService();
    this._choiceService.init(L, this._opts, this._choiceContainer, (choice, index) => this._onChoiceSelected(choice, index));

    if (this._renderMode === 'pixi') {
      this._notifications = new NotificationSystem(this._parent as unknown as PIXI.Container, undefined, this._driver);
    } else {
      this._notifications = null!;
    }

    this._particles = new ParticleSystem();
  }

  private _startTicker(): void {
    if (this._renderMode === 'pixi' && this._ticker) {
      this._tickFn = () => this._tick();
      this._ticker.add(this._tickFn);
    } else {
      const loop = () => {
        this._tick();
        if (!this._destroyed) this._rafId = requestAnimationFrame(loop);
      };
      this._rafId = requestAnimationFrame(loop);
    }
  }

  // ── 公开 API ──

  setScript(lines: AvdLine[]): void {
    this._lines = lines;
    this._arrowPhase = 0;
    this._segmentMap.clear();
    this._flagService.clear();
    this._backlogService.clear();
    lines.forEach((line, i) => {
      if (line.segment) this._segmentMap.set(line.segment, i);
    });
    this._fsm.setScript(lines.length);
    this._choiceService.setFlags(this._flagService.getSnapshot());
    this._choiceService.setSegmentMap(this._segmentMap);
  }

  next(): void { this._onClick(); }

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

  setTypewriterSpeed(charsPerSec: number): void { this._opts.typewriterSpeed = Math.max(1, charsPerSec); }
  setLineExpression(expr: string): void { this._speakerState.expressionOverride = expr; }
  setTextEffect(effect: TextEffect): void { this._typing.setEffect(effect); }

  applySettings(settings: AvdSettingsData): void {
    this._audioService.setBgmVolume(settings.bgmVolume);
    this._audioService.setSfxVolume(settings.sfxVolume);
    this.setTypewriterSpeed(settings.textSpeed);
    this._opts.autoModeDelay = settings.autoModeDelay;
  }

  startParticles(preset: ParticlePreset, position: EmitterPosition, container?: any): void {
    const c = container ?? this._parent;
    this._particles.createEmitter(c, preset, position).play();
  }

  get particleSystem(): ParticleSystem { return this._particles; }

  notify(opts: string | NotifOptions): void {
    if (this._notifications) this._notifications.show(opts);
  }

  get notificationSystem(): NotificationSystem | null { return this._notifications ?? null; }

  setRoster(roster: AvdRoster): void { this._roster.setRoster(roster); }
  setRosterMode(mode: AvdRosterMode): void { this._roster.setMode(mode); }
  getRoster(): AvdRoster { return this._roster.roster; }
  getRosterMode(): AvdRosterMode { return this._roster.mode; }

  getState(): AvdState { return this._fsm.state; }
  getLineIndex(): number { return this._fsm.lineIndex; }
  getLineCount(): number { return this._lines.length; }

  goTo(index: number): void {
    if (this._lines.length === 0) return;
    const clamped = Math.max(0, Math.min(index, this._lines.length - 1));
    if (this._typing.active) this._typing.complete();
    this._fsm.goTo(clamped);
  }

  goToLast(): void { this.goTo(this._lines.length - 1); }

  reset(): void {
    if (this._lines.length === 0) return;
    if (this._typing.active) this._typing.complete();
    this._flagService.clear();
    this._backlogService.clear();
    this._fsm.reset();
  }

  setFlag(name: string): void { this._flagService.add(name); }
  clearFlag(name: string): void { this._flagService.delete(name); }
  hasFlag(name: string): boolean { return this._flagService.has(name); }
  getFlags(): string[] { return this._flagService.toArray(); }

  getBacklog(): readonly BacklogEntry[] { return this._backlogService.entries; }

  // ── Hide UI toggle ──

  isHideUi(): boolean { return this._hideUi; }

  setHideUi(hide: boolean): void {
    this._hideUi = hide;
    this._dialogueBox.container.visible = !hide;
    this._portraitLayer.container.visible = !hide;
    this._choiceContainer.visible = !hide;
    this._redrawOverlay();
  }

  toggleHideUi(): void { this.setHideUi(!this._hideUi); }

  setSpeakerStyle(speaker: string, style: SpeakerStyle): void { this._speakerState.styles.set(speaker, style); }
  clearSpeakerStyle(speaker: string): void { this._speakerState.styles.delete(speaker); }

  save(label?: string): AvdSaveData {
    return this._saveLoadService.save({
      lineIndex: this._fsm.lineIndex,
      flags: this._flagService.getSnapshot(),
      backlog: this._backlogService.getSnapshot(),
      autoMode: this._autoSkipService.autoMode,
      skipMode: this._autoSkipService.skipMode,
      currentBgKey: this._bgState.currentKey,
      currentBgmKey: this._bgState.currentBgmKey,
    }, label);
  }

  load(data: AvdSaveData): void {
    if (this._lines.length === 0) return;
    if (this._typing.active) this._typing.complete();
    this._flagService.setFromArray(data.flags);
    this._backlogService.setFromArray(data.backlog);
    this._autoSkipService.restoreState(data.autoMode, data.skipMode);
    this._bgState.currentKey = data.bgKey ?? null;
    this._bgState.currentBgmKey = data.bgmKey ?? null;
    const idx = Math.max(0, Math.min(data.lineIndex, this._lines.length - 1));
    this._fsm.goTo(idx);
    this._choiceService.setFlags(this._flagService.getSnapshot());
  }

  quickSave(): void {
    this._saveLoadService.quickSave({
      lineIndex: this._fsm.lineIndex,
      flags: this._flagService.getSnapshot(),
      backlog: this._backlogService.getSnapshot(),
      autoMode: this._autoSkipService.autoMode,
      skipMode: this._autoSkipService.skipMode,
      currentBgKey: this._bgState.currentKey,
      currentBgmKey: this._bgState.currentBgmKey,
    });
  }

  quickLoad(): void {
    const data = this._saveLoadService.quickLoad();
    if (data) this.load(data);
  }

  setAutoMode(on: boolean): void { this._autoSkipService.setAutoMode(on); }
  isAutoMode(): boolean { return this._autoSkipService.autoMode; }
  setSkipMode(on: boolean): void { this._autoSkipService.setSkipMode(on); }
  isSkipMode(): boolean { return this._autoSkipService.skipMode; }

  fadeOut(duration?: number, onComplete?: () => void): void { this._screenFx.fadeOut(duration, onComplete); }
  fadeIn(duration?: number, onComplete?: () => void): void { this._screenFx.fadeIn(duration, onComplete); }

  setAudioMap(map: Record<string, AudioBuffer>): void { this._audioService.setAudioMap(map); }
  setBgTextureMap(map: Record<string, any>): void { this._bgState.textureMap = map; }
  setBgLazyLoad(fn: (key: string) => Promise<any>): void { this._bgState.setLazyLoad(fn); }

  setLive2DManager(mgr: Live2DManager): void { this._l2dState.manager = mgr; }
  registerSpeakerL2D(speaker: string, view: Live2DModelView): void { this._l2dState.views.set(speaker, view); }
  getSpeakerL2D(speaker: string): Live2DModelView | undefined { return this._l2dState.views.get(speaker); }

  destroy(): void {
    this._destroyed = true;
    this._clearAutoTimer();
    if (this._rafId != null) cancelAnimationFrame(this._rafId);
    if (this._tickFn && this._ticker) this._ticker.remove(this._tickFn);
    this._typing.destroy();
    this._dialogueBox.destroy();
    this._portraitLayer.destroy();
    this._backgroundLayer.destroy();
    this._audioService.destroy();
    this._screenFx.destroy();
    this._particles.destroy();
    if (this._notifications) this._notifications.destroy();
    this._l2dState.views.forEach((v) => v.destroy());
    this._l2dState.views.clear();
    this._clickOverlay.destroy();
    this._choiceService.destroy();
    this._choiceContainer.destroy({ children: true });
    this._inputService.destroy();
    this._layer?.destroy();
  }

  // ── 内部 ──

  private _onClick(): void {
    if (this._fsm.isComplete) return;
    if (this._hideUi) { this.setHideUi(false); return; }
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
    const delta = this._ticker ? this._ticker.deltaMS : 16;
    if (this._fsm.state === 'typing') {
      if (this._autoSkipService.skipMode) {
        this._typing.complete();
      } else {
        this._typing.update(delta);
      }
      if (!this._typing.active && this._typing.totalUnits > 0) {
        this._onTypingComplete();
      }
    }

    if (this._fsm.state === 'between' || this._fsm.state === 'choice') {
      this._arrowPhase += (delta / 1000) * Math.PI * 2;
      this._dialogueBox.updateArrow(this._fsm.state, this._arrowPhase);
    }

    this._portraitLayer.updateL2D(delta);
    this._particles.update(delta);
  }

  private _onTypingComplete(): void {
    const line = this._lines[this._fsm.lineIndex];
    if (line.choices?.length) {
      const visible = this._choiceService.filterChoices(line.choices);
      if (visible.length === 0) { this._fsm.advance(); return; }
      this._fsm.enterChoice();
      this._choiceService.show(visible);
      this._opts.onChoiceEnter?.(visible);
      this._eventBus.emit('choice:enter', { choices: visible });
      this._autoSkipService.onChoiceEnter();
      if (this._opts.choiceTimeoutMs) {
        this._choiceService.startTimer(this._opts.choiceTimeoutMs, visible[0], 0);
      }
    } else if (line.end) {
      this._fsm.finish();
    } else {
      this._fsm.advance();
      if (this._autoSkipService.autoMode && !this._autoSkipService.skipMode) {
        this._autoSkipService.startAutoTimer(this._opts.autoModeDelay, () => this._onClick());
      }
    }
    this._eventBus.emit('typing:complete', {});
  }

  private _loadLine(index: number): void {
    const line = this._lines[index];
    this._hideChoices();
    this._opts.onLineEnter?.(line, index);
    this._eventBus.emit('line:enter', { index, line });

    if (line.bgKey != null) {
      this._bgState.currentKey = line.bgKey;
      const bgTex = this._bgState.textureMap[line.bgKey];
      if (bgTex) {
        this._backgroundLayer.setBackground(bgTex);
      } else if (this._bgState.lazyLoad) {
        this._bgState.lazyLoad(line.bgKey).then(tex => {
          if (tex && this._bgState.currentKey === line.bgKey) {
            this._bgState.textureMap[line.bgKey] = tex;
            this._backgroundLayer.setBackground(tex);
          }
        });
      }
    }

    if (line.bgmKey != null) {
      this._bgState.currentBgmKey = line.bgmKey;
      this._audioService.playBgm(line.bgmKey);
    }

    if (line.sfxKey != null) {
      this._audioService.playSfx(line.sfxKey);
    }

    if (line.voiceKey != null) {
      this._audioService.playVoice(line.voiceKey);
    }

    if (line.effect === 'shake') {
      this._screenFx.shake();
    } else if (line.effect === 'flash') {
      this._screenFx.flash();
    }

    if (typeof line.text === 'string') {
      this._backlogService.add(line.speaker, line.text);
    }

    const spStyle = line.speaker ? this._speakerState.styles.get(line.speaker) : undefined;
    this._dialogueBox.setSpeaker(line.speaker ?? null, spStyle);

    const expr = this._speakerState.expressionOverride ?? line.expression ?? null;
    const resolved = this._roster.getPortraitForSpeaker(
      line.speaker ?? null, line.portrait ?? null, line.portraitPos ?? null, expr,
    );
    this._roster.setSpeaker(line.speaker ?? null);

    if (this._roster.mode === 'persistent') {
      this._portraitLayer.setAll(this._roster.getActivePortraits());
    } else if (resolved.pos && resolved.texture) {
      this._portraitLayer.setTarget(resolved.pos, resolved.texture);
    } else {
      this._portraitLayer.setTarget(null, null);
    }

    const textStyle: any = {
      fontFamily: this._opts.fontFamily,
      fontSize: spStyle?.textSize ?? this._opts.textSize,
      fill: spStyle?.textColor ?? this._opts.textColor,
      wordWrap: true,
      wordWrapWidth: this._opts.boxWidth - this._opts.boxPadding * 2,
      lineHeight: Math.round(this._opts.textSize * 1.4),
    };

    const textContainer = this._typing.start(
      line.text, this._opts.typewriterSpeed, textStyle,
      this._opts.boxWidth - this._opts.boxPadding * 2,
      Math.round(this._opts.textSize * 1.4),
    );
    this._dialogueBox.setTextContainer(textContainer);

    if (index === 0) {
      this._dialogueBox.setAlpha(0);
      this._driver.killTweensOf(this._dialogueBox.container);
      this._driver.to(this._dialogueBox.container, {
        alpha: 1, duration: this._opts.textFadeMs / 1000, ease: 'power2.out',
      });
      this._dialogueBox.setOffsetY(this._opts.boxEnterOffsetY);
      this._driver.to(this._dialogueBox.container, {
        y: this._opts.boxY, duration: this._opts.boxEnterMs / 1000, ease: 'power3.out',
      });
    }

    this._eventBus.emit('line:enter', { index, line });
  }

  private _clearAutoTimer(): void {
    this._autoSkipService.clearAutoTimer();
    this._choiceService.clearTimer();
  }

  private _hideChoices(): void {
    this._choiceService.hide();
  }

  private _resolveTarget(choice: AvdChoice): number {
    return this._choiceService.resolveTarget(choice);
  }

  private _onChoiceSelected(choice: AvdChoice, index: number): void {
    if (this._fsm.state !== 'choice') return;
    this._clearAutoTimer();
    this._choiceService.hide();
    this._opts.onChoiceSelect?.(choice, index);
    if (choice.conditionFlag) this._flagService.add(choice.conditionFlag);
    this._fsm.choose(this._resolveTarget(choice));
    this._eventBus.emit('choice:select', { choice, index });
  }

  private _onStateChange(state: AvdState): void {
    this._opts.onStateChange?.(state);
    this._redrawOverlay();
    if (state === 'done') {
      this._opts.onComplete?.();
      this._eventBus.emit('complete', {});
    }
    this._eventBus.emit('state:change', { state });
  }

  private _redrawOverlay(): void {
    this._clickOverlay.clear();
    if (this._fsm.isComplete || this._hideUi) {
      this._clickOverlay.eventMode = 'none';
      return;
    }
    this._clickOverlay.eventMode = 'static';
    this._clickOverlay
      .rect(0, 0, this._opts.screenW, this._opts.screenH)
      .fill({ color: 0x000000, alpha: 0.001 });
  }
}
