import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { HB_START_LINES } from '../h-scenes/HBStartScript';

export function ComponentAvdHbstartDomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'HB 忠诚开始',
      lines: HB_START_LINES,
      getBgKeys: () => HB_START_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

ComponentAvdHbstartDomDisplay.head = {
  title: 'HB 忠诚开始 (DOM)',
  description: '忠诚自慰开始 · ex.moonchan.xyz · 纯 DOM',
};
