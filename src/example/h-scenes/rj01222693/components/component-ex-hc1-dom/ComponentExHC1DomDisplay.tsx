import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HC1_LINES } from '../../scripts';

export function ComponentExHC1DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HC1 対魔忍',
      lines: HC1_LINES,
      getBgKeys: () => HC1_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHC1DomDisplay.head = {
  title: 'HC1 対魔忍',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
