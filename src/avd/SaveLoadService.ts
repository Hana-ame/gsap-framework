import type { AvdSaveData, BacklogEntry } from './types';

export interface SaveStateProvider {
  lineIndex: number;
  flags: Set<string>;
  backlog: BacklogEntry[];
  autoMode: boolean;
  skipMode: boolean;
  currentBgKey: string | null;
  currentBgmKey: string | null;
}

export interface SaveLoadCallbacks {
  notify?: (text: string, type: 'success' | 'error' | 'warn' | 'info') => void;
}

export class SaveLoadService {
  private static QUICK_SAVE_KEY = 'avd_quicksave';
  private _callbacks: SaveLoadCallbacks;

  constructor(callbacks?: SaveLoadCallbacks) {
    this._callbacks = callbacks ?? {};
  }

  setCallbacks(cbs: SaveLoadCallbacks): void {
    this._callbacks = cbs;
  }

  save(state: SaveStateProvider, label?: string): AvdSaveData {
    return {
      version: 1,
      timestamp: Date.now(),
      lineIndex: state.lineIndex,
      flags: Array.from(state.flags),
      backlog: [...state.backlog],
      autoMode: state.autoMode,
      skipMode: state.skipMode,
      label,
      bgKey: state.currentBgKey,
      bgmKey: state.currentBgmKey,
    };
  }

  quickSave(state: SaveStateProvider): void {
    const data = this.save(state, 'quicksave');
    try {
      localStorage.setItem(SaveLoadService.QUICK_SAVE_KEY, JSON.stringify(data));
      this._callbacks.notify?.('Quick Save', 'success');
    } catch {
      this._callbacks.notify?.('Save Failed', 'error');
    }
  }

  quickLoad(): AvdSaveData | null {
    try {
      const raw = localStorage.getItem(SaveLoadService.QUICK_SAVE_KEY);
      if (!raw) {
        this._callbacks.notify?.('No Save Data', 'warn');
        return null;
      }
      const data = JSON.parse(raw) as AvdSaveData;
      this._callbacks.notify?.('Quick Load', 'info');
      return data;
    } catch {
      this._callbacks.notify?.('Load Failed', 'error');
      return null;
    }
  }
}
