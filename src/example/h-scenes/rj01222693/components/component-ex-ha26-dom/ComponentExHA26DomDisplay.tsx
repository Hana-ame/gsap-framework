import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HA26_LINES } from '../../scripts';

export function ComponentExHA26DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HA26 奉仕',
      lines: HA26_LINES,
      getBgKeys: () => HA26_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHA26DomDisplay.head = {
  title: 'HA26 奉仕',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
