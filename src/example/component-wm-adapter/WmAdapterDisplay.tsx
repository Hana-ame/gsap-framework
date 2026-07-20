// Example: Window manager adapter integration
import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas, type SubCanvasProxy } from '@framework';
import { textPresets } from '@components';
import { MockBackend, WindowManager } from '../../backend';
import { WindowManagerAdapter } from '../../adapters';

export function WmAdapterDisplay() {
  useEffect(() => {
    const backend = new MockBackend();
    let wm: WindowManager | null = null;
    let wmAdapter: WindowManagerAdapter | null = null;
    let root: SubCanvas | null = null;

    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const title = new PIXI.Text({
        text: 'WindowManagerAdapter — backend-driven window lifecycle',
        style: textPresets.heading,
      });
      title.x = 12;
      title.y = 12;
      root.stage.addChild(title);

      const info = new PIXI.Text({
        text: 'backend will open 2 windows, move them, change titles, then close one',
        style: { fontSize: 12, fill: 0x888888, fontFamily: 'sans-serif' },
      });
      info.x = 12;
      info.y = 36;
      root.stage.addChild(info);

      const logText = new PIXI.Text({
        text: '',
        style: { fontSize: 10, fill: 0x88aaff, fontFamily: 'monospace' },
      });
      logText.x = 12;
      logText.y = 60;
      root.stage.addChild(logText);

      const log: string[] = [];
      const appendLog = (msg: string) => {
        log.push(msg);
        if (log.length > 30) log.shift();
        logText.text = log.join('\n');
      };

      backend.on('status', (s) => appendLog(`[backend] status: ${s}`));
      backend.on('command', (cmd) => appendLog(`[cmd] ${cmd.type}`));

      backend.connect(300);

      wm = new WindowManager(backend);
      wmAdapter = new WindowManagerAdapter(wm, root);

      setTimeout(() => {
        backend.sendSequence([
          { type: 'open-window', payload: { id: 'alpha', title: 'Alpha', x: 80, y: 100, width: 400, height: 280 }, delay: 500 },
          { type: 'set-content', payload: { windowId: 'alpha', type: 'text' }, delay: 400 },
          { type: 'open-window', payload: { id: 'beta', title: 'Beta', x: 520, y: 140, width: 320, height: 220 }, delay: 600 },
          { type: 'set-content', payload: { windowId: 'beta', type: 'canvas' }, delay: 400 },
          { type: 'move-window', payload: { id: 'alpha', x: 120, y: 160 }, delay: 700 },
          { type: 'set-title', payload: { id: 'alpha', title: 'Alpha — repositioned' }, delay: 500 },
          { type: 'focus-window', payload: { id: 'beta' }, delay: 400 },
          { type: 'resize-window', payload: { id: 'beta', width: 400, height: 300 }, delay: 600 },
          { type: 'close-window', payload: { id: 'beta' }, delay: 800 },
        ]);
      }, 200);

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

WmAdapterDisplay.head = {
  title: 'WM Adapter',
  description: 'WindowManagerAdapter: backend-driven open/move/resize/close via MockBackend commands.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
