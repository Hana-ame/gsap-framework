import { useEffect, useRef } from 'react';
import { DomText } from '../../avd/dom/DomNode';

export function Step01DomTextDisplay() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const t = new DomText({
      text: '夜色笼罩着古老的小镇。',
      style: { fontFamily: 'serif', fontSize: 24, fill: '#e0e0e0' },
    });
    t.x = 40;
    t.y = 40;
    el.appendChild(t.el);

    return () => { el.removeChild(t.el); t.destroy(); };
  }, []);

  return (
    <div
      ref={rootRef}
      style={{ position: 'fixed', inset: 0, background: '#0a0a14', color: '#e0e0e0', fontFamily: 'serif', fontSize: 24, padding: 40 }}
    />
  );
}

Step01DomTextDisplay.head = {
  title: 'Step 01: DomText',
  description: 'DomText 单独渲染 — 纯文字',
};
