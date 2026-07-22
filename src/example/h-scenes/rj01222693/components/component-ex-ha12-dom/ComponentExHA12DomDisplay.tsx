import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HA12_LINES } from '../../scripts';

export function ComponentExHA12DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HA12 詩保洗脳失敗オナニー',
      lines: HA12_LINES,
      getBgKeys: () => HA12_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHA12DomDisplay.head = {
  title: 'HA12 詩保洗脳失敗オナニー',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
