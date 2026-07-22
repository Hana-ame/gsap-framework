import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { HD2_LINES } from '../h-scenes/HD2Script';

export function ComponentAvdHd2DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HD2 正常位',
      lines: HD2_LINES,
      getBgKeys: () => HD2_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdHd2DomDisplay.head = {
  title: 'HD2 正常位 (DOM)',
  description: '城2F欧派斯基回想(正常位/女仆服) · ex.moonchan.xyz · 纯 DOM',
};
