/** Demo: WindowBorder resize + LayoutGroup auto-layout — gown.js patterns applied. */
import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas, type SubCanvasProxy } from '@framework';
import { makeInfoPanel } from '@components';
import { createWindow, type GameWindow } from '../../components';
import { LayoutGroup } from '../../framework/utils/LayoutGroup';
import { WindowBorder } from '../../framework/utils/WindowBorder';

const BTN_W = 80;
const BTN_H = 28;

function makeBtn(label: string, color: number, onClick: () => void): PIXI.Container {
  const c = new PIXI.Container();
  c.eventMode = 'static';
  c.cursor = 'pointer';
  const g = new PIXI.Graphics().roundRect(0, 0, BTN_W, BTN_H, 4).fill(color).stroke({ color: 0x4a4a66, width: 1 });
  c.addChild(g);
  const t = new PIXI.Text({ text: label, style: { fontSize: 11, fill: 0xffffff, fontFamily: 'monospace' } });
  t.x = (BTN_W - t.width) / 2;
  t.y = (BTN_H - t.height) / 2;
  c.addChild(t);
  c.hitArea = new PIXI.Rectangle(0, 0, BTN_W, BTN_H);
  c.on('pointerdown', (e) => { e.stopPropagation(); onClick(); });
  return c;
}

export function ComponentWindowRefDisplay() {
  useEffect(() => {
    let win: GameWindow | null = null;

    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      makeInfoPanel(root, {
        title: '参考框架模式验证',
        lines: [
          'gown.js invalidation: WindowBorder._dirty + onResize relayout',
          'gown.js LayoutGroup: addChild 设脏 → onRender 自动排列',
          '边框/背景/标题栏在 resize 后正确重绘',
        ],
        x: W - 420, y: H - 160,
      });

      win = createWindow({
        parent: root,
        title: '参考框架 — WindowBorder + LayoutGroup',
        x: 80, y: 60,
        width: 460, height: 360,
        dragMode: 'anywhere',
        borderWidth: 2,
        borderColor: 0x4a7aff,
        cornerRadius: 8,
        closable: false,
      });

      const group = new LayoutGroup({ direction: 'vertical', gap: 8, padding: 12 });

      const sizes = [
        { w: 300, h: 60, c: 0x2a3a5a }, { w: 0, h: 48, c: 0x1a2a3a }, { w: 360, h: 60, c: 0x3a2a4a },
      ];
      for (const { w, h, c } of sizes) {
        const box = new PIXI.Graphics().roundRect(0, 0, w || 400, h, 6).fill(c);
        box.eventMode = 'none';
        group.addChild(box, w || 400, h);
      }

      const statusText = new PIXI.Text({
        text: `size: ${win.bounds.width}×${win.bounds.height}`,
        style: { fontSize: 11, fill: 0x88aaff, fontFamily: 'monospace' },
      });
      statusText.eventMode = 'none';

      const btnRow = new LayoutGroup({ direction: 'horizontal', gap: 8, alignment: 'center' });
      btnRow.addChild(makeBtn('+宽 +高', 0x2a4a3a, () => {
        win?.setSize(win.bounds.width + 40, win.bounds.height + 30);
        statusText.text = `size: ${win!.bounds.width}×${win!.bounds.height}`;
      }));
      btnRow.addChild(makeBtn('-宽 -高', 0x4a2a2a, () => {
        win?.setSize(Math.max(200, win.bounds.width - 40), Math.max(200, win.bounds.height - 30));
        statusText.text = `size: ${win!.bounds.width}×${win!.bounds.height}`;
      }));
      btnRow.addChild(makeBtn('复位', 0x2a2a4a, () => {
        win?.setSize(460, 360);
        statusText.text = `size: ${win!.bounds.width}×${win!.bounds.height}`;
      }));

      win.stage.addChild(group.stage);
      group.stage.y = 60;
      win.stage.addChild(statusText);
      statusText.x = 12;
      statusText.y = win.bounds.height - 24;
      win.onResize(() => {
        if (win && !win.destroyed) {
          statusText.text = `size: ${win.bounds.width}×${win.bounds.height}`;
          statusText.y = win.bounds.height - 24;
        }
      });

      const borderDemo = new WindowBorder({
        width: 260, height: 160,
        borderWidth: 3,
        borderColor: 0x88dd88,
        cornerRadius: 12,
        fillAlpha: 0.3,
      });
      borderDemo.bg.x = W - 300;
      borderDemo.bg.y = H - 240;
      root.stage.addChild(borderDemo.bg);

      const demoLabel = new PIXI.Text({
        text: '独立 WindowBorder\n独立测试边框绘制',
        style: { fontSize: 11, fill: 0x88dd88, fontFamily: 'monospace', align: 'center' },
      });
      demoLabel.x = W - 300 + 130 - demoLabel.width / 2;
      demoLabel.y = H - 240 + 80 - demoLabel.height / 2;
      root.stage.addChild(demoLabel);

      let borderW = 260;
      let borderH = 160;
      const resizeBorder = () => {
        borderW += 10;
        borderH += 6;
        if (borderW > 400) { borderW = 260; borderH = 160; }
        borderDemo.resize(borderW, borderH);
      };
      const borderBtn = makeBtn('resize 边框', 0x2a4a3a, resizeBorder);
      borderBtn.x = W - 300;
      borderBtn.y = H - 240 + 165;
      root.stage.addChild(borderBtn);
    });

    return () => {
      win?.destroy();
      stop();
    };
  }, []);

  return null;
}

ComponentWindowRefDisplay.head = {
  title: 'framework — WindowRef',
  description: 'Verify: WindowBorder resize + LayoutGroup auto-layout from gown.js patterns.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
