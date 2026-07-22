import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HA23_LINES } from '../../scripts';

export function ComponentExHA23DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HA23 セイレア',
      lines: HA23_LINES,
      getBgKeys: () => HA23_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHA23DomDisplay.head = {
  title: 'HA23 セイレア',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
