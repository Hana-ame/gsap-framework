import { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas, type SubCanvasProxy } from '../../framework';
import { createVideoPlayer, type PixiVideoPlayerHandle } from '../../components';

interface VideoSlot {
  label: string;
  url: string;
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'error';
  handle: PixiVideoPlayerHandle | null;
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
    SOURCES.map((s) => ({ label: s.label, url: s.url, status: 'idle' as const, handle: null })),
  );
  const slotRefs = useRef<(SubCanvas | null)[]>([]);

  useEffect(() => {
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
          onLoad: () => {
            setSlots((arr) =>
              arr.map((s, idx) => (idx === i ? { ...s, status: 'paused' } : s)),
            );
          },
          onError: (e) => {
            setSlots((arr) =>
              arr.map((s, idx) => (idx === i ? { ...s, status: 'error' } : s)),
            );
            console.log(`[video] slot ${i} error:`, e);
          },
        });

        setSlots((arr) =>
          arr.map((s, idx) => (idx === i ? { ...s, handle: h } : s)),
        );
      });
    });

    return () => {
      // cleanup handles
      setSlots((arr) => {
        arr.forEach((s) => s.handle?.destroy());
        return arr;
      });
      stop();
    };
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
          <div className="panel-title">PixiVideoPlayer.ts</div>
          <div className="panel-hint">
            createVideoPlayer(parent, {`{ url, width, height, ... }`}) &rarr; handle
            <br />
            PIXI v8 video texture via Assets.load + native HTMLVideoElement controls
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
.btn {
  background: #14141f; border: 1px solid #2a2a3a; color: #e6e6f0;
  border-radius: 6px; padding: 4px 8px; font: inherit; font-size: 0.7rem;
  cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
.btn:hover { border-color: #4a6a9a; background: #18182a; }
`;
