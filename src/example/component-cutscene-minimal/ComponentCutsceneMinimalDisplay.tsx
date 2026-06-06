import { useEffect } from 'react';
import { startPixiApp } from '../../framework/PixiApp';
import { createVideoPlayer } from '../../components';
import type { PixiVideoPlayerHandle } from '../../components';
import type { SubCanvas } from '../../framework/SubCanvas';

const STABLE_MP4_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4';

export function ComponentCutsceneMinimalDisplay() {
  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;

    const vw = W;
    const vh = (W * 9) / 16;
    const vx = 0;
    let vh2 = vh;
    if (vh > H) vh2 = H;
    let vw2 = vw;
    if (vh > H) vw2 = (H * 16) / 9;
    const vy = (H - vh2) / 2;
    const finalX = vh > H ? (W - vw2) / 2 : vx;

    let root: SubCanvas | null = null;
    let player: PixiVideoPlayerHandle | null = null;

    const destroyApp = startPixiApp((proxy) => {
      root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      player = createVideoPlayer(root, {
        url: STABLE_MP4_URL,
        x: finalX, y: vy, width: vw2, height: vh2,
        autoplay: false,
        loop: true,
        muted: false,
        showControls: true,
        onDebug: (msg) => { console.log(`[Minimal] ${msg}`); },
      });
    });

    return () => {
      player?.destroy();
      player = null;
      destroyApp();
    };
  }, []);

  return <></>;
}

ComponentCutsceneMinimalDisplay.head = {
  title: 'Component: Cutscene (Minimal)',
  description: 'Sanity test: single PIXI.App via SubCanvas + createVideoPlayer, click-to-start with sound. Muted autoplay is the only path that bypasses browser autoplay policy without user gesture, so we use a click gesture instead.',
};
