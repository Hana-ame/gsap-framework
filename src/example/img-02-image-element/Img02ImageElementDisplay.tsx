import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';

const URL = 'https://p.sda1.dev/33/9946a5972dbcd00852a679fa0f159fe1/HD2-1.webp';

export function Img02ImageElementDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const region = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const label = new PIXI.Text({
        text: 'Step 02: new Image() → Texture.from(img) — loading\u2026',
        style: { fontSize: 18, fill: 0xffcc44, fontFamily: 'monospace' },
      });
      label.x = 20; label.y = 20;
      region.stage.addChild(label);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const tex = PIXI.Texture.from(img);
        const sprite = new PIXI.Sprite(tex);
        sprite.anchor.set(0.5);
        sprite.x = W / 2; sprite.y = H / 2;
        const s = Math.min(W / 800, H / 612);
        sprite.scale.set(s);
        region.stage.addChild(sprite);
        label.text = 'Step 02: new Image() → Texture.from(img) — OK';
      };
      img.onerror = () => { label.text = 'Step 02: FAILED — img load error'; };
      img.src = URL;
    });
    return () => stop();
  }, []);
  return null;
}

Img02ImageElementDisplay.head = {
  title: 'Img 02: Image Element',
  description: 'new Image() → Texture.from(HTMLImageElement)',
};
