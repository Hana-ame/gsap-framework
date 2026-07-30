import type { BacklogEntry } from './types';

export class BacklogService {
  private _entries: BacklogEntry[] = [];

  get entries(): readonly BacklogEntry[] { return this._entries; }

  add(speaker: string | null, text: string): void {
    this._entries.push({ speaker, text });
  }

  clear(): void { this._entries = []; }

  getSnapshot(): BacklogEntry[] { return this._entries; }

  setFromArray(arr: BacklogEntry[]): void {
    this._entries = arr.map((e) => ({ ...e }));
  }
}
