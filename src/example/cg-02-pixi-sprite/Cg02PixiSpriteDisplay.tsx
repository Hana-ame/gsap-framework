import { useState, useCallback } from 'react';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';

const KEYS = ['HD2-1', 'HD2-2', 'HD2-3'];

export function Cg02PixiSpriteDisplay() {
  const [idx, setIdx] = useState(0);

  const onClick = useCallback(() => {
    setIdx(i => (i + 1) % KEYS.length);
  }, []);

  const key = KEYS[idx];

  return (
    <div onClick={onClick}
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
        color: '#88ccff', fontFamily: 'monospace', fontSize: 16,
      }}>{key} — click to cycle</span>
    </div>
  );
}

Cg02PixiSpriteDisplay.head = {
  title: 'CG 02: DOM img',
  description: 'React <img> + 点击切换 3 张 ExMoonchan CG',
};
