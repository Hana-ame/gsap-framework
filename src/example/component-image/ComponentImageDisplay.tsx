import { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas, type SubCanvasProxy } from '../../framework';
import { createLoadingImage, type PixiImageHandle } from '../../components';

interface Slot {
  label: string;
  url: string;
  note: string;
  status: 'idle' | 'loading' | 'loaded' | 'error';
}

const SOURCES: Omit<Slot, 'status'>[] = [
  {
    label: 'A · proxy sinaimg (small)',
    url: 'https://proxy.moonchan.xyz/mw2000/007Y7SRMly1idrdc5nzp2j310o1m2agv.jpg?proxy_host=wx4.sinaimg.cn&proxy_referer=https%3A%2F%2Fweibo.com%2F',
    note: 'via moonchan proxy, auto-referer',
  },
  {
    label: 'B · proxy sinaimg (large)',
    url: 'https://proxy.moonchan.xyz/mw690/6dd57921ly1idq2o0vvfhj210m1eyh9o.jpg?proxy_host=wx4.sinaimg.cn&proxy_referer=https://weibo.com',
    note: 'contain-fitted to slot',
  },
  {
    label: 'C · upload.moonchan.xyz',
    url: 'https://upload.moonchan.xyz/api/01LLWEUU5HPWM4U4SXOBAY3Y6KJFHKJR3N/image.webp',
    note: 'direct upload, no CORS',
  },
  {
    label: 'D · network error',
    url: 'https://this-domain-does-not-exist-abc123.invalid/image.jpg',
    note: 'DNS failure → error placeholder',
  },
];

const SLOT_W = 240;
const SLOT_H = 200;

export function ComponentImageDisplay() {
  const scRef = useRef<SubCanvas | null>(null);
  const [slots, setSlots] = useState<Slot[]>(() =>
    SOURCES.map((s) => ({ ...s, status: 'idle' })),
  );
  const slotRefs = useRef<(SubCanvas | null)[]>([]);
  const handleRefs = useRef<(PixiImageHandle | null)[]>([]);

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const sc = proxy.createRegion({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      scRef.current = sc;

      const baseX = 60;
      const baseY = 110;
      const gap = 20;
      SOURCES.forEach((s, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const slot = sc.createSubRegion({
          x: baseX + col * (SLOT_W + gap),
          y: baseY + row * (SLOT_H + 60),
          width: SLOT_W,
          height: SLOT_H,
        });
        slotRefs.current[i] = slot;

        const title = new PIXI.Text({
          text: s.label,
          style: { fontSize: 13, fill: 0xffffff, fontFamily: 'monospace' },
        });
        title.x = 4;
        title.y = -22;
        slot.stage.addChild(title);

        const note = new PIXI.Text({
          text: s.note,
          style: { fontSize: 10, fill: 0x888888, fontFamily: 'monospace' },
        });
        note.x = 4;
        note.y = SLOT_H + 4;
        slot.stage.addChild(note);
      });
    });

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      handleRefs.current.forEach((h) => h?.destroy());
      stop();
    };
  }, []);

  const load = useCallback(
    (i: number) => {
      const slot = slotRefs.current[i];
      if (!slot) return;
      handleRefs.current[i]?.destroy();
      handleRefs.current[i] = null;
      setSlots((arr) =>
        arr.map((s, idx) => (idx === i ? { ...s, status: 'loading' } : s)),
      );
      const src = SOURCES[i];
      const h = createLoadingImage(slot, {
        url: src.url,
        x: 4,
        y: 4,
        width: SLOT_W - 8,
        height: SLOT_H - 8,
        onLoad: () => {
          setSlots((arr) =>
            arr.map((s, idx) => (idx === i ? { ...s, status: 'loaded' } : s)),
          );
          console.log(`[showcase] slot ${i} loaded`);
        },
        onError: (e) => {
          setSlots((arr) =>
            arr.map((s, idx) => (idx === i ? { ...s, status: 'error' } : s)),
          );
          console.log(`[showcase] slot ${i} error:`, e);
        },
      });
      handleRefs.current[i] = h;
    },
    [],
  );

  const clear = useCallback((i: number) => {
    handleRefs.current[i]?.destroy();
    handleRefs.current[i] = null;
    setSlots((arr) =>
      arr.map((s, idx) => (idx === i ? { ...s, status: 'idle' } : s)),
    );
  }, []);

  return (
    <>
      <style>{css}</style>
      <div className="overlay top">
        <div className="panel">
          <div className="panel-title">PixiImage.ts</div>
          <div className="panel-hint">
            createLoadingImage(parent, {`{ url, x, y, width, height, onLoad, onError }`}) &rarr; handle
            <br />
            placeholder while loading, contain-fit, token-cancellation on url change
          </div>
        </div>
      </div>
      <div className="overlay right">
        <div className="panel">
          <div className="panel-title">slots</div>
          {slots.map((s, i) => (
            <div key={i} className="row">
              <span className="tag">
                {String.fromCharCode(65 + i)} · {s.status}
              </span>
              <button className="btn" onClick={() => load(i)}>
                load
              </button>
              <button className="btn" onClick={() => clear(i)}>
                clear
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

ComponentImageDisplay.head = {
  title: 'subcanvas — Image',
  description: 'Showcase: createLoadingImage() with placeholder, loading, error states.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};

const css = `
.overlay { position: fixed; z-index: 50; pointer-events: none; display: flex; padding: 0 12px; }
.overlay.top { top: 16px; left: 0; right: 0; justify-content: center; }
.overlay.right { top: 110px; right: 16px; }
.panel {
  pointer-events: auto;
  background: rgba(10,10,20,0.88);
  border: 1px solid #2a2a3a;
  border-radius: 10px;
  padding: 14px 18px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: #e6e6f0;
  min-width: 360px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.panel-title { font-size: 0.85rem; color: #88aaff; margin-bottom: 4px; }
.panel-hint { font-size: 0.72rem; opacity: 0.65; line-height: 1.5; white-space: pre-wrap; }
.row { display: flex; gap: 6px; align-items: center; font-size: 0.72rem; margin-top: 6px; }
.tag { min-width: 120px; opacity: 0.85; }
.btn {
  background: #14141f; border: 1px solid #2a2a3a; color: #e6e6f0;
  border-radius: 6px; padding: 4px 8px; font: inherit; font-size: 0.7rem;
  cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
.btn:hover { border-color: #4a6a9a; background: #18182a; }
`;
