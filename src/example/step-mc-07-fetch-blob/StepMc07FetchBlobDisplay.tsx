import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';

const KEYS = Object.keys(IMAGE_MAP);
const cache = new Map<string, PIXI.Texture>();

async function loadViaBlob(key: string, url: string) {
  const resp = await fetch(url);
  const blob = await resp.blob();
  const objUrl = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`fail ${url}`));
    img.src = objUrl;
  });
  const tex = PIXI.Texture.from(img);
  URL.revokeObjectURL(objUrl);
  cache.set(key, tex);
  return tex;
}

export function StepMc07FetchBlobDisplay() {
  const idxRef = useRef(0);

  useEffect(() => {
    let disposed = false;
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

      loadViaBlob(KEYS[0], IMAGE_MAP[KEYS[0]]).then(() => {
        if (disposed) return;
        showImage(KEYS[0]);
      });

      function showImage(key: string) {
        const tex = cache.get(key) ?? PIXI.Texture.EMPTY;
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
        const p = cache.has(k)
          ? Promise.resolve()
          : loadViaBlob(k, IMAGE_MAP[k]).then(() => {});
        p.then(() => { if (!disposed) showImage(k); });
      });
    });

    return () => { disposed = true; stop(); };
  }, []);

  return null;
}

StepMc07FetchBlobDisplay.head = {
  title: 'MC Step 07: Fetch + Blob',
  description: 'fetch → blob → objectURL → PixiJS，懒加载',
};
