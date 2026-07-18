import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas, type SubCanvasProxy } from '../../framework';
import { createClickableImage, createFullscreenManager, type ClickableImage } from '../../components';

const IMAGES = [
  { url: 'https://proxy.moonchan.xyz/mw2000/007Y7SRMly1idrdc5nzp2j310o1m2agv.jpg?proxy_host=wx4.sinaimg.cn&proxy_referer=https%3A%2F%2Fweibo.com%2F', label: 'A' },
  { url: 'https://proxy.moonchan.xyz/mw690/6dd57921ly1idq2o0vvfhj210m1eyh9o.jpg?proxy_host=wx4.sinaimg.cn&proxy_referer=https://weibo.com', label: 'B' },
  { url: 'https://proxy.moonchan.xyz/mw690/007Y7SRMly1idr2li19y1j30hh0v4wnu.jpg?proxy_host=wx4.sinaimg.cn&proxy_referer=https://weibo.com', label: 'C' },
  { url: 'https://proxy.moonchan.xyz/mw2000/e6eae37cly1idonyj0nbuj20pw0u0qa7.jpg?proxy_host=wx3.sinaimg.cn&proxy_referer=https://weibo.com', label: 'D' },
];

const THUMB = 180;
const GAP = 16;
const COLS = 4;

export function ComponentClickableImageDisplay() {
  const scRef = useRef<SubCanvas | null>(null);
  const imgsRef = useRef<ClickableImage[]>([]);

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const sc = proxy.createRegion({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      scRef.current = sc;

      const header = new PIXI.Text({
        text: 'ClickableImage — click: expand to full viewport · click again: return to thumb',
        style: { fontSize: 14, fill: 0x88aaff, fontFamily: 'monospace' },
      });
      header.x = GAP;
      header.y = 12;
      header.eventMode = 'none';
      sc.stage.addChild(header);

      const fm = createFullscreenManager(proxy);

      const startX = GAP;
      const startY = 50;
      const allImgs: ClickableImage[] = [];
      IMAGES.forEach((img, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = startX + col * (THUMB + GAP);
        const y = startY + row * (THUMB + GAP + 20);

        const label = new PIXI.Text({
          text: img.label,
          style: { fontSize: 11, fill: 0x888888, fontFamily: 'monospace' },
        });
        label.x = x;
        label.y = y + THUMB + 4;
        label.eventMode = 'none';
        sc.stage.addChild(label);

        const panel = sc.createRegion({ x, y, width: THUMB, height: THUMB });
        const ci = createClickableImage(panel, proxy.bus, {
          url: img.url,
          x: 0,
          y: 0,
          width: THUMB,
          height: THUMB,
        });
        allImgs.push(ci);
      });
      imgsRef.current = allImgs;

      return () => {
        allImgs.forEach((img) => img.destroy());
        fm.destroy();
      };
    });
    return stop;
  }, []);

  return null;
}

ComponentClickableImageDisplay.head = {
  title: 'subcanvas — ClickableImage',
  description: 'Showcase: createClickableImage() click/zoom/drag with animation.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
