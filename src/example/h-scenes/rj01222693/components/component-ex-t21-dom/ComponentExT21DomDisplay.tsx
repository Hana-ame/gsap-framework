import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { T21_LINES } from '../../scripts';

export function ComponentExT21DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'T21 対魔忍',
      lines: T21_LINES,
      getBgKeys: () => T21_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExT21DomDisplay.head = {
  title: 'T21 対魔忍',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
