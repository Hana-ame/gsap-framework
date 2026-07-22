import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { HG1_LINES } from '../h-scenes/HG1Script';

export function ComponentAvdHg1DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HG1 乱交',
      lines: HG1_LINES,
      getBgKeys: () => HG1_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdHg1DomDisplay.head = {
  title: 'HG1 乱交 (DOM)',
  description: '居民结局 · ex.moonchan.xyz · 纯 DOM',
};
