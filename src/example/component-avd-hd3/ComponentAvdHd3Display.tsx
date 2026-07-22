import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';
import { HD3_LINES } from '../h-scenes/rj01222693/scripts';

export function ComponentAvdHd3Display() {
  const elRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const p = mountDomScene({ el, lines: HD3_LINES, imageMap: IMAGE_MAP });
    return () => { p.then(fn => fn()); };
  }, []);
  return <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />;
}
ComponentAvdHd3Display.head = {
  title: 'HD3 騎乗位',
  description: '「イルと貧乳の国」チパイスキー回想(騎乗位/メイド服)',
};
