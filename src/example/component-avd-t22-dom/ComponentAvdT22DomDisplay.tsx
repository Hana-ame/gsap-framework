import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { T22_LINES } from '../h-scenes/T22Script';

export function ComponentAvdT22DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'T22 胸揉',
      lines: T22_LINES,
      getBgKeys: () => T22_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdT22DomDisplay.head = {
  title: 'T22 胸揉 (DOM)',
  description: '西区胸揉(色情服) · ex.moonchan.xyz · 纯 DOM',
};
