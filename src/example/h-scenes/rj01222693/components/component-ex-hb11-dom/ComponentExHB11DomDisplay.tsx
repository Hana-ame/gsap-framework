import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HB11_LINES } from '../../scripts';

export function ComponentExHB11DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HB11 洗脳',
      lines: HB11_LINES,
      getBgKeys: () => HB11_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHB11DomDisplay.head = {
  title: 'HB11 洗脳',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
