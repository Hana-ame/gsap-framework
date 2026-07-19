import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, textPresets, makeInfoPanel, type SubCanvasProxy } from '@framework';
import { createClickableImage, createFullscreenManager, type ClickableImage } from '../../components';

const SLOTS = [
  { url: 'https://proxy.moonchan.xyz/mw2000/007Y7SRMly1idrdc5nzp2j310o1m2agv.jpg?proxy_host=wx4.sinaimg.cn&proxy_referer=https%3A%2F%2Fweibo.com%2F', label: 'default zoom=2', overlayColor: 0x000000, overlayAlpha: 0.6, zoomFactor: 2 },
  { url: 'https://proxy.moonchan.xyz/mw690/6dd57921ly1idq2o0vvfhj210m1eyh9o.jpg?proxy_host=wx4.sinaimg.cn&proxy_referer=https://weibo.com', label: 'zoom=3, darker', overlayColor: 0x000000, overlayAlpha: 0.85, zoomFactor: 3 },
  { url: 'https://proxy.moonchan.xyz/mw690/007Y7SRMly1idr2li19y1j30hh0v4wnu.jpg?proxy_host=wx4.sinaimg.cn&proxy_referer=https://weibo.com', label: 'zoom=1.5, blue bg', overlayColor: 0x0a0a2e, overlayAlpha: 0.7, zoomFactor: 1.5 },
  { url: 'https://proxy.moonchan.xyz/mw2000/e6eae37cly1idonyj0nbuj20pw0u0qa7.jpg?proxy_host=wx3.sinaimg.cn&proxy_referer=https://weibo.com', label: 'light overlay', overlayColor: 0x888888, overlayAlpha: 0.4, zoomFactor: 2.5 },
];

const THUMB = 180;
const GAP = 16;
const COLS = 4;

export function ComponentFullscreenDisplay() {
  const imgsRef = useRef<ClickableImage[]>([]);

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const sc = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      makeInfoPanel(sc, {
        title: '全屏管理器',
        lines: [
          '用途：全屏图片查看器，支持缩放、拖拽和滑动关闭。',
          '测试方法：点击缩略图打开，双击切换缩放，缩放时拖拽，下滑或点击覆盖层关闭。',
          '预期：每个缩略图使用不同的覆盖层颜色/透明度/缩放比例设置。',
        ],
        x: window.innerWidth - 400,
        y: window.innerHeight - 150,
      });

      const header = new PIXI.Text({
        text: 'FullscreenManager — click thumb to expand, double-click to zoom, drag when zoomed, swipe down to close',
        style: { fontSize: 13, fill: 0x88aaff, fontFamily: 'monospace' },
      });
      header.x = GAP;
      header.y = 12;
      header.eventMode = 'none';
      sc.stage.addChild(header);

      const fm = createFullscreenManager(proxy);

      const startX = GAP;
      const startY = 50;
      const allImgs: ClickableImage[] = [];
      SLOTS.forEach((slot, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = startX + col * (THUMB + GAP);
        const y = startY + row * (THUMB + GAP + 20);

        const panel = sc.createRegion({ x, y, width: THUMB, height: THUMB });

        const ci = createClickableImage(panel, proxy.bus, {
          url: slot.url,
          x: 0, y: 0,
          width: THUMB, height: THUMB,
          overlayColor: slot.overlayColor,
          overlayAlpha: slot.overlayAlpha,
          zoomFactor: slot.zoomFactor,
        });
        allImgs.push(ci);

        const label = new PIXI.Text({
          text: slot.label,
          style: textPresets.dim,
        });
        label.x = x;
        label.y = y + THUMB + 4;
        label.eventMode = 'none';
        sc.stage.addChild(label);
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

ComponentFullscreenDisplay.head = {
  title: 'Component: FullscreenManager',
  description: 'Fullscreen image viewer — click thumbnail, double-click zoom, drag pan, swipe close.',
};
