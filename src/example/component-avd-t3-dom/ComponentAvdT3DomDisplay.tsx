import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { T3_LINES } from '../h-scenes/T3Script';

export function ComponentAvdT3DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'T3 性骚扰',
      lines: T3_LINES,
      getBgKeys: () => T3_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdT3DomDisplay.head = {
  title: 'T3 性骚扰 (DOM)',
  description: '胸揉+金项圈奴隶契约 · ex.moonchan.xyz · 纯 DOM',
};
