import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '../pixi/PixiApp';
import { mountDisplays } from './Displays';

export function MultipleDisplay() {
  useEffect(() => {
    const displayCleanups: (() => void)[] = [];

    const destroy = startPixiApp((proxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
      const quadrants = root.grid({ rows: 2, cols: 2 });
      const colors = [0xff6688, 0x66ff88, 0x6688ff, 0xffff66];

      quadrants.forEach((sc, i) => {
        const color = colors[i];

        const border = new PIXI.Graphics();
        border
          .rect(0, 0, sc.bounds.width, sc.bounds.height)
          .stroke({ width: 2, color, alpha: 0.6 });
        sc.stage.addChild(border);

        const title = new PIXI.Text({
          text: `Window ${i + 1}`,
          style: { fontSize: 18, fill: color, fontFamily: 'monospace' },
        });
        title.x = 12;
        title.y = 12;
        sc.stage.addChild(title);

        displayCleanups.push(mountDisplays(sc));
      });
    });

    return () => {
      displayCleanups.forEach((c) => c());
      destroy();
    };
  }, []);

  return null;
}
