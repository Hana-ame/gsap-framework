import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';
import { HA2_LINES } from '../h-scenes/HA2Script';

export function ComponentAvdHa2Display() {
  const elRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const p = mountDomScene({ el, lines: HA2_LINES, imageMap: IMAGE_MAP });
    return () => { p.then(fn => fn()); };
  }, []);
  return <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />;
}
ComponentAvdHa2Display.head = {
  title: 'HA2 オナニー2',
  description: '「イルと貧乳の国」宿屋オナニーシーン',
};
