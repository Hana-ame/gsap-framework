import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { HA1_LINES } from '../h-scenes/HA1Script';

export function ComponentAvdHa1DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HA1 自慰1',
      lines: HA1_LINES,
      getBgKeys: () => HA1_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdHa1DomDisplay.head = {
  title: 'HA1 自慰1 (DOM)',
  description: '旅馆自慰(通常服) · ex.moonchan.xyz · 纯 DOM',
};
