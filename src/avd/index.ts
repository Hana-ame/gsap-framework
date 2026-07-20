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
  type AvdRosterEntry,
  type AvdRoster,
  type AvdOptions,
  type ResolvedAvdOptions,
  type AvdLayoutMode,
  resolveAvdOptions,
} from './types';
