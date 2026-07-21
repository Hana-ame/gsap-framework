/** Shared types for the AVD system: lines, rosters, portraits, segments. */
import type * as PIXI from 'pixi.js';

export type AvdState = 'typing' | 'between' | 'choice' | 'done';

export type AvdPortraitPos = 'left' | 'center' | 'right';

export type AvdRosterMode = 'speaker-only' | 'persistent';

export type AvdText = string | AvdTextSegment[];

export type AvdTextSegment =
  | { kind: 'text'; text: string }
  | { kind: 'image'; texture: PIXI.Texture; width?: number; height?: number };

export interface AvdChoice {
  text: string;
  targetLine?: number;
  targetSegment?: string;
  conditionFlag?: string;
  conditionNotFlag?: string;
}

export interface AvdLine {
  speaker?: string;
  text: AvdText;
  portrait?: PIXI.Texture | null;
  portraitPos?: AvdPortraitPos | null;
  expression?: string;
  bg?: PIXI.Texture | null;
  bgKey?: string | null;
  bgmKey?: string;
  sfxKey?: string;
  voiceKey?: string;
  effect?: 'shake' | 'flash';
  choices?: AvdChoice[];
  segment?: string;
  end?: boolean;
}

export interface AvdRosterEntry {
  pos: AvdPortraitPos;
  texture: PIXI.Texture | null;
  expressions?: Record<string, PIXI.Texture>;
}

export type AvdRoster = Record<string, AvdRosterEntry>;

export interface BacklogEntry {
  speaker: string | null;
  text: string;
}

export interface SpeakerStyle {
  nameColor?: number;
  nameSize?: number;
  textColor?: number;
  textSize?: number;
}

export interface AvdSettingsData {
  bgmVolume: number;
  sfxVolume: number;
  textSpeed: number;
  autoModeDelay: number;
}

export const AVD_DEFAULT_SETTINGS: AvdSettingsData = {
  bgmVolume: 0.5,
  sfxVolume: 0.7,
  textSpeed: 35,
  autoModeDelay: 2000,
};

export interface AvdSaveData {
  version: number;
  timestamp: number;
  lineIndex: number;
  flags: string[];
  backlog: BacklogEntry[];
  autoMode: boolean;
  skipMode: boolean;
  label?: string;
  bgKey?: string | null;
  bgmKey?: string | null;
}

export interface AvdOptions {
  screenW: number;
  screenH: number;
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
  onChoiceEnter?: (choices: AvdChoice[]) => void;
  onChoiceSelect?: (choice: AvdChoice, index: number) => void;
  autoModeDelay?: number;
  choiceTimeoutMs?: number;
}

export interface ResolvedAvdOptions {
  screenW: number;
  screenH: number;
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
  onChoiceEnter?: (choices: AvdChoice[]) => void;
  onChoiceSelect?: (choice: AvdChoice, index: number) => void;
  autoModeDelay: number;
  choiceTimeoutMs: number;
}

export type AvdLayoutMode = 'desktop' | 'phone-portrait' | 'phone-landscape';

export function resolveAvdOptions(opts: AvdOptions): ResolvedAvdOptions {
  const isCompact = opts.screenH < 500;
  const narrow = opts.screenW < 720 && !isCompact;

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  let boxWidth: number, boxHeight: number, boxX: number, boxY: number;
  let boxRadius: number, boxPadding: number;
  let textSize: number, nameSize: number;
  let portraitMaxH: number, portraitY: number;

  if (isCompact) {
    const gap = 8;
    boxWidth = opts.screenW - 16;
    boxHeight = Math.min(140, Math.floor(opts.screenH * 0.35));
    boxX = 8;
    boxY = opts.screenH - boxHeight - gap;
    boxRadius = 8;
    boxPadding = 10;
    textSize = clamp(Math.floor((opts.screenW - 32) / 32), 14, 18);
    nameSize = clamp(textSize - 2, 12, 16);
    portraitMaxH = Math.max(60, Math.floor(opts.screenH * 0.25));
    portraitY = boxY - portraitMaxH - gap;
  } else if (narrow) {
    boxWidth = opts.screenW - 24;
    boxHeight = Math.min(180, Math.floor(opts.screenH * 0.26));
    boxX = 12;
    boxY = opts.screenH - boxHeight - 16;
    boxRadius = 10;
    boxPadding = 14;
    textSize = clamp(Math.floor((opts.screenW - 48) / 26), 15, 20);
    nameSize = clamp(Math.floor((opts.screenW - 48) / 30), 14, 18);
    portraitMaxH = Math.min(380, Math.floor(opts.screenH * 0.5));
    portraitY = opts.screenH - portraitMaxH - 8;
  } else {
    boxWidth = 920;
    boxHeight = 200;
    boxX = Math.floor((opts.screenW - 920) / 2);
    boxY = opts.screenH - 200 - 40;
    boxRadius = 12;
    boxPadding = 24;
    textSize = 24;
    nameSize = 22;
    portraitMaxH = Math.min(560, Math.floor(opts.screenH * 0.7));
    portraitY = opts.screenH - portraitMaxH - 20;
  }

  return {
    screenW: opts.screenW,
    screenH: opts.screenH,
    boxWidth: opts.boxWidth ?? boxWidth,
    boxHeight: opts.boxHeight ?? boxHeight,
    boxX: opts.boxX ?? boxX,
    boxY: opts.boxY ?? boxY,
    boxBg: opts.boxBg ?? 0x0a0a1e,
    boxBgAlpha: opts.boxBgAlpha ?? 0.92,
    boxRadius: opts.boxRadius ?? boxRadius,
    boxPadding: opts.boxPadding ?? boxPadding,
    textColor: opts.textColor ?? 0xffffff,
    textSize: opts.textSize ?? textSize,
    fontFamily: opts.fontFamily ?? 'sans-serif',
    typewriterSpeed: Math.max(1, opts.typewriterSpeed ?? 30),
    textFadeMs: opts.textFadeMs ?? 200,
    nameColor: opts.nameColor ?? 0x88ccff,
    nameSize: opts.nameSize ?? nameSize,
    portraitMaxH: opts.portraitMaxH ?? portraitMaxH,
    portraitY: opts.portraitY ?? portraitY,
    portraitFadeMs: opts.portraitFadeMs ?? 300,
    arrowColor: opts.arrowColor ?? 0x88ccff,
    boxEnterMs: opts.boxEnterMs ?? 400,
    boxEnterOffsetY: opts.boxEnterOffsetY ?? 80,
    onLineEnter: opts.onLineEnter,
    onLineExit: opts.onLineExit,
    onComplete: opts.onComplete,
    onStateChange: opts.onStateChange,
    onChoiceEnter: opts.onChoiceEnter,
    onChoiceSelect: opts.onChoiceSelect,
    autoModeDelay: opts.autoModeDelay ?? 2000,
    choiceTimeoutMs: opts.choiceTimeoutMs ?? 0,
  };
}
