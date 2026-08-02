import type { AvdLine, AvdChoice, AvdState, AvdSaveData } from './types';

export interface AvdEventMap {
  'line:enter': { index: number; line: AvdLine };
  'state:change': { state: AvdState };
  'choice:enter': { choices: AvdChoice[] };
  'choice:select': { choice: AvdChoice; index: number };
  'complete': object;
  'typing:complete': object;
  'save': { data: AvdSaveData };
  'load': { data: AvdSaveData };
  'bgm': { key: string | null };
}

export type AvdEventKey = keyof AvdEventMap;
export type AvdEventPayload<K extends AvdEventKey> = AvdEventMap[K];

export class EventBus {
  private _listeners = new Map<string, Set<(...args: any[]) => void>>();

  on<K extends AvdEventKey>(event: K, fn: (payload: AvdEventPayload<K>) => void): void {
    let set = this._listeners.get(event);
    if (!set) { set = new Set(); this._listeners.set(event, set); }
    set.add(fn);
  }

  off<K extends AvdEventKey>(event: K, fn: (payload: AvdEventPayload<K>) => void): void {
    const set = this._listeners.get(event);
    if (set) set.delete(fn);
  }

  emit<K extends AvdEventKey>(event: K, payload: AvdEventPayload<K>): void {
    const set = this._listeners.get(event);
    if (set) for (const fn of set) fn(payload);
  }

  removeAll(): void {
    this._listeners.clear();
  }
}
