import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';

const DRAG_HANDLE_LABEL = 'subcanvas-drag-handle';

export function ComponentDemoDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      // 0. 全屏根 region
      const root = proxy.createRegion({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });

      // 1. 创建可拖拽的 SubCanvas —— 用 'title' 模式，手动加 drag handle
      const box = root.createRegion(
        { x: 60, y: 60, width: 260, height: 200 },
        { dragMode: 'title' },
      );

      // 2. 背景 Graphics 本身作为 drag handle —— 必须用 box.addChild 而非 box.stage.addChild
      const bg = new PIXI.Graphics()
        .rect(0, 0, 260, 200).fill({ color: 0x1a1a2e })
        .stroke({ width: 1, color: 0x446 });
      bg.eventMode = 'static';
      bg.cursor = 'move';
      bg.label = DRAG_HANDLE_LABEL;
      box.addChild(bg);

      // 3. 三个彩色方块，其中一个带文字
      const colors = [0xff4466, 0x44ff88, 0x4488ff];
      const labels = ['', 'PIXI', ''];

      colors.forEach((c, i) => {
        const x = 20 + i * 82;
        const g = new PIXI.Graphics()
          .roundRect(0, 0, 62, 62, 6).fill({ color: c });
        g.eventMode = 'static';
        g.cursor = 'pointer';
        g.x = x;
        g.y = 30;
        box.stage.addChild(g);

        g.on('pointerdown', () => {
          g.tint = g.tint === 0xffffff ? 0x888888 : 0xffffff;
        });

        if (labels[i]) {
          const t = new PIXI.Text({
            text: labels[i],
            style: { fontSize: 14, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
          });
          t.anchor.set(0.5);
          t.x = x + 31;
          t.y = 30 + 31;
          box.stage.addChild(t);
        }
      });

      // 4. 底部提示文字
      const hint = new PIXI.Text({
        text: '拖拽背景移动  |  点击方块变色',
        style: { fontSize: 11, fill: 0x888888, fontFamily: 'monospace' },
      });
      hint.x = 20;
      hint.y = 110;
      box.stage.addChild(hint);

      return () => proxy.destroyAll();
    });
    return stop;
  }, []);

  return null;
}

ComponentDemoDisplay.head = {
  title: 'Component: Demo',
  description: 'Draggable SubCanvas with colored blocks, text, and click-tint interaction. No title bar, no close button.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
