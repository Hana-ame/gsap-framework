import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HB21_LINES } from '../../scripts';

export function ComponentExHB21DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HB21 洗脳',
      lines: HB21_LINES,
      getBgKeys: () => HB21_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHB21DomDisplay.head = {
  title: 'HB21 洗脳',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
