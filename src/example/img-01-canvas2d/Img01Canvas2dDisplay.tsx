import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';

const URL = 'https://p.sda1.dev/33/9946a5972dbcd00852a679fa0f159fe1/HD2-1.webp';

export function Img01Canvas2dDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const region = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const label = new PIXI.Text({
        text: 'Step 01: Canvas2D drawImage — loading\u2026',
        style: { fontSize: 18, fill: 0xffcc44, fontFamily: 'monospace' },
      });
      label.x = 20; label.y = 20;
      region.stage.addChild(label);

      const canvas = document.createElement('canvas');
      canvas.width = 800; canvas.height = 612;
      const ctx = canvas.getContext('2d')!;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 800, 612);
        const tex = PIXI.Texture.from(canvas);
        const sprite = new PIXI.Sprite(tex);
        sprite.anchor.set(0.5);
        sprite.x = W / 2; sprite.y = H / 2;
        const s = Math.min(W / 800, H / 612);
        sprite.scale.set(s);
        region.stage.addChild(sprite);
        label.text = 'Step 01: Canvas2D drawImage — OK';
      };
      img.onerror = () => { label.text = 'Step 01: FAILED — img load error'; };
      img.src = URL;
    });
    return () => stop();
  }, []);
  return null;
}

Img01Canvas2dDisplay.head = {
  title: 'Img 01: Canvas2D',
  description: 'HTMLImage → Canvas2D drawImage → PIXI.Texture.from(canvas)',
};
