import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, makeButton, type SubCanvasProxy } from '../../framework';

const COLORS = [0xffffff, 0xff4488, 0x4488ff, 0x44ff88, 0xffaa44, 0xff44ff, 0x44ffff];
const BRUSH_SIZES = [2, 4, 8, 16];

export function ComponentDrawingDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const toolPanel = root.createRegion(
        { x: 12, y: 12, width: 200, height: window.innerHeight - 24 },
        { dragMode: 'none' },
      );

      const canvas = root.createRegion(
        { x: 220, y: 12, width: window.innerWidth - 232, height: window.innerHeight - 24 },
        { dragMode: 'none' },
      );

      let brushColor = 0xffffff;
      let brushSize = 4;
      let drawing = false;
      let lastX = 0;
      let lastY = 0;

      const strokes: PIXI.Graphics[] = [];
      let currentStroke: PIXI.Graphics | null = null;

      const bg = new PIXI.Graphics()
        .rect(0, 0, canvas.bounds.width, canvas.bounds.height)
        .fill({ color: 0x0a0a14 });
      bg.eventMode = 'none';
      canvas.stage.addChild(bg);

      let y = 4;

      const colorTitle = new PIXI.Text({
        text: 'colors',
        style: { fontSize: 11, fill: 0x666888, fontFamily: 'monospace' },
      });
      colorTitle.x = 10;
      colorTitle.y = y;
      toolPanel.stage.addChild(colorTitle);
      y += 20;

      for (const c of COLORS) {
        const btn = new PIXI.Container();
        const g = new PIXI.Graphics()
          .roundRect(0, 0, 40, 28, 6)
          .fill({ color: c, alpha: 0.92 });
        g.stroke({ width: 1.5, color: brushColor === c ? 0xffffff : 0x446 });
        btn.addChild(g);
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        btn.hitArea = new PIXI.Rectangle(0, 0, 40, 28);
        btn.on('pointerdown', () => { brushColor = c; });
        btn.x = 10 + (COLORS.indexOf(c) % 4) * 46;
        btn.y = y;
        toolPanel.stage.addChild(btn);
      }
      y += 38;

      const sizeTitle = new PIXI.Text({
        text: 'brush size',
        style: { fontSize: 11, fill: 0x666888, fontFamily: 'monospace' },
      });
      sizeTitle.x = 10;
      sizeTitle.y = y;
      toolPanel.stage.addChild(sizeTitle);
      y += 20;

      for (const s of BRUSH_SIZES) {
        const btn = new PIXI.Container();
        const g = new PIXI.Graphics()
          .roundRect(0, 0, 40, 28, 6)
          .fill({ color: 0x1a1a2e, alpha: 0.92 });
        g.stroke({ width: 1.5, color: brushSize === s ? 0xffffff : 0x446 });
        btn.addChild(g);
        const dot = new PIXI.Graphics()
          .circle(20, 14, s / 2)
          .fill({ color: 0xaaaacc });
        btn.addChild(dot);
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        btn.hitArea = new PIXI.Rectangle(0, 0, 40, 28);
        btn.on('pointerdown', () => { brushSize = s; });
        btn.x = 10 + (BRUSH_SIZES.indexOf(s) % 4) * 46;
        btn.y = y;
        toolPanel.stage.addChild(btn);
      }
      y += 38;

      const clearBtn = makeButton('clear all', 180, 30, () => {
        for (const s of strokes) {
          canvas.stage.removeChild(s);
          s.destroy({ children: true });
        }
        strokes.length = 0;
        currentStroke = null;
      }, 0x4a3a2e);
      clearBtn.x = 10;
      clearBtn.y = y;
      toolPanel.stage.addChild(clearBtn);
      y += 40;

      const undoBtn = makeButton('undo stroke', 180, 30, () => {
        const last = strokes.pop();
        if (last) {
          canvas.stage.removeChild(last);
          last.destroy({ children: true });
        }
        currentStroke = null;
      }, 0x2a3a4a);
      undoBtn.x = 10;
      undoBtn.y = y;
      toolPanel.stage.addChild(undoBtn);
      y += 40;

      const hint = new PIXI.Text({
        text: 'draw with mouse / touch',
        style: { fontSize: 11, fill: 0x556688, fontFamily: 'monospace' },
      });
      hint.x = 10;
      hint.y = y;
      toolPanel.stage.addChild(hint);

      canvas.onPress((e) => {
        drawing = true;
        lastX = e.x;
        lastY = e.y;
        currentStroke = new PIXI.Graphics();
        currentStroke.eventMode = 'none';
        canvas.stage.addChild(currentStroke);
      });

      canvas.onMove((e) => {
        if (!drawing || !currentStroke) return;
        currentStroke
          .moveTo(lastX, lastY)
          .lineTo(e.x, e.y)
          .stroke({ width: brushSize, color: brushColor, alpha: 0.9, cap: 'round', join: 'round' });
        lastX = e.x;
        lastY = e.y;
      });

      canvas.onRelease(() => {
        drawing = false;
        if (currentStroke) strokes.push(currentStroke);
        currentStroke = null;
      });

      return () => {};
    });

    return () => stop();
  }, []);

  return null;
}

ComponentDrawingDisplay.head = {
  title: 'Drawing App',
  description: 'Freehand drawing on PIXI canvas — color palette, brush sizes, clear all, undo stroke. Pointer events demo.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
