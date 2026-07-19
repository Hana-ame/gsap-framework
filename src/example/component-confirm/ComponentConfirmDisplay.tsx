import { useEffect, useRef, useState } from 'react';
import { startPixiApp, makeInfoPanel, type SubCanvas, type SubCanvasProxy } from '../../framework';
import { createConfirm, type PixiConfirm, type PixiConfirmOptions } from '../../components';

export function ComponentConfirmDisplay() {
  const scRef = useRef<SubCanvas | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const confirmRef = useRef<PixiConfirm | null>(null);

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      scRef.current = proxy.createRegion({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      makeInfoPanel(scRef.current, { title: 'Confirm Component', lines: ['PURPOSE: Demo createConfirm() with multiple button configurations, image display, and custom styling.', 'HOW TO TEST: Click buttons to spawn different confirm dialogs. Try the OK/Cancel buttons.', 'EXPECTED: Confirm dialogs appear with correct buttons. Click a button → dialog closes → onResult fires with the button label.'] });
    });
    return () => {
      confirmRef.current?.destroy();
      stop();
    };
  }, []);

  const append = (line: string) =>
    setLog((l) => [`${new Date().toLocaleTimeString()} · ${line}`, ...l].slice(0, 8));

  const open = (variant: 'text' | 'image' | 'three' | 'keepOpen') => {
    if (!scRef.current) return;
    confirmRef.current?.destroy();

    let count = 0;
    const build = (extra: Omit<PixiConfirmOptions, 'x' | 'y' | 'width' | 'height'>) => ({
      x: 60,
      y: 60,
      width: 380,
      height: 240,
      ...extra,
    });

    if (variant === 'text') {
      confirmRef.current = createConfirm(
        build({
          title: 'text confirm',
          message: 'this is a plain text confirm with default OK / Cancel',
          parent: scRef.current,
          onResult: (r) => append(`text → ${r}`),
        }),
      );
    } else if (variant === 'image') {
      confirmRef.current = createConfirm(
        build({
          title: 'image confirm',
          message: 'image and message are mutually exclusive (image wins)',
          image: 'https://i0.hdslb.com/bfs/album/placeholder.jpg',
          parent: scRef.current,
          onResult: (r) => append(`image → ${r}`),
        }),
      );
    } else if (variant === 'three') {
      confirmRef.current = createConfirm(
        build({
          title: 'three buttons',
          message: 'save before quitting?',
          parent: scRef.current,
          buttons: [
            { label: 'Save', primary: true },
            { label: "Don't Save" },
            { label: 'Cancel' },
          ],
          onResult: (r) => append(`three → ${r}`),
        }),
      );
    } else {
      confirmRef.current = createConfirm(
        build({
          title: 'keepOpen',
          message: 'click 3 times, then auto-close',
          parent: scRef.current,
          keepOpen: true,
          buttons: [{ label: 'click me' }],
          onResult: (r) => {
            count++;
            append(`keepOpen click #${count} (result=${r})`);
            if (count >= 3) {
              confirmRef.current?.destroy();
              confirmRef.current = null;
              append('keepOpen auto-closed after 3 clicks');
            }
          },
        }),
      );
    }
    append(`opened ${variant}`);
  };

  return (
    <>
      <style>{css}</style>
      <div className="overlay top">
        <div className="panel">
          <div className="panel-title">PixiConfirm.ts</div>
          <div className="panel-hint">
            createConfirm({'{ title, message?, image?, buttons, parent, onResult }'})
            <br />
            result auto-derives from label (okText / cancelText), else label string
          </div>
          <div className="row">
            <button className="btn" onClick={() => open('text')}>
              text
            </button>
            <button className="btn" onClick={() => open('image')}>
              image
            </button>
            <button className="btn" onClick={() => open('three')}>
              3 buttons
            </button>
            <button className="btn" onClick={() => open('keepOpen')}>
              keepOpen: true
            </button>
          </div>
        </div>
      </div>
      <div className="overlay bottom">
        <div className="log">
          {log.length === 0 ? (
            <div className="log-empty">log empty</div>
          ) : (
            log.map((l, i) => (
              <div key={i} className="log-line">
                {l}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

ComponentConfirmDisplay.head = {
  title: 'subcanvas — Confirm',
  description: 'Showcase: createConfirm() text/image/3-button/keepOpen variants.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};

const css = `
.overlay { position: fixed; left: 0; right: 0; z-index: 50; pointer-events: none; display: flex; justify-content: center; padding: 0 12px; }
.overlay.top { top: 16px; }
.overlay.bottom { bottom: 16px; }
.panel {
  pointer-events: auto;
  background: rgba(10,10,20,0.88);
  border: 1px solid #2a2a3a;
  border-radius: 10px;
  padding: 14px 18px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: #e6e6f0;
  min-width: 480px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.panel-title { font-size: 0.85rem; color: #88aaff; margin-bottom: 4px; }
.panel-hint { font-size: 0.72rem; opacity: 0.65; margin-bottom: 12px; line-height: 1.5; white-space: pre-wrap; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.btn {
  background: #14141f; border: 1px solid #2a2a3a; color: #e6e6f0;
  border-radius: 6px; padding: 8px 12px; font: inherit; font-size: 0.78rem;
  cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
.btn:hover { border-color: #4a6a9a; background: #18182a; }
.log {
  pointer-events: auto;
  background: rgba(10,10,20,0.88);
  border: 1px solid #2a2a3a;
  border-radius: 10px;
  padding: 10px 14px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: #e6e6f0;
  font-size: 0.72rem;
  min-width: 380px;
  max-height: 160px;
  overflow-y: auto;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.log-empty { opacity: 0.4; }
.log-line { padding: 1px 0; }
`;
