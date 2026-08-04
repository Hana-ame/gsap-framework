/**
 * 音频引擎 — 按频道管理 HTMLAudioElement。
 *
 * - bgm：背景音乐，同一时刻仅一个，loop 循环，切换时停旧的。
 * - sfx / voice：一次性音效/语音，可并发，播完自动移除。
 * 纯 DOM 实现，无外部依赖。
 */

export type AudioChannel = 'bgm' | 'sfx' | 'voice';

export interface VnAudioEngineOptions {
  channel?: AudioChannel;
  loop?: boolean;
  volume?: number;
}

export class VnAudioEngine {
  private _bgm: { key: string; audio: HTMLAudioElement } | null = null;
  private _oneshot = new Set<HTMLAudioElement>();

  /** 播放音频（url 为空静默跳过）。 */
  play(key: string, url: string, opts: VnAudioEngineOptions = {}): void {
    if (!url) return;
    const channel = opts.channel ?? (opts.loop ? 'bgm' : 'sfx');
    const volume = opts.volume ?? 1;
    const loop = channel === 'bgm' ? true : (opts.loop ?? false);

    if (channel === 'bgm') {
      if (this._bgm && this._bgm.key === key) return; // 同一首已在播
      this.stopBgm();
      const audio = new Audio(url);
      audio.loop = loop;
      audio.volume = volume;
      audio.play().catch(() => undefined);
      this._bgm = { key, audio };
      return;
    }

    const audio = new Audio(url);
    audio.loop = loop;
    audio.volume = volume;
    this._oneshot.add(audio);
    audio.addEventListener('ended', () => this._remove(audio));
    audio.play().catch(() => this._remove(audio));
  }

  /** 停止指定频道（缺省全部）。 */
  stop(channel?: AudioChannel): void {
    if (!channel || channel === 'bgm') this.stopBgm();
    if (!channel || channel === 'sfx' || channel === 'voice') this.stopOneshot(channel);
  }

  private stopBgm(): void {
    if (!this._bgm) return;
    this._bgm.audio.pause();
    this._bgm.audio.currentTime = 0;
    this._bgm = null;
  }

  private stopOneshot(channel?: AudioChannel): void {
    for (const a of [...this._oneshot]) {
      a.pause();
      this._oneshot.delete(a);
    }
  }

  private _remove(audio: HTMLAudioElement): void {
    this._oneshot.delete(audio);
  }

  /** 释放全部音频资源。 */
  dispose(): void {
    this.stopBgm();
    this.stopOneshot();
  }
}
