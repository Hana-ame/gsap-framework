import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HB12_LINES } from '../../scripts';

export function ComponentExHB12DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HB12 忠誠Wフェラ',
      lines: HB12_LINES,
      getBgKeys: () => HB12_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHB12DomDisplay.head = {
  title: 'HB12 忠誠Wフェラ',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
