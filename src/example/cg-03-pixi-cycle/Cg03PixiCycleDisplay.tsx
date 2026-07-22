import { useState, useCallback, useEffect } from 'react';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';

const HD2_KEYS = ['HD2-1', 'HD2-2', 'HD2-3', 'HD2-4', 'HD2-5', 'HD2-6', 'HD2-7'];
const ALL_KEYS = Object.keys(IMAGE_MAP);

export function Cg03PixiCycleDisplay() {
  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState<'hd2' | 'all'>('hd2');

  const keys = mode === 'hd2' ? HD2_KEYS : ALL_KEYS;
  const key = keys[idx % keys.length];

  const next = useCallback(() => {
    setIdx(i => (i + 1) % keys.length);
  }, [keys.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setMode(m => m === 'hd2' ? 'all' : 'hd2');
        setIdx(0);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div onClick={next}
      style={{
        position: 'fixed', inset: 0, background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}>
      <img src={IMAGE_MAP[key]}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        alt={key} />
      <span style={{
        position: 'fixed', top: 16, left: 16,
        color: '#88ccff', fontFamily: 'monospace', fontSize: 15,
      }}>{key} — {mode} ({keys.length})</span>
      <span style={{
        position: 'fixed', top: 36, left: 16,
        color: '#aaa', fontFamily: 'monospace', fontSize: 13,
      }}>click=next  [Space]=toggle mode</span>
    </div>
  );
}

Cg03PixiCycleDisplay.head = {
  title: 'CG 03: Cycle All',
  description: 'React <img> + 点击/空格切换 全量 160+ ExMoonchan CG',
};
