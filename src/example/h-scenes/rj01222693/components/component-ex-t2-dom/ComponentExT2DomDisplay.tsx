import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { T2_LINES } from '../../scripts';

export function ComponentExT2DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'T2 詩保',
      lines: T2_LINES,
      getBgKeys: () => T2_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExT2DomDisplay.head = {
  title: 'T2 詩保',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
