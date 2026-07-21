import { useEffect, useRef } from 'react';
import { DomContainer } from '../../avd/dom/DomNode';
import { DomDialogueBox } from '../../avd/dom/DomDialogueBox';
import { DomText } from '../../avd/dom/DomNode';

export function Step02DomDialogueDisplay() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const root = new DomContainer();
    root.el.style.position = 'relative';
    root.el.style.width = '100%';
    root.el.style.height = '100%';
    el.appendChild(root.el);

    const db = new DomDialogueBox(root, {
      boxX: 40,
      boxY: 300,
      boxWidth: 800,
      boxHeight: 180,
      boxRadius: 10,
      boxPadding: 20,
      boxBg: 0x0a0a14,
      boxBgAlpha: 0.88,
      nameColor: 0x88aaff,
      nameSize: 15,
      fontFamily: 'serif',
      arrowColor: 0x88aaff,
    });

    db.setSpeaker('Narrator');

    const t = new DomText({
      text: '夜色笼罩着古老的小镇。你站在岔路口前。',
      style: { fontFamily: 'serif', fontSize: 18, fill: '#d8d8e8', wordWrapWidth: 760 },
    });
    t.x = 0;
    t.y = 0;
    const tc = new DomContainer();
    tc.addChild(t);
    db.setTextContainer(tc);

    return () => { db.destroy(); root.destroy(); };
  }, []);

  return (
    <div
      ref={rootRef}
      style={{ position: 'fixed', inset: 0, background: '#111122' }}
    />
  );
}

Step02DomDialogueDisplay.head = {
  title: 'Step 02: DomDialogueBox',
  description: '对话框 + DomText — 背景可见，文本一次性显示',
};
