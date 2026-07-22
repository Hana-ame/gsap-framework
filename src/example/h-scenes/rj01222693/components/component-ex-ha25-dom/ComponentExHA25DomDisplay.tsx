import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HA25_LINES } from '../../scripts';

export function ComponentExHA25DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HA25 詩保正常位',
      lines: HA25_LINES,
      getBgKeys: () => HA25_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHA25DomDisplay.head = {
  title: 'HA25 詩保正常位',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
