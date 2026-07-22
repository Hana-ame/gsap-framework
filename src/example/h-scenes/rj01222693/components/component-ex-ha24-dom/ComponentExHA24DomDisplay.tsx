import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HA24_LINES } from '../../scripts';

export function ComponentExHA24DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HA24 有理紗正常位',
      lines: HA24_LINES,
      getBgKeys: () => HA24_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHA24DomDisplay.head = {
  title: 'HA24 有理紗正常位',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
