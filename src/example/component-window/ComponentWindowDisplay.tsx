import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas, type SubCanvasProxy } from '../../framework';
import { createWindow, type GameWindow, type GameWindowOptions } from '../../components';

type WinKey = 'A' | 'B' | 'C';
const KEYS: WinKey[] = ['A', 'B', 'C'];

const WINDOW_SPECS: Record<WinKey, Omit<GameWindowOptions, 'parent'>> = {
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

const HINTS: Record<WinKey, string> = {
  A: 'drag the title bar only',
  B: 'drag from anywhere inside',
  C: 'cannot be dragged',
};

const PRESET: Record<WinKey, { x: number; y: number }> = {
  A: { x: 100, y: 300 },
  B: { x: 440, y: 300 },
  C: { x: 780, y: 300 },
};

function addContent(win: GameWindow, hint: string) {
  const text = new PIXI.Text({
    text: hint,
    style: { fontSize: 13, fill: 0xffffff, fontFamily: 'monospace' },
  });
  text.x = 14;
  text.y = 50;
  win.stage.addChild(text);
}

export function ComponentWindowDisplay() {
  const scRef = useRef<SubCanvas | null>(null);
  const refs = useRef<Record<WinKey, GameWindow | null>>({ A: null, B: null, C: null });
  const [open, setOpen] = useState<Record<WinKey, boolean>>({ A: true, B: true, C: true });
  const lastPos = useRef<Record<WinKey, { x: number; y: number } | null>>({ A: null, B: null, C: null });

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const sc = proxy.createRegion({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      scRef.current = sc;
      for (const k of KEYS) {
        refs.current[k] = createWindow({ ...WINDOW_SPECS[k], parent: sc });
        addContent(refs.current[k], HINTS[k]);
      }
    });
    return () => {
      for (const k of KEYS) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        refs.current[k]?.destroy();
      }
      stop();
    };
  }, []);

  const ref = (k: WinKey) => {
    if (k === 'A') return refs.current.A;
    if (k === 'B') return refs.current.B;
    return refs.current.C;
  };

  const doClose = (k: WinKey) => {
    const win = ref(k);
    if (!win) return;
    lastPos.current[k] = { x: Math.round(win.bounds.x), y: Math.round(win.bounds.y) };
    win.destroy();
    refs.current[k] = null;
    setOpen((o) => ({ ...o, [k]: false }));
  };

  const doOpen = (k: WinKey, pos?: { x: number; y: number }) => {
    if (!scRef.current || ref(k)) return;
    const spec = { ...WINDOW_SPECS[k], parent: scRef.current };
    if (pos) { spec.x = pos.x; spec.y = pos.y; }
    const win = createWindow(spec);
    refs.current[k] = win;
    addContent(win, HINTS[k]);
    setOpen((o) => ({ ...o, [k]: true }));
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
          <div className="grid">
            {KEYS.map((k) => (
              <div key={k} className="ctrl">
                <span className="tag">win {k}</span>
                <button className="btn" onClick={() => doClose(k)} disabled={!open[k]}>close</button>
                <button className="btn" onClick={() => doOpen(k)} disabled={open[k]}>open</button>
                <button
                  className="btn"
                  disabled={open[k] || !lastPos.current[k]}
                  onClick={() => doOpen(k, lastPos.current[k]!)}
                  title="reopen where it was last closed"
                >
                  reopen here
                </button>
                <button
                  className="btn"
                  disabled={open[k]}
                  onClick={() => doOpen(k, PRESET[k])}
                  title="open at preset position"
                >
                  preset
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
  position: fixed; inset: 0; z-index: 50;
  pointer-events: none; display: flex; align-items: flex-end;
  justify-content: center; padding-bottom: 24px;
}
.panel {
  pointer-events: auto; background: rgba(10,10,20,0.88);
  border: 1px solid #2a2a3a; border-radius: 10px;
  padding: 14px 18px; font-family: ui-monospace, SFMono-Regular, monospace;
  color: #e6e6f0; min-width: 520px;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.panel-title { font-size: 0.85rem; color: #88aaff; margin-bottom: 4px; }
.panel-hint { font-size: 0.72rem; opacity: 0.65; margin-bottom: 12px; line-height: 1.5; white-space: pre-wrap; }
.grid { display: flex; flex-direction: column; gap: 6px; }
.ctrl { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; }
.tag { color: #88aaff; min-width: 40px; }
.btn {
  background: #14141f; border: 1px solid #2a2a3a; color: #e6e6f0;
  border-radius: 6px; padding: 5px 9px; font: inherit; font-size: 0.72rem;
  cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
.btn:hover:not(:disabled) { border-color: #4a6a9a; background: #18182a; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
`;
