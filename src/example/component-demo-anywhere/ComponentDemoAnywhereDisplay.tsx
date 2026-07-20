// Example: Demo component that can be placed anywhere in the scene
import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';

export function ComponentDemoAnywhereDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });

      // dragMode: 'anywhere' — 点面板任意位置都能拖（包含方块上）
      const box = root.createRegion(
        { x: 60, y: 60, width: 260, height: 200 },
        { dragMode: 'anywhere' },
      );

      box.stage.addChild(new PIXI.Graphics()
        .rect(0, 0, 260, 200).fill({ color: 0x1a1a2e })
        .stroke({ width: 1, color: 0x446 }),
      );

      const colors = [0xff4466, 0x44ff88, 0x4488ff];
      const labels = ['', 'PIXI', ''];

      colors.forEach((c, i) => {
        const x = 20 + i * 82;
        const g = new PIXI.Graphics()
          .roundRect(0, 0, 62, 62, 6).fill({ color: c });
        g.eventMode = 'static';
        g.cursor = 'pointer';
        g.x = x;
        g.y = 30;
        box.stage.addChild(g);

        g.on('pointerdown', () => {
          g.tint = g.tint === 0xffffff ? 0x888888 : 0xffffff;
        });

        if (labels[i]) {
          const t = new PIXI.Text({
            text: labels[i],
            style: { fontSize: 14, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
          });
          t.anchor.set(0.5);
          t.x = x + 31;
          t.y = 30 + 31;
          box.stage.addChild(t);
        }
      });

      const hint = new PIXI.Text({
        text: '点任意位置拖拽  |  点击方块变色',
        style: { fontSize: 11, fill: 0x888888, fontFamily: 'monospace' },
      });
      hint.x = 20;
      hint.y = 110;
      box.stage.addChild(hint);

      return () => proxy.destroyAll();
    });
    return stop;
  }, []);

  return null;
}

ComponentDemoAnywhereDisplay.head = {
  title: 'Component: Demo Anywhere',
  description: 'Draggable SubCanvas with dragMode=anywhere — drag by clicking anywhere on the panel, including on colored blocks.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
