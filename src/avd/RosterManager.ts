/** Tracks active portraits and roster mode for the current line. */
import type * as PIXI from 'pixi.js';
import type { AvdPortraitPos, AvdRoster, AvdRosterMode } from './types';

export interface ActivePortrait {
  pos: AvdPortraitPos;
  texture: PIXI.Texture | null;
  alpha: number;
}

export class RosterManager {
  private _roster: AvdRoster = {};
  private _mode: AvdRosterMode = 'speaker-only';
  private _currentSpeaker: string | null = null;

  setRoster(roster: AvdRoster): void {
    this._roster = { ...roster };
  }

  setMode(mode: AvdRosterMode): void {
    this._mode = mode;
  }

  setSpeaker(speaker: string | null): void {
    this._currentSpeaker = speaker;
  }

  get mode(): AvdRosterMode {
    return this._mode;
  }

  get roster(): AvdRoster {
    return { ...this._roster };
  }

  getPortraitForSpeaker(
    speaker: string | null,
    linePortrait: PIXI.Texture | null,
    linePortraitPos: AvdPortraitPos | null,
  ): { pos: AvdPortraitPos | null; texture: PIXI.Texture | null } {
    if (linePortrait && linePortraitPos) {
      return { pos: linePortraitPos, texture: linePortrait };
    }
    if (speaker && this._roster[speaker]) {
      return { pos: this._roster[speaker].pos, texture: this._roster[speaker].texture };
    }
    if (linePortrait) {
      return { pos: linePortraitPos ?? null, texture: linePortrait };
    }
    return { pos: null, texture: null };
  }

  getActivePortraits(): ActivePortrait[] {
    if (this._mode !== 'persistent') {
      if (this._currentSpeaker && this._roster[this._currentSpeaker]) {
        const entry = this._roster[this._currentSpeaker];
        return [{ pos: entry.pos, texture: entry.texture, alpha: 1.0 }];
      }
      return [];
    }

    const result: ActivePortrait[] = [];
    for (const [name, entry] of Object.entries(this._roster)) {
      const alpha = name === this._currentSpeaker ? 1.0 : 0.4;
      result.push({ pos: entry.pos, texture: entry.texture, alpha });
    }
    if (!this._currentSpeaker) {
      return result.map((r) => ({ ...r, alpha: 0.4 }));
    }
    return result;
  }
}
