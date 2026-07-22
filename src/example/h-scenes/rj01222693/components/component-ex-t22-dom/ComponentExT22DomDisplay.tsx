import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { T22_LINES } from '../../scripts';

export function ComponentExT22DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'T22 対魔忍',
      lines: T22_LINES,
      getBgKeys: () => T22_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExT22DomDisplay.head = {
  title: 'T22 対魔忍',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
