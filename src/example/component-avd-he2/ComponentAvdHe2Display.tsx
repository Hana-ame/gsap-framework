import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';
import { HE2_LINES } from '../h-scenes/HE2Script';

export function ComponentAvdHe2Display() {
  const elRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const p = mountDomScene({ el, lines: HE2_LINES, imageMap: IMAGE_MAP });
    return () => { p.then(fn => fn()); };
  }, []);
  return <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />;
}
ComponentAvdHe2Display.head = {
  title: 'HE2 騎乗位',
  description: '「イルと貧乳の国」HE2 H-scene: 騎乗位（Bad End 続き）',
};
