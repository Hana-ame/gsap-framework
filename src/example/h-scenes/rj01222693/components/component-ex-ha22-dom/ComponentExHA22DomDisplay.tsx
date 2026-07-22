import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HA22_LINES } from '../../scripts';

export function ComponentExHA22DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HA22 教皇Wフェラ',
      lines: HA22_LINES,
      getBgKeys: () => HA22_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHA22DomDisplay.head = {
  title: 'HA22 教皇Wフェラ',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
