import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';
import { getTexture, preloadPromise } from '../h-scenes/imageMap';
import { HD2_LINES } from '../h-scenes/HD2Script';

const BG_KEYS = HD2_LINES.filter(l => l.bgKey).map(l => l.bgKey!);

export function StepHd201SpriteDisplay() {
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

      function showImage(key: string) {
        const tex = getTexture(key);
        sprite.texture = tex;
        const tw = sprite.width || tex.width;
        const th = sprite.height || tex.height;
        if (tw > 0 && th > 0) {
          const s = Math.min(W / tw, H / th);
          sprite.scale.set(s);
        }
        label.text = `${idxRef.current + 1}/${BG_KEYS.length} ${key}`;
      }

      let loaded = false;
      preloadPromise.then(() => { loaded = true; showImage(BG_KEYS[0]); });

      region.stage.eventMode = 'static';
      region.stage.cursor = 'pointer';
      region.stage.on('pointerdown', () => {
        if (!loaded) return;
        idxRef.current = (idxRef.current + 1) % BG_KEYS.length;
        showImage(BG_KEYS[idxRef.current]);
      });
    });

    return stop;
  }, []);

  return null;
}

StepHd201SpriteDisplay.head = {
  title: 'HD2 Step 01: Sprite',
  description: 'Texture.from + cover 模式 + 点击切换 HD2 CG',
};
