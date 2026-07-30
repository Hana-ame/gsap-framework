/** Barrel file for the AVD (visual novel) module. */
export { AvdController } from './AvdController';
export { DialogueStateMachine } from './DialogueStateMachine';
export type { StateMachineCallbacks } from './DialogueStateMachine';
export { TypingEngine } from './TypingEngine';
export { RosterManager } from './RosterManager';
export type { ActivePortrait } from './RosterManager';
export { DialogueBox } from './DialogueBox';
export type { DialogueBoxOptions } from './DialogueBox';
export { PortraitLayer } from './PortraitLayer';
export type { PortraitLayerOptions } from './PortraitLayer';
export { BackgroundLayer } from './BackgroundLayer';
export type { BackgroundLayerOptions } from './BackgroundLayer';
export { AudioManager } from './AudioManager';
export { AudioService } from './AudioService';
export { FlagService } from './FlagService';
export { BacklogService } from './BacklogService';
export { AutoSkipService } from './AutoSkipService';
export { InputService } from './InputService';
export { BgState } from './BgState';
export { SpeakerState } from './SpeakerState';
export { Live2DState } from './Live2DState';
export { SaveLoadService } from './SaveLoadService';
export { EventBus } from './EventBus';
export { ChoiceService } from './ChoiceService';
export { ScreenEffects } from './ScreenEffects';
export { Live2DManager } from './Live2DManager';
export type { Live2DModelView, Live2DModelOptions } from './Live2DManager';
export { ParticleSystem, ParticleEmitter } from './ParticleSystem';
export type { ParticleConfig, ParticlePreset, EmitterPosition } from './ParticleSystem';
export { NotificationSystem } from './NotificationSystem';
export type { NotifOptions, NotifType, NotificationSystemOptions } from './NotificationSystem';
export { parseScript } from './AvdScript';
export type {
  AvdMetaJSON,
  AvdRosterEntryJSON,
  AvdTextSegmentJSON,
  AvdLineJSON,
  AvdScriptJSON,
  AvdAssetResolver,
  AvdParsedScript,
} from './AvdScript';
export {
  type AvdState,
  type AvdPortraitPos,
  type AvdRosterMode,
  type AvdText,
  type AvdTextSegment,
  type AvdLine,
  type AvdChoice,
  type AvdRosterEntry,
  type AvdRoster,
  type AvdOptions,
  type ResolvedAvdOptions,
  type AvdLayoutMode,
  type BacklogEntry,
  type AvdSettingsData,
  AVD_DEFAULT_SETTINGS,
  resolveAvdOptions,
} from './types';
export type { AvdSaveData, SpeakerStyle } from './types';

// ── AVD UI（独立于 AvdController 的界面层） ──
export type { AvdUIHost } from './AvdUI';

// ── RenderLayer 体系（Pixi / DOM 双模式） ──
export { PixiLayer } from './render/PixiLayer';
export { DomLayer } from './render/DomLayer';
export type {
  IRenderLayer, IRenderContainer, IRenderGraphics,
  IRenderText, IRenderSprite,
  IDialogueBoxHandle, IPortraitLayerHandle,
  IBackgroundLayerHandle, IScreenEffectsHandle, ITypingEngineHandle,
} from './render/types';

// ── DOM 组件（仅用于 DOM 模式的自定义扩展） ──
export {
  DomContainer, DomGraphics, DomText, DomSprite, DomTexture,
  DomDisplayObject, measureText,
} from './dom/DomNode';
export type { DomTextStyle } from './dom/DomNode';
export { DomDialogueBox } from './dom/DomDialogueBox';
export type { DomDialogueBoxOptions } from './dom/DomDialogueBox';
export { DomPortraitLayer } from './dom/DomPortraitLayer';
export type { DomPortraitLayerOptions } from './dom/DomPortraitLayer';
export { DomBackgroundLayer } from './dom/DomBackgroundLayer';
export type { DomBackgroundLayerOptions } from './dom/DomBackgroundLayer';
export { DomScreenEffects } from './dom/DomScreenEffects';
export { DomTypingEngine } from './dom/DomTypingEngine';
export type { TextEffect } from '@framework/render/types';

// ── InputRemapper（按键重映射中间层） ──
export { InputRemapper } from './InputRemapper';
export type { InputAction, InputBinding, KeyCombo } from './InputRemapper';

// ── VN 中间格式体系（KAG / ONS / Ren'Py / RMMZ → 通用 JSON → Player） ──
export { VnScriptPlayer, KagLayerManager, kagToVnScript, onsToVnScript, renpyToVnScript, rmmzToVnScript, vnScriptToAvdLines, VnScriptRunner } from './vn';
export type { VnPlayerHost, KagLayer, VnScriptJSON, VnMeta, VnResources, VnOp, VnCharacterDef, VnOpDialog, VnOpBg, VnOpChar, VnOpChoice, VnOpIf, VnOpJump, VnOpCall, VnOpLabel, VnOpSetFlag, VnOpSetVar, VnTextSegment, VnCharPlacement, VnTransition } from './vn';
