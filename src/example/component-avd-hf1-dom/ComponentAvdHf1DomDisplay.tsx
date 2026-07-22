import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { HF1_LINES } from '../h-scenes/HF1Script';

export function ComponentAvdHf1DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HF1 正常位',
      lines: HF1_LINES,
      getBgKeys: () => HF1_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdHf1DomDisplay.head = {
  title: 'HF1 正常位 (DOM)',
  description: '欧派斯基的奴隶结局 · ex.moonchan.xyz · 纯 DOM',
};
