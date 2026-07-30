import { AudioManager, type AudioManagerOptions } from './AudioManager';

export class AudioService {
  private _audio: AudioManager;
  private _audioMap: Record<string, AudioBuffer> = {};
  private _currentBgmKey: string | null = null;

  constructor(am?: AudioManager) {
    this._audio = am ?? new AudioManager();
  }

  get manager(): AudioManager { return this._audio; }
  get currentBgmKey(): string | null { return this._currentBgmKey; }
  set currentBgmKey(v: string | null) { this._currentBgmKey = v; }

  setAudioMap(map: Record<string, AudioBuffer>): void {
    this._audioMap = map;
  }

  playBgm(key: string | null): void {
    this._currentBgmKey = key;
    const buf = key ? this._audioMap[key] ?? null : null;
    this._audio.playBgm(buf);
  }

  playSfx(key: string): void {
    const buf = this._audioMap[key];
    if (buf) this._audio.playSfx(buf);
  }

  playVoice(key: string): void {
    const buf = this._audioMap[key];
    if (buf) this._audio.playVoice(buf);
  }

  setBgmVolume(v: number): void { this._audio.setBgmVolume(v); }
  setSfxVolume(v: number): void { this._audio.setSfxVolume(v); }

  destroy(): void {
    this._audio.destroy();
  }
}
