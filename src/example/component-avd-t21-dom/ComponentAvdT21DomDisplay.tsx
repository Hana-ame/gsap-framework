import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { T21_LINES } from '../h-scenes/T21Script';

export function ComponentAvdT21DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'T21 胸揉',
      lines: T21_LINES,
      getBgKeys: () => T21_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdT21DomDisplay.head = {
  title: 'T21 胸揉 (DOM)',
  description: '西区胸揉(通常服) · ex.moonchan.xyz · 纯 DOM',
};
