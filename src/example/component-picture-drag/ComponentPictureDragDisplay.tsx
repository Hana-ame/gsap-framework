import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '../../framework';

const IMG_URL = 'https://proxy.moonchan.xyz/mw2000/007Y7SRMly1idrdc5nzp2j310o1m2agv.jpg?proxy_host=wx4.sinaimg.cn&proxy_referer=https%3A%2F%2Fweibo.com%2F';

export function ComponentPictureDragDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      // instruction
      const hint = new PIXI.Text({
        text: 'drag anywhere to move  |  click to report position',
        style: { fontSize: 12, fill: 0x666666, fontFamily: 'monospace' },
      });
      hint.x = 16;
      hint.y = 16;
      hint.eventMode = 'none';
      root.stage.addChild(hint);

      // coordinate display (fixed on screen)
      const info = new PIXI.Text({
        text: 'click on the picture...',
        style: { fontSize: 13, fill: 0x88aaff, fontFamily: 'monospace' },
      });
      info.x = 16;
      info.y = H - 40;
      info.eventMode = 'none';
      root.stage.addChild(info);

      // draggable SubCanvas with a picture
      const PIC_W = 400;
      const PIC_H = 300;
      const pic = root.createSubRegion(
        { x: (W - PIC_W) / 2, y: (H - PIC_H) / 2, width: PIC_W, height: PIC_H },
        { dragMode: 'anywhere', dragBringToFront: true },
      );

      // border
      const border = new PIXI.Graphics()
        .rect(0, 0, PIC_W, PIC_H)
        .stroke({ width: 1, color: 0x3a3a4a });
      border.eventMode = 'none';
      pic.stage.addChild(border);

      // image
      let sprite: PIXI.Sprite | null = null;
      const imgLayer = new PIXI.Container();
      imgLayer.eventMode = 'none';
      pic.stage.addChild(imgLayer);

      const load = () => {
        PIXI.Assets.load({ src: IMG_URL }).then((texture: PIXI.Texture) => {
          if (pic.destroyed) return;
          if (!texture || texture.width === 0 || texture.height === 0) return;
          if (sprite) { imgLayer.removeChild(sprite); sprite.destroy(); }
          sprite = new PIXI.Sprite(texture);
          sprite.eventMode = 'none';
          const scale = Math.min(PIC_W / texture.width, PIC_H / texture.height, 1);
          sprite.width = texture.width * scale;
          sprite.height = texture.height * scale;
          sprite.x = (PIC_W - sprite.width) / 2;
          sprite.y = (PIC_H - sprite.height) / 2;
          imgLayer.addChild(sprite);
        }).catch(() => {});
      };
      load();

      // click indicator dot (inside SubCanvas — moves with it)
      const dot = new PIXI.Graphics();
      dot.eventMode = 'none';
      dot.visible = false;
      pic.stage.addChild(dot);

      const showDot = (x: number, y: number) => {
        dot.clear();
        dot.circle(x, y, 5).fill({ color: 0xff4444, alpha: 0.7 });
        dot.circle(x, y, 10).fill({ color: 0xff4444, alpha: 0.15 });
        dot.visible = true;
      };

      // click — AABB routing, does not interfere with PIXI drag handle
      pic.onPress((e) => {
        const pos = { x: e.x, y: e.y };
        info.text = `clicked at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`;
        showDot(pos.x, pos.y);
        proxy.bus.emit('picture:click', pos);
      });

      const unsub = proxy.bus.on('picture:click', () => {
        // bus available for external hooks
      });

      return () => {
        unsub();
        if (sprite) { imgLayer.removeChild(sprite); sprite.destroy(); }
        pic.destroy();
      };
    });
    return stop;
  }, []);

  return null;
}

ComponentPictureDragDisplay.head = {
  title: 'subcanvas — Draggable Picture',
  description: 'Single draggable SubCanvas with image, click position reported via EventBus.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
