import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { T3_LINES } from '../../scripts';

export function ComponentExT3DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'T3 対魔忍',
      lines: T3_LINES,
      getBgKeys: () => T3_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExT3DomDisplay.head = {
  title: 'T3 対魔忍',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
