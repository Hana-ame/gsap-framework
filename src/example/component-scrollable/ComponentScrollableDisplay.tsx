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
  for (let i = 0; i < 40; i++) {
    const t = new PIXI.Text({
      text: `line ${i + 1}: the quick brown fox jumps over the lazy dog`,
      style: { fontSize: 12, fill: 0xdddddd, fontFamily: 'monospace' },
    });
    t.x = 8;
    t.y = i * 22;
    scroll.content.addChild(t);
  }
  scroll.recalc();
  return scroll;
}

function fillHorizontal(sc: SubCanvas) {
  const scroll = createScrollable(sc, {
    width: 300,
    height: 80,
    direction: 'horizontal',
    scrollbar: true,
  });
  const colors = [0xff5555, 0x55ff55, 0x5555ff, 0xffff55, 0xff55ff, 0x55ffff, 0xff8800, 0x8800ff];
  for (let i = 0; i < 16; i++) {
    const g = new PIXI.Graphics().roundRect(0, 0, 64, 64, 6).fill({ color: colors[i % colors.length] });
    g.x = i * 72;
    g.y = 8;
    scroll.content.addChild(g);
    const t = new PIXI.Text({
      text: `${i + 1}`,
      style: { fontSize: 14, fill: 0x000000, fontFamily: 'monospace', fontWeight: 'bold' },
    });
    t.x = i * 72 + 26;
    t.y = 24;
    scroll.content.addChild(t);
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
  for (let i = 0; i < 20; i++) {
    const t = new PIXI.Text({
      text: `item ${i + 1} — no scrollbar, wheel/drag only`,
      style: { fontSize: 11, fill: 0xaaaaaa, fontFamily: 'monospace' },
    });
    t.x = 8;
    t.y = i * 20;
    scroll.content.addChild(t);
  }
  scroll.recalc();
  return scroll;
}

export function ComponentScrollableDisplay() {
  const scRef = useRef<SubCanvas | null>(null);
  const scrollsRef = useRef<Scrollable[]>([]);

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
        text: 'Scrollable — wheel / drag / touch',
        style: { fontSize: 14, fill: 0x88aaff, fontFamily: 'monospace' },
      });
      header.x = 60;
      header.y = 12;
      header.eventMode = 'none';
      sc.stage.addChild(header);

      const vLabel = new PIXI.Text({
        text: 'vertical (scrollbar: true)',
        style: { fontSize: 11, fill: 0x888888, fontFamily: 'monospace' },
      });
      vLabel.x = 60;
      vLabel.y = 44;
      vLabel.eventMode = 'none';
      sc.stage.addChild(vLabel);

      const vPanel = sc.createSubRegion({ x: 60, y: 64, width: 260, height: 300 });
      scrollsRef.current.push(fillVertical(vPanel));

      const hLabel = new PIXI.Text({
        text: 'horizontal (scrollbar: true)',
        style: { fontSize: 11, fill: 0x888888, fontFamily: 'monospace' },
      });
      hLabel.x = 360;
      hLabel.y = 44;
      hLabel.eventMode = 'none';
      sc.stage.addChild(hLabel);

      const hPanel = sc.createSubRegion({ x: 360, y: 64, width: 300, height: 80 });
      scrollsRef.current.push(fillHorizontal(hPanel));

      const nLabel = new PIXI.Text({
        text: 'vertical (scrollbar: false)',
        style: { fontSize: 11, fill: 0x888888, fontFamily: 'monospace' },
      });
      nLabel.x = 60;
      nLabel.y = 384;
      nLabel.eventMode = 'none';
      sc.stage.addChild(nLabel);

      const nPanel = sc.createSubRegion({ x: 60, y: 404, width: 260, height: 100 });
      scrollsRef.current.push(fillNoScrollbar(nPanel));

      const apiLabel = new PIXI.Text({
        text: 'createScrollable(parent, { w, h, direction, scrollbar, accept })\nscrollTo(x,y) / scrollBy(dx,dy) / recalc()',
        style: { fontSize: 10, fill: 0x666666, fontFamily: 'monospace', lineHeight: 16 },
      });
      apiLabel.x = 360;
      apiLabel.y = 160;
      apiLabel.eventMode = 'none';
      sc.stage.addChild(apiLabel);
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
