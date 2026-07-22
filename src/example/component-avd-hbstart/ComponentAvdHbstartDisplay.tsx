import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';
import { HB_START_LINES } from '../h-scenes/HBStartScript';

export function ComponentAvdHbstartDisplay() {
  const elRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const p = mountDomScene({ el, lines: HB_START_LINES, imageMap: IMAGE_MAP });
    return () => { p.then(fn => fn()); };
  }, []);
  return <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />;
}
ComponentAvdHbstartDisplay.head = {
  title: 'HB開始',
  description: '「イルと貧乳の国」忠誠オナニー開始',
};
