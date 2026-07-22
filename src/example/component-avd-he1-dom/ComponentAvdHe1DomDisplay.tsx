import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { HE1_LINES } from '../h-scenes/HE1Script';

export function ComponentAvdHe1DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HE1 洗脑',
      lines: HE1_LINES,
      getBgKeys: () => HE1_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdHe1DomDisplay.head = {
  title: 'HE1 洗脑 (DOM)',
  description: '洗脑结局 · ex.moonchan.xyz · 纯 DOM',
};
