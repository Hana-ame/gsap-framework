import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';
import { HE1_LINES } from '../h-scenes/rj01222693/scripts';

export function ComponentAvdHe1Display() {
  const elRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const p = mountDomScene({ el, lines: HE1_LINES, imageMap: IMAGE_MAP });
    return () => { p.then(fn => fn()); };
  }, []);
  return <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />;
}
ComponentAvdHe1Display.head = {
  title: 'HE1 洗脳',
  description: '「イルと貧乳の国」HE1 H-scene: 洗脳エンド（Bad End）',
};
