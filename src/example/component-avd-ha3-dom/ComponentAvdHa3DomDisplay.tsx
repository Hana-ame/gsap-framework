import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { HA3_LINES } from '../h-scenes/HA3Script';

export function ComponentAvdHa3DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HA3 自慰3',
      lines: HA3_LINES,
      getBgKeys: () => HA3_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdHa3DomDisplay.head = {
  title: 'HA3 自慰3 (DOM)',
  description: '旅馆自慰 · ex.moonchan.xyz · 纯 DOM',
};
