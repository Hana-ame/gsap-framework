import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, gsap, makeInfoPanel, type SubCanvasProxy } from '../../framework';

const STAR_LAYERS = 4;
const STARS_PER_LAYER = 80;

export function ComponentStarfieldDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      makeInfoPanel(root, { title: '星空', lines: ['用途：3D星空模拟——星星向观察者飞来', '测试方法：观察星空，调整星星数量和速度', '预期效果：星星从中心向观察者飞来，产生视差效果，密度和速度可调'], x: window.innerWidth - 400, y: window.innerHeight - 150 });

      const W = window.innerWidth;
      const H = window.innerHeight;

      const layers: { container: PIXI.Container; speed: number; stars: PIXI.Graphics[] }[] = [];

      for (let l = 0; l < STAR_LAYERS; l++) {
        const container = new PIXI.Container();
        container.eventMode = 'none';
        root.stage.addChild(container);
        const speed = 0.2 + l * 0.4;
        const alpha = 0.2 + l * 0.2;
        const sizeRange = [1, 2 + l * 1.5];
        const stars: PIXI.Graphics[] = [];

        for (let i = 0; i < STARS_PER_LAYER; i++) {
          const g = new PIXI.Graphics();
          const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
          g.circle(0, 0, size);
          const gray = 0x666688 + Math.floor(Math.random() * 0x999999);
          g.fill({ color: gray, alpha });
          g.x = Math.random() * W;
          g.y = Math.random() * H;
          g.eventMode = 'none';
          container.addChild(g);
          stars.push(g);

          if (l >= 2) {
            gsap.to(g, {
              pixi: { alpha: 0.1 },
              duration: 0.5 + Math.random() * 1.5,
              yoyo: true,
              repeat: -1,
              ease: 'sine.inOut',
              delay: Math.random() * 2,
            });
          }
        }

        layers.push({ container, speed, stars });
      }

      const title = new PIXI.Text({
        text: 'starfield',
        style: { fontSize: 14, fill: 0x666888, fontFamily: 'monospace' },
      });
      title.x = 12;
      title.y = 12;
      root.stage.addChild(title);

      let mouseX = W / 2;
      let mouseY = H / 2;
      root.onMove((e) => {
        mouseX = e.x;
        mouseY = e.y;
      });

      const ticker = proxy.ticker;
      const tickFn = () => {
        for (const layer of layers) {
          const dx = (mouseX - W / 2) * layer.speed * 0.005;
          const dy = (mouseY - H / 2) * layer.speed * 0.005;
          for (const g of layer.stars) {
            g.x -= dx;
            g.y -= dy;
            if (g.x < 0) g.x += W;
            if (g.x > W) g.x -= W;
            if (g.y < 0) g.y += H;
            if (g.y > H) g.y -= H;
          }
        }
      };
      ticker.add(tickFn);

      return () => {
        ticker.remove(tickFn);
      };
    });

    return () => stop();
  }, []);

  return null;
}

ComponentStarfieldDisplay.head = {
  title: 'Starfield',
  description: 'Parallax starfield with 4 depth layers — mouse parallax, twinkling stars, wrap-around scrolling.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
