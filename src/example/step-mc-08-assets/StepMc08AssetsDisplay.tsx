import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Assets } from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';

const KEYS = Object.keys(IMAGE_MAP);
const texCache = new Map<string, PIXI.Texture>();

export function StepMc08AssetsDisplay() {
  const idxRef = useRef(0);

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const region = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      sprite.anchor.set(0.5);
      sprite.x = W / 2;
      sprite.y = H / 2;
      region.stage.addChild(sprite);

      const label = new PIXI.Text({
        text: '',
        style: { fontSize: 20, fill: 0xffcc44, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      label.x = 20; label.y = 20;
      region.stage.addChild(label);

      Assets.load<PIXI.Texture>(IMAGE_MAP[KEYS[0]]).then((tex) => {
        texCache.set(KEYS[0], tex);
        showImage(KEYS[0]);
      });

      function showImage(key: string) {
        const tex = texCache.get(key) ?? PIXI.Texture.EMPTY;
        sprite.texture = tex;
        const tw = sprite.width || tex.width;
        const th = sprite.height || tex.height;
        if (tw > 0 && th > 0) {
          const s = Math.min(W / tw, H / th);
          sprite.scale.set(s);
        }
        label.text = `${idxRef.current + 1}/${KEYS.length} ${key}`;
      }

      region.stage.eventMode = 'static';
      region.stage.cursor = 'pointer';
      region.stage.on('pointerdown', () => {
        idxRef.current = (idxRef.current + 1) % KEYS.length;
        const k = KEYS[idxRef.current];
        const p = texCache.has(k)
          ? Promise.resolve()
          : Assets.load<PIXI.Texture>(IMAGE_MAP[k]).then((t) => { texCache.set(k, t); });
        p.then(() => showImage(k));
      });
    });

    return stop;
  }, []);

  return null;
}

StepMc08AssetsDisplay.head = {
  title: 'MC Step 08: Assets API',
  description: 'PixiJS Assets.load 通过 Vite proxy 加载',
};
