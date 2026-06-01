import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from './PixiApp';
import { mountDisplays } from './Displays';

export function MultipleDisplay() {
  useEffect(() => {
    const displayCleanups: (() => void)[] = [];

    const destroy = startPixiApp((proxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const W2 = W / 2;
      const H2 = H / 2;

      const specs: Array<{ x: number; y: number; label: string; color: number }> = [
        { x: 0, y: 0, label: 'Window 1', color: 0xff6688 },
        { x: W2, y: 0, label: 'Window 2', color: 0x66ff88 },
        { x: 0, y: H2, label: 'Window 3', color: 0x6688ff },
        { x: W2, y: H2, label: 'Window 4', color: 0xffff66 },
      ];

      specs.forEach((spec) => {
        const win = proxy.createWindow({
          x: spec.x,
          y: spec.y,
          width: W2,
          height: H2,
        });

        const border = new PIXI.Graphics();
        border
          .rect(0, 0, win.bounds.width, win.bounds.height)
          .stroke({ width: 2, color: spec.color, alpha: 0.6 });
        win.stage.addChild(border);

        const title = new PIXI.Text({
          text: spec.label,
          style: { fontSize: 18, fill: spec.color, fontFamily: 'monospace' },
        });
        title.x = 12;
        title.y = 12;
        win.stage.addChild(title);

        displayCleanups.push(mountDisplays(win));
      });
    });

    return () => {
      displayCleanups.forEach((c) => c());
      destroy();
    };
  }, []);

  return null;
}
