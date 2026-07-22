import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';
import { HD2_LINES } from '../h-scenes/rj01222693/scripts';

export function ComponentAvdHd2Display() {
  const elRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const p = mountDomScene({ el, lines: HD2_LINES, imageMap: IMAGE_MAP });
    return () => { p.then(fn => fn()); };
  }, []);
  return <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />;
}
ComponentAvdHd2Display.head = {
  title: 'HD2 城2F チパイスキー回想',
  description: '「イルと貧乳の国」HD2 H-scene: 正常位（チパイスキー回想）',
};
