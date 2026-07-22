import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';

const URL = 'https://p.sda1.dev/33/9946a5972dbcd00852a679fa0f159fe1/HD2-1.webp';

export function Img06TextureFromCachedDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const region = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const label = new PIXI.Text({
        text: 'Step 06: Assets.load → Texture.from — loading\u2026',
        style: { fontSize: 18, fill: 0xffcc44, fontFamily: 'monospace' },
      });
      label.x = 20; label.y = 20;
      region.stage.addChild(label);

      PIXI.Assets.load(URL).then(() => {
        const tex = PIXI.Texture.from(URL);
        if (!tex || tex === PIXI.Texture.EMPTY) {
          label.text = 'Step 06: FAILED — Texture.from returned empty';
          return;
        }
        const sprite = new PIXI.Sprite(tex);
        sprite.anchor.set(0.5);
        sprite.x = W / 2; sprite.y = H / 2;
        const s = Math.min(W / 800, H / 612);
        sprite.scale.set(s);
        region.stage.addChild(sprite);
        label.text = 'Step 06: Assets.load → Texture.from — OK';
      }).catch((e) => {
        label.text = `Step 06: FAILED — ${e}`;
      });
    });
    return () => stop();
  }, []);
  return null;
}

Img06TextureFromCachedDisplay.head = {
  title: 'Img 06: Texture.from (cached)',
  description: 'Assets.load → Texture.from(url) — 缓存命中后使用',
};
