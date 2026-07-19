import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, textPresets, type SubCanvas, type SubCanvasProxy } from '../../framework';
import { MockBackend, WindowManager, ContentChannel } from '../../backend';

const DEMO_LINES = [
  '[SYSTEM] initializing connection...',
  '[SYSTEM] handshake complete',
  '[BACKEND] allocating window slot #1',
  '[BACKEND] pushing display content...',
  '[STREAM] chunk 1/6 received',
  '[STREAM] chunk 2/6 received',
  '[STREAM] chunk 3/6 received',
  '[STREAM] chunk 4/6 received',
  '[STREAM] chunk 5/6 received',
  '[STREAM] chunk 6/6 — reassembly complete',
  '[SYSTEM] all channels ready',
];

function makeLogText(): PIXI.Text {
  const t = new PIXI.Text({
    text: '',
    style: { fontSize: 10, fill: 0x88aaff, fontFamily: 'monospace' },
  });
  t.eventMode = 'none';
  return t;
}

export function BackendControlledDisplay() {
  const logRef = useRef<PIXI.Text | null>(null);

  useEffect(() => {
    const backend = new MockBackend();
    let wm: WindowManager | null = null;
    let cc: ContentChannel | null = null;
    let root: SubCanvas | null = null;

    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const title = new PIXI.Text({
        text: 'backend-controlled display',
        style: textPresets.heading,
      });
      title.x = 12;
      title.y = 12;
      root.stage.addChild(title);

      const statusText = new PIXI.Text({
        text: 'status: disconnected',
        style: { fontSize: 11, fill: 0xff8844, fontFamily: 'monospace' },
      });
      statusText.x = 12;
      statusText.y = 34;
      root.stage.addChild(statusText);

      const logText = makeLogText();
      logText.x = 12;
      logText.y = 56;
      logRef.current = logText;
      root.stage.addChild(logText);

      const log: string[] = [];
      const MAX_LOG = 28;
      const appendLog = (msg: string) => {
        log.push(msg);
        if (log.length > MAX_LOG) log.shift();
        logText.text = log.join('\n');
      };

      backend.on('status', (s) => {
        statusText.text = `status: ${s}`;
        appendLog(`[event] status → ${s}`);
      });

      backend.on('command', (cmd) => {
        appendLog(`[cmd] ${cmd.type} id=${cmd.id.slice(0, 16)}`);
      });

      backend.connect(600);

      wm = new WindowManager(backend, root);
      cc = new ContentChannel(backend);

      setTimeout(() => {
        backend.sendSequence([
          {
            type: 'open-window',
            payload: { id: 'win-1', title: 'Backend Window A', x: 60, y: 80, width: 460, height: 320 },
            delay: 400,
          },
          {
            type: 'set-content',
            payload: { windowId: 'win-1', type: 'placeholder' },
            delay: 500,
          },
          {
            type: 'open-window',
            payload: { id: 'win-2', title: 'Stream Window B', x: 560, y: 80, width: 380, height: 320 },
            delay: 600,
          },
          {
            type: 'set-content',
            payload: { windowId: 'win-2', type: 'ripple' },
            delay: 500,
          },
          {
            type: 'move-window',
            payload: { id: 'win-1', x: 80, y: 100 },
            delay: 800,
          },
          {
            type: 'set-title',
            payload: { id: 'win-1', title: 'Backend Window A — moved' },
            delay: 300,
          },
        ]);
      }, 200);

      setTimeout(() => {
        const sw = wm?.getWindow('win-1');
        if (sw && cc) {
          cc.attachStage('win-1-stream', sw.content);
          cc.simulateStream('win-1-stream', DEMO_LINES, 350);
        }
      }, 4000);

      proxy.onWindowResize(() => {
        root?.setBounds({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
      });
    });

    return () => {
      cc?.destroy();
      wm?.destroy();
      backend.destroy();
      stop();
    };
  }, []);

  return null;
}

BackendControlledDisplay.head = {
  title: 'Backend Controlled',
  description: 'MockBackend → WindowManager + ContentChannel: backend-driven window lifecycle.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
