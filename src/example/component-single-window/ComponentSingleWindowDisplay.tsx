import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, TXT, type SubCanvas, type SubCanvasProxy } from '../../framework';
import { createWindow, type GameWindow } from '../../components';
import { mountDisplays } from '../_shared/Displays';

export function ComponentSingleWindowDisplay() {
  useEffect(() => {
    let root: SubCanvas | null = null;
    let win: GameWindow | null = null;
    let displayCleanup: (() => void) | null = null;

    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const title = new PIXI.Text({
        text: 'single window — draggable',
        style: TXT.heading,
      });
      title.x = 12;
      title.y = 12;
      root.stage.addChild(title);

      win = createWindow({
        parent: root,
        title: 'Single Display',
        x: 60,
        y: 60,
        width: 500,
        height: 400,
        draggable: true,
        closable: true,
      });

      displayCleanup = mountDisplays(win.content);
    });

    return () => {
      displayCleanup?.();
      win?.destroy();
      stop();
    };
  }, []);

  return null;
}

ComponentSingleWindowDisplay.head = {
  title: 'Single Window — Draggable',
  description: '#single crosshair + click ripple inside a draggable window.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
