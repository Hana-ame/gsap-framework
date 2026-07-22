import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { T22_INRAN_LINES } from '../h-scenes/T22InranScript';

export function ComponentAvdT22InranDomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'T22 胸揉(淫乱)',
      lines: T22_INRAN_LINES,
      getBgKeys: () => T22_INRAN_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdT22InranDomDisplay.head = {
  title: 'T22 胸揉(淫乱) (DOM)',
  description: '西区胸揉(色情服/淫乱) · ex.moonchan.xyz · 纯 DOM',
};
