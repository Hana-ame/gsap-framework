import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';

const URL = 'https://p.sda1.dev/33/9946a5972dbcd00852a679fa0f159fe1/HD2-1.webp';

export function Img07SpriteFromDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const region = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const label = new PIXI.Text({
        text: 'Step 07: Sprite.from(url) — testing\u2026',
        style: { fontSize: 18, fill: 0xffcc44, fontFamily: 'monospace' },
      });
      label.x = 20; label.y = 20;
      region.stage.addChild(label);

      try {
        const sprite = PIXI.Sprite.from(URL);
        if (!sprite.texture || sprite.texture === PIXI.Texture.EMPTY) {
          label.text = 'Step 07: FAILED — Sprite.from returned empty texture';
        } else {
          sprite.anchor.set(0.5);
          sprite.x = W / 2; sprite.y = H / 2;
          const s = Math.min(W / 800, H / 612);
          sprite.scale.set(s);
          region.stage.addChild(sprite);
          label.text = 'Step 07: Sprite.from(url) — OK (unexpected)';
        }
      } catch (e) {
        label.text = `Step 07: FAILED — ${e}`;
      }
    });
    return () => stop();
  }, []);
  return null;
}

Img07SpriteFromDisplay.head = {
  title: 'Img 07: Sprite.from(url)',
  description: 'PIXI.Sprite.from(url) — 预期失败（v8 只查缓存）',
};
