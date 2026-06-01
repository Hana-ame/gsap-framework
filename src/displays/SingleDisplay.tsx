import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '../pixi/PixiApp';
import { mountDisplays } from './Displays';

export function SingleDisplay() {
  useEffect(() => {
    const displayCleanups: (() => void)[] = [];

    const destroy = startPixiApp((proxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const title = new PIXI.Text({
        text: 'single window — full viewport',
        style: { fontSize: 14, fill: 0xffffff, fontFamily: 'monospace' },
      });
      title.x = 12;
      title.y = 12;
      root.stage.addChild(title);

      displayCleanups.push(mountDisplays(root));
    });

    return () => {
      displayCleanups.forEach((c) => c());
      destroy();
    };
  }, []);

  return null;
}
