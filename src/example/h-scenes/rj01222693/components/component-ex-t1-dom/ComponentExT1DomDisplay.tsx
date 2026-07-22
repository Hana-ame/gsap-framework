import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { T1_LINES } from '../../scripts';

export function ComponentExT1DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'T1 有理紗',
      lines: T1_LINES,
      getBgKeys: () => T1_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExT1DomDisplay.head = {
  title: 'T1 有理紗',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
