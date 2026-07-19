import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, gsap, makeButton, type SubCanvasProxy } from '../../framework';

export function ComponentFiltersDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const panel = root.createRegion(
        { x: 12, y: 12, width: 160, height: window.innerHeight - 24 },
        { dragMode: 'none' },
      );

      const canvas = root.createRegion(
        { x: 180, y: 12, width: window.innerWidth - 192, height: window.innerHeight - 24 },
        { dragMode: 'none' },
      );

      const content = new PIXI.Container();
      content.eventMode = 'none';
      canvas.stage.addChild(content);

      const bg = new PIXI.Graphics()
        .rect(0, 0, canvas.bounds.width, canvas.bounds.height)
        .fill({ color: 0x0a0a14 });
      content.addChild(bg);

      const cx = canvas.bounds.width / 2;
      const cy = canvas.bounds.height / 2;

      const shapes = new PIXI.Container();
      shapes.eventMode = 'none';

      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 100 + Math.random() * 60;
        const g = new PIXI.Graphics();
        const color = [0xff4488, 0x4488ff, 0x44ff88, 0xffaa44, 0xff44ff, 0x44ffff][i % 6];
        const size = 20 + Math.random() * 30;
        g.circle(0, 0, size).fill({ color, alpha: 0.7 });
        g.x = cx + Math.cos(angle) * radius;
        g.y = cy + Math.sin(angle) * radius;
        shapes.addChild(g);

        gsap.to(g, {
          x: cx + Math.cos(angle + Math.PI) * radius,
          y: cy + Math.sin(angle + Math.PI) * radius,
          duration: 2 + Math.random() * 2,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });
      }

      const centerG = new PIXI.Graphics()
        .star(cx, cy, 6, 60, 30)
        .fill({ color: 0x88aaff, alpha: 0.6 });
      shapes.addChild(centerG);
      gsap.to(centerG, { rotation: Math.PI * 2, duration: 6, repeat: -1, ease: 'none' });

      const waveText = new PIXI.Text({
        text: 'FILTERS',
        style: { fontSize: 40, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      waveText.anchor.set(0.5);
      waveText.x = cx;
      waveText.y = cy;
      shapes.addChild(waveText);

      content.addChild(shapes);

      const status = new PIXI.Text({
        text: 'filter: none',
        style: { fontSize: 12, fill: 0x88aacc, fontFamily: 'monospace' },
      });
      status.x = 12;
      status.y = canvas.bounds.height - 24;
      canvas.stage.addChild(status);

      const blurFilter = new PIXI.BlurFilter({ strength: 8 });
      const colorMatrix = new PIXI.ColorMatrixFilter();
      const noiseFilter = new PIXI.NoiseFilter({ noise: 0.3 });

      function setFilter(filter: PIXI.Filter | null) {
        shapes.filters = filter ? [filter] : null;
        status.text = `filter: ${filter ? filter.constructor.name.replace('Filter', '').toLowerCase() : 'none'}`;
      }

      panel.stage.addChild(makeButton('none', 140, 28, () => setFilter(null), 0x1a1a2e));
      panel.stage.addChild(makeButton('blur', 140, 28, () => setFilter(blurFilter), 0x2a3a4a));
      panel.stage.addChild(makeButton('noise', 140, 28, () => setFilter(noiseFilter), 0x3a4a3a));
      panel.stage.addChild(makeButton('grayscale', 140, 28, () => {
        colorMatrix.reset();
        colorMatrix.grayscale(0.3, false);
        setFilter(colorMatrix);
      }, 0x4a4a4a));
      panel.stage.addChild(makeButton('sepia', 140, 28, () => {
        colorMatrix.reset();
        colorMatrix.sepia(false);
        setFilter(colorMatrix);
      }, 0x5a4a3a));
      panel.stage.addChild(makeButton('invert', 140, 28, () => {
        colorMatrix.reset();
        colorMatrix.negative(false);
        setFilter(colorMatrix);
      }, 0x3a3a5a));
      panel.stage.addChild(makeButton('hue+', 140, 28, () => {
        colorMatrix.reset();
        colorMatrix.hue(90, false);
        setFilter(colorMatrix);
      }, 0x4a3a5a));
      panel.stage.addChild(makeButton('saturate', 140, 28, () => {
        colorMatrix.reset();
        colorMatrix.saturate(2, false);
        setFilter(colorMatrix);
      }, 0x3a5a3a));

      return () => {
        gsap.killTweensOf(shapes.children);
      };
    });

    return () => stop();
  }, []);

  return null;
}

ComponentFiltersDisplay.head = {
  title: 'PIXI Filters',
  description: 'Apply visual filters — blur, noise, grayscale, sepia, invert, hue rotate, saturate. All built-in PIXI filters.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
