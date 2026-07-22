import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HD1_LINES } from '../../scripts';

export function ComponentExHD1DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HD1 HD1',
      lines: HD1_LINES,
      getBgKeys: () => HD1_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHD1DomDisplay.head = {
  title: 'HD1 HD1',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
