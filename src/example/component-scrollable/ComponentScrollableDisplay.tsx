import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas, type SubCanvasProxy } from '../../framework';
import { createScrollable, type Scrollable } from '../../components';

function fillVertical(sc: SubCanvas) {
  const scroll = createScrollable(sc, {
    width: 260,
    height: 300,
    direction: 'vertical',
    scrollbar: true,
  });
  const colors = [0x88aaff, 0xff88aa, 0xaaff88, 0xffff88, 0x88ffff, 0xff88ff];
  for (let i = 0; i < 50; i++) {
    const row = new PIXI.Container();
    const bg = new PIXI.Graphics()
      .roundRect(0, 0, 244, 20, 4)
      .fill({ color: colors[i % colors.length], alpha: 0.15 });
    bg.eventMode = 'none';
    row.addChild(bg);
    const t = new PIXI.Text({
      text: `${i + 1}. the quick brown fox jumps over the lazy dog`,
      style: { fontSize: 11, fill: 0xdddddd, fontFamily: 'monospace' },
    });
    t.x = 8;
    t.y = 3;
    t.eventMode = 'none';
    row.addChild(t);
    row.y = i * 24;
    scroll.content.addChild(row);
  }
  scroll.recalc();
  return scroll;
}

function fillHorizontal(sc: SubCanvas) {
  const scroll = createScrollable(sc, {
    width: 300,
    height: 90,
    direction: 'horizontal',
    scrollbar: true,
  });
  const colors = [0xff5555, 0x55ff55, 0x5555ff, 0xffff55, 0xff55ff, 0x55ffff, 0xff8800, 0x8800ff];
  for (let i = 0; i < 20; i++) {
    const card = new PIXI.Container();
    const bg = new PIXI.Graphics().roundRect(0, 0, 64, 64, 6).fill({ color: colors[i % colors.length] });
    bg.eventMode = 'none';
    card.addChild(bg);
    const t = new PIXI.Text({
      text: `${i + 1}`,
      style: { fontSize: 16, fill: 0x000000, fontFamily: 'monospace', fontWeight: 'bold' },
    });
    t.x = 26;
    t.y = 22;
    t.eventMode = 'none';
    card.addChild(t);
    card.x = i * 72;
    card.y = 10;
    scroll.content.addChild(card);
  }
  scroll.recalc();
  return scroll;
}

function fillNoScrollbar(sc: SubCanvas) {
  const scroll = createScrollable(sc, {
    width: 260,
    height: 100,
    direction: 'vertical',
    scrollbar: false,
  });
  for (let i = 0; i < 30; i++) {
    const t = new PIXI.Text({
      text: `item ${i + 1} — wheel or drag to scroll, no scrollbar visible`,
      style: { fontSize: 11, fill: 0xaaaaaa, fontFamily: 'monospace' },
    });
    t.x = 8;
    t.y = i * 20;
    t.eventMode = 'none';
    scroll.content.addChild(t);
  }
  scroll.recalc();
  return scroll;
}

export function ComponentScrollableDisplay() {
  const scrollsRef = useRef<Scrollable[]>([]);

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const sc = proxy.createRegion({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const mkLabel = (text: string, x: number, y: number) => {
        const t = new PIXI.Text({
          text,
          style: { fontSize: 11, fill: 0x888888, fontFamily: 'monospace' },
        });
        t.x = x;
        t.y = y;
        t.eventMode = 'none';
        sc.stage.addChild(t);
      };

      mkLabel('vertical (scrollbar: true) — 50 lines, drag or wheel', 60, 44);
      const vPanel = sc.createSubRegion({ x: 60, y: 64, width: 260, height: 300 });
      scrollsRef.current.push(fillVertical(vPanel));

      mkLabel('horizontal (scrollbar: true) — 20 cards', 360, 44);
      const hPanel = sc.createSubRegion({ x: 360, y: 64, width: 300, height: 90 });
      scrollsRef.current.push(fillHorizontal(hPanel));

      mkLabel('vertical (scrollbar: false) — 30 items', 60, 384);
      const nPanel = sc.createSubRegion({ x: 60, y: 404, width: 260, height: 100 });
      scrollsRef.current.push(fillNoScrollbar(nPanel));

      const api = new PIXI.Text({
        text: 'createScrollable(parent, { w, h, direction, scrollbar, accept })\nscrollTo(x,y) / scrollBy(dx,dy) / recalc()',
        style: { fontSize: 10, fill: 0x666666, fontFamily: 'monospace', lineHeight: 16 },
      });
      api.x = 360;
      api.y = 170;
      api.eventMode = 'none';
      sc.stage.addChild(api);
    });
    return () => {
      scrollsRef.current.forEach((s) => s.destroy());
      stop();
    };
  }, []);

  return null;
}

ComponentScrollableDisplay.head = {
  title: 'subcanvas — Scrollable',
  description: 'Showcase: createScrollable() with wheel, drag, touch, scrollbar.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
