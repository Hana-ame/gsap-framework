import { useState, useRef } from 'react';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';

const KEYS = Object.keys(IMAGE_MAP);
const style: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed', inset: 0, background: '#000',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  img: {
    maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
    display: 'block',
  },
  label: {
    position: 'fixed', top: 12, left: 12, zIndex: 10,
    color: '#fc4', font: '20px monospace',
    background: 'rgba(0,0,0,.6)', padding: '4px 10px', borderRadius: 4,
  },
};

export function StepMc05DomDisplay() {
  const idxRef = useRef(0);
  const [key, setKey] = useState(KEYS[0]);

  return (
    <div style={style.root} onClick={() => {
      idxRef.current = (idxRef.current + 1) % KEYS.length;
      setKey(KEYS[idxRef.current]);
    }}>
      <div style={style.label}>{idxRef.current + 1}/{KEYS.length} {key}</div>
      <img style={style.img} src={IMAGE_MAP[key]} alt={key} />
    </div>
  );
}

StepMc05DomDisplay.head = {
  title: 'MC Step 05: DOM Image',
  description: '纯 DOM <img>，无 PixiJS，无 CORS 问题',
};
