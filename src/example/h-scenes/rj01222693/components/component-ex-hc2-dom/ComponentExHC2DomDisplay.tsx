import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HC2_LINES } from '../../scripts';

export function ComponentExHC2DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HC2 対魔忍',
      lines: HC2_LINES,
      getBgKeys: () => HC2_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHC2DomDisplay.head = {
  title: 'HC2 対魔忍',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
