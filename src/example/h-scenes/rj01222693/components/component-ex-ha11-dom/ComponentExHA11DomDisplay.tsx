import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HA11_LINES } from '../../scripts';

export function ComponentExHA11DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HA11 茶羅井敗北',
      lines: HA11_LINES,
      getBgKeys: () => HA11_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHA11DomDisplay.head = {
  title: 'HA11 茶羅井敗北',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
