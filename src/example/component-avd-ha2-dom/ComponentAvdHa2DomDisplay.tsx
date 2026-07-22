import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { HA2_LINES } from '../h-scenes/HA2Script';

export function ComponentAvdHa2DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HA2 自慰2',
      lines: HA2_LINES,
      getBgKeys: () => HA2_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdHa2DomDisplay.head = {
  title: 'HA2 自慰2 (DOM)',
  description: '旅馆自慰 · ex.moonchan.xyz · 纯 DOM',
};
