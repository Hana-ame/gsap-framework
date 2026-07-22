import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { HC3_LINES } from '../h-scenes/HC3Script';

export function ComponentAvdHc3DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HC3 贫乳手交',
      lines: HC3_LINES,
      getBgKeys: () => HC3_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdHc3DomDisplay.head = {
  title: 'HC3 贫乳手交 (DOM)',
  description: '西区乳交口交 · ex.moonchan.xyz · 纯 DOM',
};
