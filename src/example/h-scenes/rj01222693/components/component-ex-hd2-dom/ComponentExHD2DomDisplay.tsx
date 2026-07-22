import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HD2_LINES } from '../../scripts';

export function ComponentExHD2DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HD2 ファタ堕ち',
      lines: HD2_LINES,
      getBgKeys: () => HD2_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHD2DomDisplay.head = {
  title: 'HD2 ファタ堕ち',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
