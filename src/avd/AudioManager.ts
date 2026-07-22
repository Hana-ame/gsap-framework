/** Simple BGM/SFX manager using Web Audio API with procedural tone generation. */
export type AudioAsset = { buffer: AudioBuffer };

export interface AudioManagerOptions {
  bgmVolume?: number;
  sfxVolume?: number;
  crossfadeMs?: number;
}

const DEFAULTS: Required<AudioManagerOptions> = {
  bgmVolume: 0.5,
  sfxVolume: 0.7,
  crossfadeMs: 800,
};

export class AudioManager {
  private _ctx: AudioContext | null = null;
  private _opts: Required<AudioManagerOptions>;
  private _bgmGain: GainNode | null = null;
  private _sfxGain: GainNode | null = null;
  private _currentBgm: AudioBufferSourceNode | null = null;
  private _currentBgmBuffer: AudioBuffer | null = null;
  private _bgmStarted = 0;
  private _activeSfx: AudioBufferSourceNode[] = [];
  private _activeVoice: AudioBufferSourceNode | null = null;

  constructor(opts?: AudioManagerOptions) {
    this._opts = { ...DEFAULTS, ...opts };
  }

  private _ensureCtx(): AudioContext {
    if (!this._ctx) {
      this._ctx = new AudioContext();
      this._bgmGain = this._ctx.createGain();
      this._bgmGain.gain.value = this._opts.bgmVolume;
      this._bgmGain.connect(this._ctx.destination);
      this._sfxGain = this._ctx.createGain();
      this._sfxGain.gain.value = this._opts.sfxVolume;
      this._sfxGain.connect(this._ctx.destination);
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  }

  setBgmVolume(v: number): void { this._opts.bgmVolume = v; if (this._bgmGain) this._bgmGain.gain.value = v; }
  setSfxVolume(v: number): void { this._opts.sfxVolume = v; if (this._sfxGain) this._sfxGain.gain.value = v; }

  /** Play BGM from a pre-loaded AudioBuffer. Pass null to stop. */
  playBgm(buffer: AudioBuffer | null, crossfade?: number): void {
    const ctx = this._ensureCtx();
    const fadeMs = crossfade ?? this._opts.crossfadeMs;

    if (buffer === this._currentBgmBuffer) return;

    if (this._currentBgm && this._currentBgmBuffer) {
      const oldGain = this._bgmGain!;
      // Fade out current BGM on its gain node
      oldGain.gain.setTargetAtTime(0, ctx.currentTime, fadeMs / 2000);
      this._currentBgm.stop(ctx.currentTime + fadeMs / 1000 + 0.05);
    }

    if (!buffer) {
      this._currentBgmBuffer = null;
      this._currentBgm = null;
      return;
    }

    this._currentBgmBuffer = buffer;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this._bgmGain!);
    source.connect(gain);
    source.start();
    gain.gain.setTargetAtTime(1, ctx.currentTime, fadeMs / 2000);
    this._currentBgm = source;
    this._bgmStarted = ctx.currentTime;
  }

  /** Play a voice clip (one-shot, interrupts previous voice). */
  playVoice(buffer: AudioBuffer): void {
    const ctx = this._ensureCtx();
    if (this._activeVoice) {
      try { this._activeVoice.stop(); } catch { /* ignore */ }
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(1, now);
    gain.gain.setTargetAtTime(0, now + buffer.duration - 0.05, 0.02);
    source.connect(gain);
    gain.connect(this._sfxGain!);
    source.start();
    this._activeVoice = source;
  }

  /** Play a one-shot SFX. */
  playSfx(buffer: AudioBuffer): void {
    const ctx = this._ensureCtx();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this._sfxGain!);
    source.start();
    this._activeSfx.push(source);
    source.onended = () => {
      const idx = this._activeSfx.indexOf(source);
      if (idx >= 0) this._activeSfx.splice(idx, 1);
    };
  }

  stopAllSfx(): void {
    for (const s of this._activeSfx) {
      try { s.stop(); } catch { /* already stopped */ }
    }
    this._activeSfx = [];
  }

  /** Generate a simple sine-tone AudioBuffer (for BGM/SFX without external files). */
  generateTone(freq: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer {
    const ctx = this._ensureCtx();
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;
      if (type === 'sine') {
        sample = Math.sin(2 * Math.PI * freq * t);
      } else if (type === 'triangle') {
        const p = (freq * t) % 1;
        sample = p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
      } else if (type === 'sawtooth') {
        sample = 2 * ((freq * t) % 1) - 1;
      } else {
        sample = Math.sin(2 * Math.PI * freq * t);
      }
      // 淡入淡出包络
      const env = Math.min(1, Math.min(t / 0.02, (duration - t) / 0.02));
      data[i] = sample * env * 0.3;
    }
    return buffer;
  }

  /** Generate a short noise burst (for impacts, SFX). */
  generateNoise(duration: number): AudioBuffer {
    const ctx = this._ensureCtx();
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const env = Math.min(1, (duration - t) / 0.05);
      data[i] = (Math.random() * 2 - 1) * env * 0.2;
    }
    return buffer;
  }

  /** Generate a simple chord (3 stacked sine tones) for richer BGM. */
  generateChord(baseFreq: number, duration: number): AudioBuffer {
    const ctx = this._ensureCtx();
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;
      for (const f of freqs) sample += Math.sin(2 * Math.PI * f * t);
      const env = Math.min(1, Math.min(t / 0.05, (duration - t) / 0.05));
      data[i] = (sample / freqs.length) * env * 0.25;
    }
    return buffer;
  }

  destroy(): void {
    try { this._currentBgm?.stop(); } catch { /* ignore */ }
    try { this._activeVoice?.stop(); } catch { /* ignore */ }
    this._currentBgm = null;
    this._currentBgmBuffer = null;
    this._activeVoice = null;
    this._ctx?.close();
    this._ctx = null;
  }
}
