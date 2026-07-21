import { type AvdSettingsData, AVD_DEFAULT_SETTINGS } from './types';

const STORAGE_KEY = 'avd_settings';

export function loadSettings(): AvdSettingsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...AVD_DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AvdSettingsData>;
    return {
      bgmVolume: clamp01(parsed.bgmVolume ?? AVD_DEFAULT_SETTINGS.bgmVolume),
      sfxVolume: clamp01(parsed.sfxVolume ?? AVD_DEFAULT_SETTINGS.sfxVolume),
      textSpeed: Math.max(1, parsed.textSpeed ?? AVD_DEFAULT_SETTINGS.textSpeed),
      autoModeDelay: Math.max(500, parsed.autoModeDelay ?? AVD_DEFAULT_SETTINGS.autoModeDelay),
    };
  } catch {
    return { ...AVD_DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AvdSettingsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage full or unavailable
  }
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
