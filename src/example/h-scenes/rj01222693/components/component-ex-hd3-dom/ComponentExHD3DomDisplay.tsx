import { useEffect, useRef } from 'react';
import { mountDomScene } from '../../domSceneHelper';
import { HD3_LINES } from '../../scripts';

export function ComponentExHD3DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HD3 洗脳ガウも',
      lines: HD3_LINES,
      getBgKeys: () => HD3_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{position: 'fixed', inset: 0, background: '#000', overflow: 'hidden'}} />
  );
}

ComponentExHD3DomDisplay.head = {
  title: 'HD3 洗脳ガウも',
  description: 'RJ01222693 · ex.moonchan.xyz · 纯 DOM',
};
