import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { HB1_LINES } from '../h-scenes/HB1Script';

export function ComponentAvdHb1DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HB1 忠诚自慰1',
      lines: HB1_LINES,
      getBgKeys: () => HB1_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdHb1DomDisplay.head = {
  title: 'HB1 忠诚自慰1 (DOM)',
  description: '忠诚自慰(通常服) · ex.moonchan.xyz · 纯 DOM',
};
