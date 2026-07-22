import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HE1_LINES } from '../../scripts';

export function ComponentExHE1DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HE1 忠誠ガウも',
      lines: HE1_LINES,
      getBgKeys: () => HE1_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHE1DomDisplay.head = {
  title: 'HE1 忠誠ガウも',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
