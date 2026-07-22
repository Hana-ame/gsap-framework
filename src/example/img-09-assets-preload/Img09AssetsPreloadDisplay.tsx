import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';

const IMG_URLS = [
  'https://p.sda1.dev/33/9946a5972dbcd00852a679fa0f159fe1/HD2-1.webp',
  'https://p.sda1.dev/33/114b896a994e3f82877f530447ba3b4b/HD2-2.webp',
  'https://p.sda1.dev/33/e157d75c98fdff318c5ef2e2ddb7c734/HD2-3.webp',
  'https://p.sda1.dev/33/0baa88b4cc908dc2e43839f39efc2e97/HD2-4.webp',
  'https://p.sda1.dev/33/b191c1c6341f0a79bf8fb324eb145287/HD2-5.webp',
  'https://p.sda1.dev/33/dd922766af1d05d8ce2c45fcd0166969/HD2-6.webp',
  'https://p.sda1.dev/33/6d704be2d4c8ef956533059ff5eeb9ca/HD2-7.webp',
];

export function Img09AssetsPreloadDisplay() {
  const idxRef = useRef(0);

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const region = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const label = new PIXI.Text({
        text: 'Step 09: Assets preload all — loading 7 images\u2026',
        style: { fontSize: 18, fill: 0xffcc44, fontFamily: 'monospace' },
      });
      label.x = 20; label.y = 20;
      region.stage.addChild(label);

      const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      sprite.anchor.set(0.5);
      sprite.x = W / 2; sprite.y = H / 2;
      const s = Math.min(W / 800, H / 612);
      sprite.scale.set(s);
      region.stage.addChild(sprite);

      Promise.all(IMG_URLS.map((url) => PIXI.Assets.load(url)))
        .then(() => {
          label.text = 'Step 09: preload OK — click to cycle';
          showImage(0);
          region.stage.eventMode = 'static';
          region.stage.cursor = 'pointer';
          region.stage.on('pointerdown', () => {
            idxRef.current = (idxRef.current + 1) % IMG_URLS.length;
            showImage(idxRef.current);
          });
        })
        .catch((e) => { label.text = `Step 09: FAILED — ${e}`; });

      function showImage(i: number) {
        const tex = PIXI.Texture.from(IMG_URLS[i]);
        if (tex && tex !== PIXI.Texture.EMPTY) {
          sprite.texture = tex;
        }
      }
    });
    return () => stop();
  }, []);

  return null;
}

Img09AssetsPreloadDisplay.head = {
  title: 'Img 09: Assets.preload all',
  description: 'Promise.all(Assets.load) → Texture.from 缓存命中 → 点击切图',
};
