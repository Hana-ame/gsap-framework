import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '../../framework/PixiApp';
import { mountDisplays } from '../_shared/Displays';

export function MultipleDisplay() {
  useEffect(() => {
    const displayCleanups: (() => void)[] = [];
    let cleanupResize: (() => void) | null = null;

    const destroy = startPixiApp((proxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const colors = [0xff6688, 0x66ff88, 0x6688ff, 0xffff66];
      const cols = 2;
      const rows = 2;

      const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
      const quadrants = Array.from({ length: rows * cols }, () => root.createSubRegion({ x: 0, y: 0, width: 1, height: 1 }));

      quadrants.forEach((q, i) => {
        const color = colors[i];

        const border = new PIXI.Graphics();
        q.stage.addChild(border);

        const title = new PIXI.Text({
          text: `Window ${i + 1}`,
          style: { fontSize: 18, fill: color, fontFamily: 'monospace' },
        });
        title.x = 12;
        title.y = 12;
        q.stage.addChild(title);

        q.onResize((b) => {
          border.clear().rect(0, 0, b.width, b.height).stroke({ width: 2, color, alpha: 0.6 });
        });

        displayCleanups.push(mountDisplays(q));
      });

      const layout = (W: number, H: number) => {
        root.setBounds({ x: 0, y: 0, width: W, height: H });
        quadrants.forEach((q, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const qW = W / cols;
          const qH = H / rows;
          q.setBounds({ x: col * qW, y: row * qH, width: qW, height: qH });
        });
      };

      layout(W, H);
      cleanupResize = proxy.onWindowResize(() => layout(window.innerWidth, window.innerHeight));
    });

    return () => {
      cleanupResize?.();
      displayCleanups.forEach((c) => c());
      destroy();
    };
  }, []);

  return null;
}

MultipleDisplay.head = {
  title: 'Multiple Canvases — sim',
  description: '2x2 quadrant grid — each cell an independent PIXI sub-canvas.',
  meta: [
    { name: 'theme-color', content: '#0a0a14' },
  ],
};
