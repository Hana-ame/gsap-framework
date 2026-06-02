import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas, type SubCanvasProxy } from '../../framework';
import { createWindow, type GameWindow, type GameWindowOptions } from '../../components';

const WINDOW_SPECS: Record<'A' | 'B' | 'C', Omit<GameWindowOptions, 'parent'>> = {
  A: {
    title: 'A · title drag (default)',
    x: 40,
    y: 80,
    width: 320,
    height: 220,
    dragMode: 'title',
  },
  B: {
    title: 'B · anywhere drag',
    x: 380,
    y: 80,
    width: 320,
    height: 220,
    dragMode: 'anywhere',
  },
  C: {
    title: 'C · fixed (dragMode: none)',
    x: 720,
    y: 80,
    width: 320,
    height: 220,
    dragMode: 'none',
  },
};

export function ComponentWindowDisplay() {
  const scRef = useRef<SubCanvas | null>(null);
  const winARef = useRef<GameWindow | null>(null);
  const winBRef = useRef<GameWindow | null>(null);
  const winCRef = useRef<GameWindow | null>(null);
  const [open, setOpen] = useState<Record<'A' | 'B' | 'C', boolean>>({
    A: true,
    B: true,
    C: true,
  });

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const sc = proxy.createRegion({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      scRef.current = sc;

      const make = (key: 'A' | 'B' | 'C', ref: React.MutableRefObject<GameWindow | null>) => {
        ref.current = createWindow({ ...WINDOW_SPECS[key], parent: sc });
        const text = new PIXI.Text({
          text:
            key === 'A'
              ? 'drag the title bar only'
              : key === 'B'
                ? 'drag from anywhere inside'
                : 'cannot be dragged',
          style: { fontSize: 13, fill: 0xffffff, fontFamily: 'monospace' },
        });
        text.x = 14;
        text.y = 14;
        ref.current.stage.addChild(text);
      };
      make('A', winARef);
      make('B', winBRef);
      make('C', winCRef);
    });
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      winARef.current?.destroy();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      winBRef.current?.destroy();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      winCRef.current?.destroy();
      stop();
    };
  }, []);

  const doClose = (key: 'A' | 'B' | 'C') => {
    const r = key === 'A' ? winARef : key === 'B' ? winBRef : winCRef;
    r.current?.destroy();
    r.current = null;
    setOpen((o) => ({ ...o, [key]: false }));
  };

  const doReopen = (key: 'A' | 'B' | 'C') => {
    if (!scRef.current) return;
    const r = key === 'A' ? winARef : key === 'B' ? winBRef : winCRef;
    r.current = createWindow({ ...WINDOW_SPECS[key], parent: scRef.current });
    const text = new PIXI.Text({
      text:
        key === 'A'
          ? 'drag the title bar only'
          : key === 'B'
            ? 'drag from anywhere inside'
            : 'cannot be dragged',
      style: { fontSize: 13, fill: 0xffffff, fontFamily: 'monospace' },
    });
    text.x = 14;
    text.y = 14;
    r.current.stage.addChild(text);
    setOpen((o) => ({ ...o, [key]: true }));
  };

  return (
    <>
      <style>{css}</style>
      <div className="overlay">
        <div className="panel">
          <div className="panel-title">PixiWindow.ts</div>
          <div className="panel-hint">
            createWindow({'{ title, x, y, width, height, parent, dragMode }'})
            <br />
            dragMode: 'title' | 'anywhere' | 'none'
          </div>
          <div className="row">
            {(['A', 'B', 'C'] as const).map((k) => (
              <div key={k} className="ctrl">
                <span className="tag">window {k}</span>
                <button className="btn" onClick={() => doClose(k)} disabled={!open[k]}>
                  close
                </button>
                <button className="btn" onClick={() => doReopen(k)} disabled={open[k]}>
                  reopen
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

ComponentWindowDisplay.head = {
  title: 'subcanvas — Window',
  description: 'Showcase: createWindow() with title/anywhere/none drag modes.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};

const css = `
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 24px;
}
.panel {
  pointer-events: auto;
  background: rgba(10,10,20,0.88);
  border: 1px solid #2a2a3a;
  border-radius: 10px;
  padding: 14px 18px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: #e6e6f0;
  min-width: 420px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.panel-title { font-size: 0.85rem; color: #88aaff; margin-bottom: 4px; }
.panel-hint { font-size: 0.72rem; opacity: 0.65; margin-bottom: 12px; line-height: 1.5; white-space: pre-wrap; }
.row { display: flex; gap: 12px; flex-wrap: wrap; }
.ctrl { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; }
.tag { color: #88aaff; }
.btn {
  background: #14141f; border: 1px solid #2a2a3a; color: #e6e6f0;
  border-radius: 6px; padding: 6px 10px; font: inherit; font-size: 0.75rem;
  cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
.btn:hover:not(:disabled) { border-color: #4a6a9a; background: #18182a; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
`;
