import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { HD3_LINES } from '../h-scenes/HD3Script';

export function ComponentAvdHd3DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HD3 骑乘位',
      lines: HD3_LINES,
      getBgKeys: () => HD3_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdHd3DomDisplay.head = {
  title: 'HD3 骑乘位 (DOM)',
  description: '城2F欧派斯基回想(骑乘位/女仆服) · ex.moonchan.xyz · 纯 DOM',
};
