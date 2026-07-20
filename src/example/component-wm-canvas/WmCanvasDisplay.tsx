// Example: Window manager with canvas-based rendering
import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, InfiniteCanvas, type SubCanvasProxy } from '@framework';
import { makeButton, textPresets } from '@components';
import { MockBackend, WindowManager } from '../../backend';
import { WindowManagerAdapter } from '../../adapters';

const COLORS = [0x1a2a3a, 0x2a1a3a, 0x1a3a2a, 0x3a2a1a, 0x3a1a2a, 0x2a3a1a];

export function WmCanvasDisplay() {
  useEffect(() => {
    const backend = new MockBackend();
    let wm: WindowManager | null = null;
    let wmAdapter: WindowManagerAdapter | null = null;

    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const hint = new PIXI.Text({
        text: 'WindowManagerAdapter — InfiniteCanvas inside a backend-driven window',
        style: { fontSize: 11, fill: 0x666688, fontFamily: 'monospace' },
      });
      hint.x = 12;
      hint.y = 12;
      root.stage.addChild(hint);

      const statusText = new PIXI.Text({
        text: 'status: disconnected',
        style: { fontSize: 10, fill: 0x888888, fontFamily: 'monospace' },
      });
      statusText.x = 12;
      statusText.y = 30;
      root.stage.addChild(statusText);

      backend.on('status', (s) => { statusText.text = `status: ${s}`; });

      backend.connect(300);

      wm = new WindowManager(backend);
      wmAdapter = new WindowManagerAdapter(wm, root);

      wm.on('window-opened', ({ spec }) => {
        if (spec.id !== 'ic-win') return;
        const content = wmAdapter!.getContentStage('ic-win');
        if (!content) return;

        const CHUNK = 200;
        const VW = spec.width;
        const VH = spec.height - 22;

        const coordText = new PIXI.Text({
          text: 'world: (0, 0)  zoom: 1.0x',
          style: textPresets.coord,
        });
        coordText.x = 8;
        coordText.y = 4;
        content.stage.addChild(coordText);

        const updateCoord = () => {
          coordText.text = `world: (${ic.worldX.toFixed(0)}, ${ic.worldY.toFixed(0)})  zoom: ${ic.zoom.toFixed(1)}x`;
        };

        const zoomIn = makeButton('+', 28, 24, () => {
          ic.setZoom(ic.zoom * 1.4, VW / 2, VH / 2);
          updateCoord();
        });
        zoomIn.x = VW - 68;
        zoomIn.y = 4;
        content.stage.addChild(zoomIn);

        const zoomOut = makeButton('-', 28, 24, () => {
          ic.setZoom(ic.zoom / 1.4, VW / 2, VH / 2);
          updateCoord();
        });
        zoomOut.x = VW - 36;
        zoomOut.y = 4;
        content.stage.addChild(zoomOut);

        const resetBtn = makeButton('reset', 50, 24, () => {
          ic.centerOn(0, 0);
          ic.setZoom(1, VW / 2, VH / 2);
          updateCoord();
        });
        resetBtn.x = 610;
        resetBtn.y = 4;
        content.stage.addChild(resetBtn);

        const ic = new InfiniteCanvas({
          parent: content,
          viewport: { x: 0, y: 0, width: VW, height: VH },
          chunkSize: CHUNK,
          onDrag: () => updateCoord(),
          chunkCreate: ({ cx, cy, container }) => {
            const g = new PIXI.Graphics();
            const idx = (((cx * 7 + cy * 13) % COLORS.length) + COLORS.length) % COLORS.length;
            g.rect(0, 0, CHUNK, CHUNK).fill({ color: COLORS[idx], alpha: 0.5 });
            g.stroke({ width: 1, color: 0x3a4a5a, alpha: 0.3 });
            container.addChild(g);
            const t = new PIXI.Text({
              text: `${cx},${cy}`,
              style: { fontSize: 12, fill: 0x88aacc, fontFamily: 'monospace' },
            });
            t.x = 6; t.y = 6;
            container.addChild(t);
            const hc = CHUNK / 2;
            for (let i = 0; i < 4; i++) {
              const dot = new PIXI.Graphics()
                .circle(hc + i * 40 - 60, hc, 3)
                .fill({ color: 0x66ccff, alpha: 0.6 });
              container.addChild(dot);
            }
          },
          chunkDestroy: ({ container }) => container.destroy({ children: true }),
        });
      });

      setTimeout(() => {
        backend.send('open-window', {
          id: 'ic-win', title: 'InfiniteCanvas (via adapter)', x: 60, y: 60, width: 600, height: 440,
        });
      }, 600);

      proxy.onWindowResize(() => {
        root.setBounds({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
      });
    });

    return () => {
      wmAdapter?.destroy();
      wm?.destroy();
      backend.destroy();
      stop();
    };
  }, []);

  return null;
}

WmCanvasDisplay.head = {
  title: 'WM Canvas Adapter',
  description: 'WindowManagerAdapter: InfiniteCanvas inside a backend-driven window.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
