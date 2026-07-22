import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HB23_LINES } from '../../scripts';

export function ComponentExHB23DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HB23 セイレア',
      lines: HB23_LINES,
      getBgKeys: () => HB23_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHB23DomDisplay.head = {
  title: 'HB23 セイレア',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
