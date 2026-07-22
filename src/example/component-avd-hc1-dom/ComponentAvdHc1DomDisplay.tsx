import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { HC1_LINES } from '../h-scenes/HC1Script';

export function ComponentAvdHc1DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HC1 窥视',
      lines: HC1_LINES,
      getBgKeys: () => HC1_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdHc1DomDisplay.head = {
  title: 'HC1 窥视 (DOM)',
  description: '西区窥视(色情服) · ex.moonchan.xyz · 纯 DOM',
};
