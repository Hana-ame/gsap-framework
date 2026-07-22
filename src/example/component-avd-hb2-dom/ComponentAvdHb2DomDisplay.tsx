import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { HB2_LINES } from '../h-scenes/HB2Script';

export function ComponentAvdHb2DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HB2 忠诚自慰2',
      lines: HB2_LINES,
      getBgKeys: () => HB2_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdHb2DomDisplay.head = {
  title: 'HB2 忠诚自慰2 (DOM)',
  description: '忠诚自慰 · ex.moonchan.xyz · 纯 DOM',
};
