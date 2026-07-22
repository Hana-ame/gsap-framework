import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HB24_LINES } from '../../scripts';

export function ComponentExHB24DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HB24 洗脳',
      lines: HB24_LINES,
      getBgKeys: () => HB24_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHB24DomDisplay.head = {
  title: 'HB24 洗脳',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
