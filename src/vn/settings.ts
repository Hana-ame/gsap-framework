/**
 * 播放器设置 — localStorage 持久化：音量（按频道）、打字机速度、自动播放延迟。
 */

export interface VnSettings {
  /** 各频道音量 0..1。 */
  volume: { bgm: number; sfx: number; voice: number };
  /** 打字机每字间隔 ms（0=瞬间）。 */
  typeSpeed: number;
  /** 自动播放：每行结束后到自动推进的延迟 ms。 */
  autoDelay: number;
  /** 自动播放开关。 */
  auto: boolean;
  /** 跳过模式（跳过已读/快进）。 */
  skip: boolean;
}

const DEFAULT_SETTINGS: VnSettings = {
  volume: { bgm: 0.8, sfx: 1, voice: 1 },
  typeSpeed: 30,
  autoDelay: 1200,
  auto: false,
  skip: false,
};

const KEY = 'hana-vn:settings';

let cached: VnSettings | null = null;

/** 读取设置（惰性 + 缓存）。 */
export function getSettings(): VnSettings {
  if (cached) return cached;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<VnSettings>;
      cached = {
        ...DEFAULT_SETTINGS,
        ...parsed,
        volume: { ...DEFAULT_SETTINGS.volume, ...(parsed.volume ?? {}) },
      };
      return cached;
    }
  } catch {
    // 解析失败回退默认
  }
  cached = { ...DEFAULT_SETTINGS, volume: { ...DEFAULT_SETTINGS.volume } };
  return cached;
}

/** 更新设置并持久化。 */
export function updateSettings(patch: Partial<VnSettings>): VnSettings {
  const next = {
    ...getSettings(),
    ...patch,
    volume: patch.volume ? { ...getSettings().volume, ...patch.volume } : getSettings().volume,
  };
  cached = next;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEY, JSON.stringify(next));
    }
  } catch {
    // 持久化失败不影响运行时
  }
  return next;
}
