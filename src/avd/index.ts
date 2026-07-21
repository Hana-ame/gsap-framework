/** Barrel file for the AVD (visual novel) module. */
export { AvdController } from './AvdController';
export { DialogueStateMachine } from './DialogueStateMachine';
export type { StateMachineCallbacks } from './DialogueStateMachine';
export { TypingEngine } from './TypingEngine';
export type { TextEffect } from './TypingEngine';
export { RosterManager } from './RosterManager';
export type { ActivePortrait } from './RosterManager';
export { DialogueBox } from './DialogueBox';
export type { DialogueBoxOptions } from './DialogueBox';
export { PortraitLayer } from './PortraitLayer';
export type { PortraitLayerOptions } from './PortraitLayer';
export { BackgroundLayer } from './BackgroundLayer';
export type { BackgroundLayerOptions } from './BackgroundLayer';
export { AudioManager } from './AudioManager';
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
