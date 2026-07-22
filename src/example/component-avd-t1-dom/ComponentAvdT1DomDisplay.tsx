import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { T1_LINES } from '../h-scenes/T1Script';

export function ComponentAvdT1DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'T1 自慰',
      lines: T1_LINES,
      getBgKeys: () => T1_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdT1DomDisplay.head = {
  title: 'T1 自慰 (DOM)',
  description: '伊露的自慰场景 · ex.moonchan.xyz · 纯 DOM',
};
