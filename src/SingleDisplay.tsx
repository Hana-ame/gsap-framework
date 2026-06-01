import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from './PixiApp';
import { mountDisplays } from './Displays';

export function SingleDisplay() {
  useEffect(() => {
    const displayCleanups: (() => void)[] = [];

    const destroy = startPixiApp((proxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const win = proxy.createWindow({ x: 0, y: 0, width: W, height: H });

      const title = new PIXI.Text({
        text: 'single window — full viewport',
        style: { fontSize: 14, fill: 0xffffff, fontFamily: 'monospace' },
      });
      title.x = 12;
      title.y = 12;
      win.stage.addChild(title);

      displayCleanups.push(mountDisplays(win));
    });

    return () => {
      displayCleanups.forEach((c) => c());
      destroy();
    };
  }, []);

  return null;
}
