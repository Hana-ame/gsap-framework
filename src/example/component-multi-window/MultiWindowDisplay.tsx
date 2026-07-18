import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, createComponent, makeButton, type SubCanvas, type SubCanvasProxy, type Component } from '../../framework';

const COLORS = [
  0x4488ff, 0xff4488, 0x44ff88, 0xff8844, 0x8844ff,
  0x44ffff, 0xff44ff, 0xffff44, 0x88aaff, 0xff88aa,
  0xaaff88, 0xaa88ff,
];

export function MultiWindowDisplay() {
  useEffect(() => {
    const wins: Component[] = [];

    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const hint = new PIXI.Text({
        text: '12 draggable windows — drag anywhere, close via ×',
        style: { fontSize: 11, fill: 0x666688, fontFamily: 'monospace' },
      });
      hint.x = 12;
      hint.y = 12;
      root.stage.addChild(hint);

      const countText = new PIXI.Text({
        text: 'windows: 12',
        style: { fontSize: 11, fill: 0x888888, fontFamily: 'monospace' },
      });
      countText.x = 12;
      countText.y = 30;
      root.stage.addChild(countText);

      for (let i = 0; i < 12; i++) {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = 60 + col * 200 + Math.random() * 40;
        const y = 80 + row * 180 + Math.random() * 30;

        const win = createComponent('window', {
          parent: root,
          title: `Window ${i + 1}`,
          x, y,
          width: 180,
          height: 140,
          closable: true,
          onClose: () => {
            const idx = wins.indexOf(win);
            if (idx >= 0) wins.splice(idx, 1);
            countText.text = `windows: ${wins.length}`;
          },
        });

        const bg = new PIXI.Graphics()
          .roundRect(10, 30, 160, 100, 4)
          .fill({ color: COLORS[i], alpha: 0.15 });
        bg.eventMode = 'none';
        win.stage.addChild(bg);

        const label = new PIXI.Text({
          text: `window #${i + 1}`,
          style: { fontSize: 11, fill: COLORS[i], fontFamily: 'monospace' },
        });
        label.x = 16;
        label.y = 46;
        label.eventMode = 'none';
        win.stage.addChild(label);

        wins.push(win);
      }

      const btn = makeButton('+ add window', 130, 28, () => {
        const i = wins.length;
        const x = 60 + Math.random() * 400;
        const y = 80 + Math.random() * 300;
        const win = createComponent('window', {
          parent: root,
          title: `Window ${i + 1}`,
          x, y,
          width: 180,
          height: 140,
          closable: true,
          onClose: () => {
            const idx = wins.indexOf(win);
            if (idx >= 0) wins.splice(idx, 1);
            countText.text = `windows: ${wins.length}`;
          },
        });
        const label = new PIXI.Text({
          text: `window #${i + 1}`,
          style: { fontSize: 11, fill: 0x88aaff, fontFamily: 'monospace' },
        });
        label.x = 16;
        label.y = 46;
        label.eventMode = 'none';
        win.stage.addChild(label);
        wins.push(win);
        countText.text = `windows: ${wins.length}`;
      }, 0x1a2a3a);
      btn.x = 12;
      btn.y = root.bounds.height - 38;
      root.stage.addChild(btn);
    });

    return () => {
      wins.forEach(w => w.destroy());
      stop();
    };
  }, []);

  return null;
}

MultiWindowDisplay.head = {
  title: 'Multi-Window Stress Test',
  description: '12+ draggable windows via createComponent("window") — test drag smoothness and z-order.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
