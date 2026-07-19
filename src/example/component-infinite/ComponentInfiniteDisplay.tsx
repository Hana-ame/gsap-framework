import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, InfiniteCanvas, makeButton, type SubCanvas, type SubCanvasProxy } from '../../framework';
import type { Chunk } from '../../framework';

const COLORS = [0x1a2a3a, 0x2a1a3a, 0x1a3a2a, 0x3a2a1a, 0x3a1a2a, 0x2a3a1a];

export function ComponentInfiniteDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const CHUNK = 300;
      const ic = new InfiniteCanvas({
        parent: root,
        viewport: root.bounds,
        chunkSize: CHUNK,
        preloadMargin: 2,
        chunkCreate: (chunk: Chunk) => {
          const g = new PIXI.Graphics();
          const idx = (((chunk.cx * 7 + chunk.cy * 13) % COLORS.length) + COLORS.length) % COLORS.length;
          g.rect(0, 0, CHUNK, CHUNK).fill({ color: COLORS[idx], alpha: 0.5 });
          g.stroke({ width: 1, color: 0x3a4a5a, alpha: 0.3 });
          const t = new PIXI.Text({
            text: `${chunk.cx},${chunk.cy}`,
            style: { fontSize: 14, fill: 0x88aacc, fontFamily: 'monospace' },
          });
          t.x = 8;
          t.y = 8;
          chunk.container.addChild(g, t);

          const hc = CHUNK / 2;
          for (let i = 0; i < 4; i++) {
            const dot = new PIXI.Graphics()
              .circle(hc + i * 60 - 90, hc, 4)
              .fill({ color: 0x66ccff, alpha: 0.6 });
            chunk.container.addChild(dot);
          }
        },
        chunkDestroy: (chunk: Chunk) => {
          chunk.container.destroy({ children: true });
        },
        decelerate: true,
        minZoom: 0.3,
        maxZoom: 5,
        onDrag: (wx, wy) => { coordText.text = `world: (${wx.toFixed(0)}, ${wy.toFixed(0)})`; },
      });

      const coordText = new PIXI.Text({
        text: `world: (${ic.worldX.toFixed(0)}, ${ic.worldY.toFixed(0)})`,
        style: { fontSize: 12, fill: 0x88aacc, fontFamily: 'monospace' },
      });
      coordText.x = 12;
      coordText.y = 12;
      root.stage.addChild(coordText);

      const zoomText = new PIXI.Text({
        text: 'zoom: 1.0x',
        style: { fontSize: 12, fill: 0x88aacc, fontFamily: 'monospace' },
      });
      zoomText.x = 12;
      zoomText.y = 30;
      root.stage.addChild(zoomText);

      const addBtn = (label: string, x: number, onClick: () => void) => {
        const btn = makeButton(label, 80, 26, onClick, 0x1a1a2e);
        btn.x = x;
        btn.y = root.bounds.height - 38;
        root.stage.addChild(btn);
      };

      addBtn('+ zoom', 12, () => {
        ic.setZoom(ic.zoom * 1.4, root.bounds.width / 2, root.bounds.height / 2);
        zoomText.text = `zoom: ${ic.zoom.toFixed(1)}x`;
      });
      addBtn('- zoom', 100, () => {
        ic.setZoom(ic.zoom / 1.4, root.bounds.width / 2, root.bounds.height / 2);
        zoomText.text = `zoom: ${ic.zoom.toFixed(1)}x`;
      });
      addBtn('1x', 188, () => {
        ic.setZoom(1, root.bounds.width / 2, root.bounds.height / 2);
        zoomText.text = 'zoom: 1.0x';
      });
      addBtn('reset', 276, () => {
        ic.centerOn(0, 0);
        ic.setZoom(1, root.bounds.width / 2, root.bounds.height / 2);
        zoomText.text = 'zoom: 1.0x';
      });
    });

    return () => stop();
  }, []);

  return null;
}

ComponentInfiniteDisplay.head = {
  title: 'InfiniteCanvas',
  description: 'Zoomable infinite canvas with chunked grid — drag to pan, buttons to zoom.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
