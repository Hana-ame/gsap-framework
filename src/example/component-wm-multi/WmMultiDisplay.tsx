// Example: Multi-instance window manager display
import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas, type SubCanvasProxy } from '@framework';
import { textPresets } from '@components';
import { MockBackend, WindowManager } from '../../backend';
import { WindowManagerAdapter } from '../../adapters';

const COLORS = [
  0x4488ff, 0xff4488, 0x44ff88, 0xff8844, 0x8844ff,
  0x44ffff, 0xff44ff, 0xffff44, 0x88aaff, 0xff88aa,
  0xaaff88, 0xaa88ff,
];

export function WmMultiDisplay() {
  useEffect(() => {
    const backend = new MockBackend();
    let wm: WindowManager | null = null;
    let wmAdapter: WindowManagerAdapter | null = null;
    let root: SubCanvas | null = null;
    let winCount = 0;

    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const hint = new PIXI.Text({
        text: 'WindowManagerAdapter — 12 backend-driven windows',
        style: { fontSize: 11, fill: 0x666688, fontFamily: 'monospace' },
      });
      hint.x = 12;
      hint.y = 12;
      root.stage.addChild(hint);

      const countText = new PIXI.Text({
        text: 'windows: 0',
        style: textPresets.dim,
      });
      countText.x = 12;
      countText.y = 30;
      root.stage.addChild(countText);

      const statusText = new PIXI.Text({
        text: 'status: disconnected',
        style: { fontSize: 10, fill: 0x888888, fontFamily: 'monospace' },
      });
      statusText.x = 12;
      statusText.y = 48;
      root.stage.addChild(statusText);

      backend.on('status', (s) => { statusText.text = `status: ${s}`; });

      backend.connect(300);

      wm = new WindowManager(backend);
      wmAdapter = new WindowManagerAdapter(wm, root);

      wm.on('window-opened', ({ spec }) => {
        const idx = parseInt(spec.id.replace('win-', ''), 10) - 1;
        const stage = wmAdapter!.getContentStage(spec.id);
        if (!stage) return;
        const bg = new PIXI.Graphics()
          .roundRect(10, 30, spec.width - 20, spec.height - 40, 4)
          .fill({ color: COLORS[idx % COLORS.length], alpha: 0.15 });
        bg.eventMode = 'none';
        stage.stage.addChild(bg);
        const label = new PIXI.Text({
          text: `window #${idx + 1}`,
          style: { fontSize: 11, fill: COLORS[idx % COLORS.length], fontFamily: 'monospace' },
        });
        label.x = 16;
        label.y = 46;
        label.eventMode = 'none';
        stage.stage.addChild(label);
        winCount++;
        countText.text = `windows: ${winCount}`;
      });

      wm.on('window-closed', () => {
        winCount--;
        countText.text = `windows: ${winCount}`;
      });

      setTimeout(() => {
        const seq: { type: 'open-window'; payload: Record<string, unknown>; delay: number }[] = [];
        for (let i = 0; i < 12; i++) {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const x = 60 + col * 200 + Math.random() * 40;
          const y = 80 + row * 180 + Math.random() * 30;
          seq.push({
            type: 'open-window',
            payload: { id: `win-${i + 1}`, title: `Window ${i + 1}`, x, y, width: 180, height: 140 },
            delay: 100,
          });
        }
        backend.sendSequence(seq);
      }, 500);

      proxy.onWindowResize(() => {
        root?.setBounds({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
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

WmMultiDisplay.head = {
  title: 'WM Multi Adapter',
  description: 'WindowManagerAdapter: 12 backend-driven windows via open-window commands.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
