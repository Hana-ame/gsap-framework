import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, makeInfoPanel, type SubCanvasProxy } from '@framework';
import { createClickableImage, createFullscreenManager } from '../../components';

const IMAGES = [
  { url: 'https://proxy.moonchan.xyz/mw2000/007Y7SRMly1idrdc5nzp2j310o1m2agv.jpg?proxy_host=wx4.sinaimg.cn&proxy_referer=https%3A%2F%2Fweibo.com%2F', label: 'A' },
  { url: 'https://proxy.moonchan.xyz/mw690/6dd57921ly1idq2o0vvfhj210m1eyh9o.jpg?proxy_host=wx4.sinaimg.cn&proxy_referer=https://weibo.com', label: 'B' },
  { url: 'https://proxy.moonchan.xyz/mw690/007Y7SRMly1idr2li19y1j30hh0v4wnu.jpg?proxy_host=wx4.sinaimg.cn&proxy_referer=https://weibo.com', label: 'C' },
  { url: 'https://proxy.moonchan.xyz/mw2000/e6eae37cly1idonyj0nbuj20pw0u0qa7.jpg?proxy_host=wx3.sinaimg.cn&proxy_referer=https://weibo.com', label: 'D' },
];

// 16 items: 4 tiles x 4 repetitions, labels A1-D4
const ALL_IMAGES = Array.from({ length: 4 }, (_, ri) =>
  IMAGES.map((img, ci) => ({
    url: img.url,
    label: String.fromCharCode(65 + ci) + (ri + 1),
  })),
).flat();

const THUMB_W = 180;
const THUMB_H = 180;
const GAP = 16;
const COLS = 3;
const ROWS = Math.ceil(ALL_IMAGES.length / COLS);
const PANEL_W = COLS * (THUMB_W + GAP) + GAP;
const PANEL_H = 500;
const CONTENT_H = ROWS * (THUMB_H + GAP + 24) + GAP;

export function ComponentScrollableImageDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      makeInfoPanel(root, {
        title: '可滚动图片画廊',
        lines: [
          '用途：可滚动图片画廊，支持全屏查看。',
          '测试方法：纵向滚动浏览图片，点击图片进入全屏。',
          '预期效果：图片以网格形式加载，点击打开全屏查看，滚动流畅。',
        ],
        x: window.innerWidth - 400, y: window.innerHeight - 150,
      });

      const panelX = 20;
      const panelY = 60;

      // panel with clip mask — content doesn't spill outside
      const panel = root.createRegion(
        { x: panelX, y: panelY, width: PANEL_W, height: PANEL_H },
        { clipToBounds: true },
      );
      panel.stage.eventMode = 'static';
      panel.stage.hitArea = new PIXI.Rectangle(0, 0, PANEL_W, PANEL_H);

      // header
      const header = new PIXI.Text({
        text: 'Scrollable gallery — click an image for fullscreen',
        style: { fontSize: 14, fill: 0x88aaff, fontFamily: 'monospace' },
      });
      header.x = panelX;
      header.y = 16;
      header.eventMode = 'none';
      root.stage.addChild(header);

      // hints
      const hint = new PIXI.Text({
        text: 'wheel / drag to scroll  •  click to expand  •  scrollbar on right',
        style: { fontSize: 11, fill: 0x666666, fontFamily: 'monospace' },
      });
      hint.x = panelX;
      hint.y = panelY + PANEL_H + 8;
      hint.eventMode = 'none';
      root.stage.addChild(hint);

      // border around panel
      const border = new PIXI.Graphics()
        .rect(panelX, panelY, PANEL_W, PANEL_H)
        .stroke({ width: 1, color: 0x2a2a3a });
      border.eventMode = 'none';
      root.stage.addChild(border);

      // FullscreenManager singleton
      const fm = createFullscreenManager(proxy);

      // tall content SubCanvas — holds all thumbnails
      const content = panel.createRegion({
        x: 0,
        y: 0,
        width: PANEL_W,
        height: CONTENT_H,
      });

      // place thumbnails
      const imgs: ReturnType<typeof createClickableImage>[] = [];
      ALL_IMAGES.forEach((img, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = GAP + col * (THUMB_W + GAP);
        const y = GAP + row * (THUMB_H + GAP + 24);

        const tp = content.createRegion({
          x,
          y,
          width: THUMB_W,
          height: THUMB_H,
        });
        const ci = createClickableImage(tp, proxy.bus, {
          url: img.url,
          x: 0,
          y: 0,
          width: THUMB_W,
          height: THUMB_H,
        });
        imgs.push(ci);

        const label = new PIXI.Text({
          text: img.label,
          style: { fontSize: 10, fill: 0x666666, fontFamily: 'monospace' },
        });
        label.x = x;
        label.y = y + THUMB_H + 2;
        label.eventMode = 'none';
        content.stage.addChild(label);
      });

      // — scroll logic —
      const maxScroll = Math.max(0, CONTENT_H - PANEL_H);
      let scrollY = 0;

      const applyScroll = () => {
        content.setPosition(0, -scrollY);
        updateScrollbar();
      };

      // wheel
      panel.stage.on('wheel', (e: PIXI.FederatedWheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        scrollY = Math.max(0, Math.min(scrollY + e.deltaY, maxScroll));
        applyScroll();
      });

      // Fullscreen state guard — drag only when fullscreen is not active
      let fullscreenActive = false;
      const unsubShow = proxy.bus.on('fullscreen:show', () => { fullscreenActive = true; });
      const unsubHide = proxy.bus.on('fullscreen:hide', () => { fullscreenActive = false; });

      // drag — window-level pointerdown bypasses PIXI event system,
      // so it works even when starting from a clickable image
      let dragging = false;
      let dragStartGlobalY = 0;
      let dragStartScrollY = 0;

      const onWindowDown = (e: PointerEvent) => {
        if (fullscreenActive) return;
        const gb = panel.globalBounds;
        const gx = e.clientX;
        const gy = e.clientY;
        if (gx < gb.x || gx > gb.x + gb.width) return;
        if (gy < gb.y || gy > gb.y + gb.height) return;
        dragging = true;
        dragStartGlobalY = gy;
        dragStartScrollY = scrollY;
        window.addEventListener('pointermove', onWindowMove);
        window.addEventListener('pointerup', onWindowUp);
        window.addEventListener('pointercancel', onWindowUp);
      };

      const onWindowMove = (e: PointerEvent) => {
        if (!dragging) return;
        scrollY = Math.max(0, Math.min(dragStartScrollY - (e.clientY - dragStartGlobalY), maxScroll));
        applyScroll();
      };

      const onWindowUp = () => {
        if (!dragging) return;
        dragging = false;
        window.removeEventListener('pointermove', onWindowMove);
        window.removeEventListener('pointerup', onWindowUp);
        window.removeEventListener('pointercancel', onWindowUp);
      };

      window.addEventListener('pointerdown', onWindowDown);

      // scrollbar
      const scrollbar = new PIXI.Graphics();
      scrollbar.eventMode = 'none';
      root.stage.addChild(scrollbar);

      const updateScrollbar = () => {
        scrollbar.clear();
        if (maxScroll <= 0) return;
        const ratio = PANEL_H / CONTENT_H;
        const barH = Math.max(20, PANEL_H * ratio);
        const barX = panelX + PANEL_W + 4;
        const barY = panelY + (scrollY / maxScroll) * (PANEL_H - barH);
        scrollbar.roundRect(barX, barY, 4, barH, 2).fill({ color: 0xffffff, alpha: 0.3 });
      };
      updateScrollbar();

      return () => {
        imgs.forEach((img) => img.destroy());
        fm.destroy();
        window.removeEventListener('pointerdown', onWindowDown);
        window.removeEventListener('pointermove', onWindowMove);
        window.removeEventListener('pointerup', onWindowUp);
        window.removeEventListener('pointercancel', onWindowUp);
        unsubShow();
        unsubHide();
      };
    });
    return stop;
  }, []);

  return null;
}

ComponentScrollableImageDisplay.head = {
  title: 'subcanvas — Scrollable + ClickableImage',
  description: 'Showcase: clickable images in a scrollable gallery with fullscreen viewer.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
