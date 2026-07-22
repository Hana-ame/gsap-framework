import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HA21_LINES } from '../../scripts';

export function ComponentExHA21DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HA21 教皇敗北',
      lines: HA21_LINES,
      getBgKeys: () => HA21_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHA21DomDisplay.head = {
  title: 'HA21 教皇敗北',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
