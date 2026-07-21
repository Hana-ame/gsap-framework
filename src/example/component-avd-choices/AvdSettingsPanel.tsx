import { useCallback } from 'react';
import type { AvdSettingsData } from '../../avd/types';

interface Props {
  settings: AvdSettingsData;
  onChange: (s: AvdSettingsData) => void;
  onClose: () => void;
}

const styles = {
  overlay: {
    position: 'absolute' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  panel: {
    background: '#1a1a2e',
    border: '1px solid #3a3a5a',
    borderRadius: 8,
    padding: '24px 32px',
    minWidth: 320,
    color: '#ccc',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#88ccff',
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 16,
  },
  label: {
    color: '#aaa',
    minWidth: 100,
  },
  slider: {
    flex: 1,
    accentColor: '#88ccff',
  },
  value: {
    minWidth: 36,
    textAlign: 'right' as const,
    color: '#88ccff',
  },
  closeBtn: {
    display: 'block',
    margin: '16px auto 0',
    padding: '6px 24px',
    background: '#3a3a5a',
    color: '#ccc',
    border: '1px solid #5a5a7a',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: 14,
  },
};

export function AvdSettingsPanel({ settings, onChange, onClose }: Props) {
  const set = useCallback(
    (partial: Partial<AvdSettingsData>) => onChange({ ...settings, ...partial }),
    [settings, onChange],
  );

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.title}>⚙ 设置</div>

        <div style={styles.row}>
          <span style={styles.label}>BGM 音量</span>
          <input
            style={styles.slider}
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.bgmVolume * 100)}
            onChange={(e) => set({ bgmVolume: Number(e.target.value) / 100 })}
          />
          <span style={styles.value}>{Math.round(settings.bgmVolume * 100)}%</span>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>SFX 音量</span>
          <input
            style={styles.slider}
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.sfxVolume * 100)}
            onChange={(e) => set({ sfxVolume: Number(e.target.value) / 100 })}
          />
          <span style={styles.value}>{Math.round(settings.sfxVolume * 100)}%</span>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>文字速度</span>
          <input
            style={styles.slider}
            type="range"
            min={5}
            max={200}
            step={5}
            value={settings.textSpeed}
            onChange={(e) => set({ textSpeed: Number(e.target.value) })}
          />
          <span style={styles.value}>{settings.textSpeed}</span>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>自动延迟</span>
          <input
            style={styles.slider}
            type="range"
            min={500}
            max={8000}
            step={500}
            value={settings.autoModeDelay}
            onChange={(e) => set({ autoModeDelay: Number(e.target.value) })}
          />
          <span style={styles.value}>{(settings.autoModeDelay / 1000).toFixed(1)}s</span>
        </div>

        <button style={styles.closeBtn} onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  );
}
