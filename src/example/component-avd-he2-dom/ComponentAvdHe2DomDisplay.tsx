import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { HE2_LINES } from '../h-scenes/HE2Script';

export function ComponentAvdHe2DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HE2 骑乘位',
      lines: HE2_LINES,
      getBgKeys: () => HE2_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdHe2DomDisplay.head = {
  title: 'HE2 骑乘位 (DOM)',
  description: '欧派斯基败北结局 · ex.moonchan.xyz · 纯 DOM',
};
