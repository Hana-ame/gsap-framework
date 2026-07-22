import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';
import { T22_INRAN_LINES } from '../h-scenes/T22InranScript';

export function ComponentAvdT22InranDisplay() {
  const elRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const p = mountDomScene({ el, lines: T22_INRAN_LINES, imageMap: IMAGE_MAP });
    return () => { p.then(fn => fn()); };
  }, []);
  return <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />;
}
ComponentAvdT22InranDisplay.head = {
  title: 'T22 胸もまれ(淫乱)',
  description: '「イルと貧乳の国」胸揉みシーン(淫乱)',
};
