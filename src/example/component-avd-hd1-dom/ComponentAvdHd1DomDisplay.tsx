import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { HD1_LINES } from '../h-scenes/HD1Script';

export function ComponentAvdHd1DomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HD1 贫乳手交',
      lines: HD1_LINES,
      getBgKeys: () => HD1_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdHd1DomDisplay.head = {
  title: 'HD1 贫乳手交 (DOM)',
  description: '城2F欧派斯基回想(口交/女仆服) · ex.moonchan.xyz · 纯 DOM',
};
