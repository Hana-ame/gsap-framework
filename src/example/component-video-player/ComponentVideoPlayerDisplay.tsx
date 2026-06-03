import { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas, type SubCanvasProxy } from '../../framework';
import { createVideoPlayer, type PixiVideoPlayerHandle } from '../../components';

interface VideoSlot {
  label: string;
  url: string;
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'error';
  handle: PixiVideoPlayerHandle | null;
  dur: number;
  ct: number;
  p: boolean;
}

const SOURCES = [
  {
    label: 'Video A (4K)',
    url: 'https://twimg.moonchan.xyz/amplify_video/2060325825661321216/vid/avc1/3840x2160/crfP1YbNtm68kGAM.mp4?tag=27',
    note: 'via twimg.moonchan.xyz',
  },
  {
    label: 'Video B (4K)',
    url: 'https://twimg.moonchan.xyz/amplify_video/2059844734018027520/vid/avc1/3840x2160/sZYS22VvlcnHSHhh.mp4?tag=27',
    note: 'via twimg.moonchan.xyz',
  },
];

const W = 480;
const H = 320;
const GAP = 20;
const LX = 40;
const LY = 110;

export function ComponentVideoPlayerDisplay() {
  const [slots, setSlots] = useState<VideoSlot[]>(() =>
    SOURCES.map((s) => ({
      label: s.label,
      url: s.url,
      status: 'idle' as const,
      handle: null,
      dur: 0,
      ct: 0,
      p: true,
    })),
  );
  const slotRefs = useRef<(SubCanvas | null)[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const maxLog = 40;

  const onDebug = useCallback((i: number, msg: string) => {
    const ts = new Date().toLocaleTimeString();
    const label = SOURCES[i].label;
    setLogs((prev) => [`${ts} [${label}] ${msg}`, ...prev].slice(0, maxLog));
  }, []);

  useEffect(() => {
    const handles: (PixiVideoPlayerHandle | null)[] = [];
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const sc = proxy.createRegion({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      SOURCES.forEach((src, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const slot = sc.createSubRegion({
          x: LX + col * (W + GAP),
          y: LY + row * (H + 40),
          width: W,
          height: H,
        });
        slotRefs.current[i] = slot;

        const title = new PIXI.Text({
          text: src.label,
          style: { fontSize: 13, fill: 0xffffff, fontFamily: 'monospace' },
        });
        title.x = 4;
        title.y = -22;
        slot.stage.addChild(title);

        const note = new PIXI.Text({
          text: src.note,
          style: { fontSize: 10, fill: 0x888888, fontFamily: 'monospace' },
        });
        note.x = 4;
        note.y = H + 4;
        slot.stage.addChild(note);

        const h = createVideoPlayer(slot, {
          url: src.url,
          x: 0,
          y: 0,
          width: W,
          height: H,
          loop: false,
          muted: true,
          autoplay: false,
          showControls: true,
          onDebug: (msg) => onDebug(i, msg),
          onLoad: () => {
            setSlots((arr) =>
              arr.map((s, idx) => {
                if (idx !== i) return s;
                const dur = h.duration;
                const ct = h.currentTime;
                const p = h.paused;
                return { ...s, status: 'paused' as const, dur, ct, p };
              }),
            );
          },
          onError: (e) => {
            setSlots((arr) =>
              arr.map((s, idx) => (idx === i ? { ...s, status: 'error' as const } : s)),
            );
            onDebug(i, `ERROR: ${e.message}`);
          },
        });

        handles[i] = h;
        setSlots((arr) =>
          arr.map((s, idx) => (idx === i ? { ...s, handle: h } : s)),
        );
      });
    });

    // poll state
    const timer = setInterval(() => {
      setSlots((arr) =>
        arr.map((s, i) => {
          if (!s.handle || s.handle.destroyed) return s;
          return {
            ...s,
            dur: s.handle.duration,
            ct: s.handle.currentTime,
            p: s.handle.paused,
          };
        }),
      );
    }, 200);

    return () => {
      clearInterval(timer);
      handles.forEach((h) => h?.destroy());
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = useCallback((i: number, action: 'play' | 'pause' | 'toggle') => {
    setSlots((arr) => {
      const s = arr[i];
      if (!s.handle) return arr;
      if (action === 'play') {
        s.handle.play();
        return arr.map((v, idx) => (idx === i ? { ...v, status: 'playing' as const } : v));
      }
      if (action === 'pause') {
        s.handle.pause();
        return arr.map((v, idx) => (idx === i ? { ...v, status: 'paused' as const } : v));
      }
      s.handle.toggle();
      const nextStatus = s.handle.paused ? 'paused' as const : 'playing' as const;
      return arr.map((v, idx) => (idx === i ? { ...v, status: nextStatus } : v));
    });
  }, []);

  return (
    <>
      <style>{css}</style>
      <div className="overlay top">
        <div className="panel">
          <div className="panel-title">PixiVideoPlayer.ts + onDebug</div>
          <div className="panel-hint">
            createVideoPlayer(parent, {`{ url, width, height, ... }`}) &rarr; handle
          </div>
        </div>
      </div>
      <div className="overlay right">
        <div className="panel">
          <div className="panel-title">controls</div>
          {slots.map((s, i) => (
            <div key={i} className="row">
              <span className="tag">{s.label} &middot; {s.status}</span>
              <button className="btn" onClick={() => act(i, 'toggle')}>toggle</button>
              <button className="btn" onClick={() => act(i, 'play')}>play</button>
              <button className="btn" onClick={() => act(i, 'pause')}>pause</button>
            </div>
          ))}
          <div className="row" style={{ marginTop: 8 }}>
            <span className="tag" style={{ minWidth: 'auto' }}>polled state:</span>
          </div>
          {slots.map((s, i) => (
            <div key={`st-${i}`} className="row state-row">
              <span className="tag">{i === 0 ? 'A' : 'B'}:</span>
              <span>dur={s.dur.toFixed(1)}</span>
              <span>ct={s.ct.toFixed(1)}</span>
              <span>p={s.p ? 'Y' : 'N'}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="debug-overlay">
        <div className="debug-title">DEBUG LOG ({logs.length})</div>
        <div className="debug-scroll">
          {logs.map((msg, i) => (
            <div key={i} className="debug-line">{msg}</div>
          ))}
          {logs.length === 0 && <div className="debug-line dim">(no logs yet — click play or toggle)</div>}
        </div>
      </div>
    </>
  );
}

ComponentVideoPlayerDisplay.head = {
  title: 'subcanvas — Video Player',
  description: 'Showcase: createVideoPlayer() with 4K video streams, controls bar, progress seek.',
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
.state-row { gap: 4px; margin-top: 2px; }
.state-row span { min-width: auto; }
.btn {
  background: #14141f; border: 1px solid #2a2a3a; color: #e6e6f0;
  border-radius: 6px; padding: 4px 8px; font: inherit; font-size: 0.7rem;
  cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
.btn:hover { border-color: #4a6a9a; background: #18182a; }
.debug-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(0,0,0,0.92);
  border-top: 1px solid #2a2a3a;
  font-family: monospace;
  font-size: 0.65rem;
  color: #88cc88;
  max-height: 180px;
  display: flex;
  flex-direction: column;
}
.debug-title {
  flex: 0 0 auto;
  padding: 4px 12px;
  color: #888;
  border-bottom: 1px solid #1a1a2a;
}
.debug-scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 4px 12px;
}
.debug-line {
  white-space: pre-wrap;
  line-height: 1.4;
  word-break: break-all;
}
.debug-line.dim { opacity: 0.4; }
`;
