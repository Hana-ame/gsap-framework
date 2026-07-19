import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, TXT } from '../../framework';
import { mountDisplays } from '../_shared/Displays';

export function SingleDisplay() {
  useEffect(() => {
    const displayCleanups: (() => void)[] = [];
    let cleanupResize: (() => void) | null = null;

    const destroy = startPixiApp((proxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const title = new PIXI.Text({
        text: 'single window — full viewport',
        style: TXT.heading,
      });
      title.x = 12;
      title.y = 12;
      root.stage.addChild(title);

      displayCleanups.push(mountDisplays(root));

      cleanupResize = proxy.onWindowResize(() => {
        root.setBounds({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
      });
    });

    return () => {
      cleanupResize?.();
      displayCleanups.forEach((c) => c());
      destroy();
    };
  }, []);

  return null;
}

SingleDisplay.head = {
  title: 'Single Canvas — sim',
  description: 'Full viewport PIXI canvas — mouse crosshair + click ripple + counter.',
  meta: [
    { name: 'theme-color', content: '#0a0a14' },
  ],
};
