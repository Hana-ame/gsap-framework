import { useEffect, useRef } from 'react';
import { DomLayer } from '../../avd/render/DomLayer';
import { DomTypingEngine } from '../../avd/dom/DomTypingEngine';

export function Step04DomLayerDisplay() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const W = 900;
    const H = 500;

    const layer = new DomLayer(el, W, H);

    // Dialogue box via layer factory
    const db = layer.createDialogueBox(layer.root, {
      boxX: 40, boxY: 300, boxWidth: 820, boxHeight: 180,
      boxRadius: 10, boxPadding: 20,
      boxBg: 0x0a0a14, boxBgAlpha: 0.88,
      nameColor: 0x88aaff, nameSize: 15,
      fontFamily: 'serif', arrowColor: 0x88aaff,
    });
    db.setSpeaker('Narrator');

    // Typing engine via layer factory
    const engine = layer.createTypingEngine() as DomTypingEngine;
    const container = engine.start(
      '夜色笼罩着古老的小镇。你站在岔路口前。',
      40,
      { fontFamily: 'serif', fontSize: 18, fill: '#d8d8e8', wordWrapWidth: 780, lineHeight: 25 },
      780,
      25,
    );
    db.setTextContainer(container);

    // Manual tick loop
    let rafId: number;
    const tick = () => {
      engine.update(16);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      engine.destroy();
      db.destroy();
      layer.destroy();
    };
  }, []);

  return (
    <div ref={rootRef} style={{ position: 'fixed', inset: 0, background: '#111122' }} />
  );
}

Step04DomLayerDisplay.head = {
  title: 'Step 04: DomLayer',
  description: 'DomLayer 工厂方法 — 通过 IRenderLayer 创建组件',
};
