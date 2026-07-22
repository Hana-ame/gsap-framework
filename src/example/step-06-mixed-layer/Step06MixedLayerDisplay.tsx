import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { DomLayer } from '../../avd/render/DomLayer';
import { DomTypingEngine } from '../../avd/dom/DomTypingEngine';

export function Step06MixedLayerDisplay() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    // === Pixi layer (back) ===
    const app = new PIXI.Application();
    let destroyed = false;
    app.init({ width: W, height: H, background: 0x0a0a20, antialias: true }).then(() => {
      if (destroyed) { app.destroy(true); return; }
      el.appendChild(app.canvas as HTMLCanvasElement);
      (app.canvas as HTMLCanvasElement).style.cssText = 'position:absolute;inset:0;z-index:0;display:block';

      const vels: Array<{ vx: number; vy: number }> = [];
      for (let i = 0; i < 12; i++) {
        const c = new PIXI.Graphics();
        c.circle(0, 0, 20 + Math.random() * 40).fill({
          color: Math.floor(Math.random() * 0xffffff),
          alpha: 0.6,
        });
        c.x = Math.random() * W;
        c.y = Math.random() * H;
        app.stage.addChild(c);
        vels.push({ vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 });
      }

      app.ticker.add(() => {
        for (let i = 0; i < app.stage.children.length; i++) {
          const g = app.stage.children[i] as PIXI.Graphics;
          g.x += vels[i].vx;
          g.y += vels[i].vy;
          if (g.x < 0 || g.x > W) vels[i].vx *= -1;
          if (g.y < 0 || g.y > H) vels[i].vy *= -1;
        }
      });
    });

    // === DOM layer (front) ===
    const layer = new DomLayer(el, W, H);
    layer.root.el.style.cssText = 'position:absolute;inset:0;z-index:1;pointer-events:none';

    const db = layer.createDialogueBox(layer.root, {
      boxX: 40, boxY: H - 200, boxWidth: W - 80, boxHeight: 170,
      boxRadius: 10, boxPadding: 20,
      boxBg: 0x0a0a14, boxBgAlpha: 0.85,
      nameColor: 0x88aaff, nameSize: 15,
      fontFamily: '"Noto Serif SC", "STSong", serif',
      arrowColor: 0x88aaff,
    });

    (db.container as any).el.style.pointerEvents = 'auto';
    db.setSpeaker('混合模式');

    const engine = layer.createTypingEngine() as DomTypingEngine;
    const text = 'Pixi 图层：12 个彩色圆在 Canvas 上弹跳渲染\nDOM 图层：本对话框 + 打字机效果\n两层通过 z-index 前后排列';
    const container = engine.start(text, 40, {
      fontFamily: '"Noto Serif SC", "STSong", serif',
      fontSize: 18,
      fill: '#d8d8e8',
      wordWrapWidth: W - 120,
      lineHeight: 28,
    }, W - 120, 28);
    db.setTextContainer(container);

    let raf: number;
    const tick = () => { engine.update(16); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      engine.destroy();
      db.destroy();
      layer.destroy();
      if (app.canvas?.parentNode) app.canvas.parentNode.removeChild(app.canvas);
      app.destroy(true, { children: true, texture: true });
    };
  }, []);

  return (
    <div ref={rootRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

Step06MixedLayerDisplay.head = {
  title: 'Step 06: Mixed Layer (DOM + Pixi)',
  description: 'Pixi 图层（canvas 弹跳圆）+ DOM 图层（对话框）前后排列',
};
