import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '../../framework/PixiApp';
import { createVideoPlayer } from '../../components';
import type { PixiVideoPlayerHandle } from '../../components';
import type { SubCanvas } from '../../framework';

const STABLE_MP4_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4';
const FADE_DURATION = 300;
const SKIP_PROMPT_DELAY = 1200;

type State = 'idle' | 'fading-in' | 'playing' | 'fading-out';

export function ComponentCutsceneDisplay() {
  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;

    let root: SubCanvas | null = null;
    let player: PixiVideoPlayerHandle | null = null;
    let tickerFn: ((t: PIXI.Ticker) => void) | null = null;
    let tickerObj: PIXI.Ticker | null = null;

    let vw = W;
    let vh = (W * 9) / 16;
    if (vh > H) {
      vh = H;
      vw = (H * 16) / 9;
    }
    const vx = (W - vw) / 2;
    const vy = (H - vh) / 2;

    let state: State = 'idle';
    let fadeStart = 0;

    const buttonLayer = new PIXI.Container();
    const skipPrompt = new PIXI.Text({
      text: 'Click anywhere to skip',
      style: { fontSize: 13, fill: 0xaaaacc, fontFamily: 'monospace' },
    });
    skipPrompt.anchor.set(0.5, 1);
    skipPrompt.x = W / 2;
    skipPrompt.y = H - 24;
    skipPrompt.alpha = 0;

    const btnW = 220;
    const btnH = 64;
    const btnBg = new PIXI.Graphics()
      .roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 8)
      .fill({ color: 0x1a1a2e, alpha: 0.92 });
    btnBg.stroke({ width: 2, color: 0x446 });
    btnBg.eventMode = 'static';
    btnBg.cursor = 'pointer';
    btnBg.hitArea = new PIXI.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH);

    const btnText = new PIXI.Text({
      text: '\u25B6  Play Intro',
      style: { fontSize: 18, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
    });
    btnText.anchor.set(0.5);
    buttonLayer.addChild(btnBg);
    buttonLayer.addChild(btnText);
    buttonLayer.x = W / 2;
    buttonLayer.y = H / 2;

    btnBg.on('pointerover', () => { btnBg.tint = 0xaabbff; });
    btnBg.on('pointerout', () => { btnBg.tint = 0xffffff; });

    const skipLayer = new PIXI.Container();
    skipLayer.eventMode = 'static';
    skipLayer.hitArea = new PIXI.Rectangle(0, 0, W, H);
    skipLayer.cursor = 'pointer';
    skipLayer.visible = false;

    function startCutscene() {
      console.log(`[Cutscene] startCutscene state=${state} currentTime=${player?.currentTime} duration=${player?.duration}`);
      state = 'fading-in';
      fadeStart = performance.now();
      buttonLayer.visible = false;
      if (player) {
        player.root.alpha = 0;
        player.root.visible = true;
        skipLayer.visible = true;
        skipPrompt.alpha = 0;
        root!.stage.addChild(skipPrompt);
        root!.stage.addChild(skipLayer);
        player.seek(0);
        player.play();
      }
    }

    function skipCutscene() {
      if (state !== 'fading-in' && state !== 'playing') return;
      console.log(`[Cutscene] skipCutscene state=${state} currentTime=${player?.currentTime} duration=${player?.duration}`);
      state = 'fading-out';
      fadeStart = performance.now();
      if (player) player.pause();
      skipPrompt.alpha = 0;
    }

    function backToIdle() {
      console.log(`[Cutscene] backToIdle state=${state} currentTime=${player?.currentTime} duration=${player?.duration}`);
      state = 'idle';
      if (player) {
        player.root.alpha = 1;
        player.root.visible = false;
        player.pause();
        player.seek(0);
      }
      skipLayer.visible = false;
      if (skipPrompt.parent) skipPrompt.parent.removeChild(skipPrompt);
      if (skipLayer.parent) skipLayer.parent.removeChild(skipLayer);
      buttonLayer.visible = true;
    }

    function onVideoEnded() {
      console.log(`[Cutscene] onVideoEnded state=${state} currentTime=${player?.currentTime} duration=${player?.duration}`);
      if (state === 'fading-in' || state === 'playing') {
        state = 'fading-out';
        fadeStart = performance.now();
        skipPrompt.alpha = 0;
      }
    }

    btnBg.on('pointerdown', () => {
      if (state === 'idle') startCutscene();
    });

    skipLayer.on('pointerdown', () => {
      if (state === 'fading-in' || state === 'playing') skipCutscene();
    });

    tickerFn = () => {
      if (state === 'fading-in' || state === 'fading-out') {
        const elapsed = performance.now() - fadeStart;
        const t = Math.min(1, elapsed / FADE_DURATION);
        if (state === 'fading-in') {
          if (player) player.root.alpha = t;
          if (t >= 1) state = 'playing';
        } else {
          if (player) player.root.alpha = 1 - t;
          if (t >= 1) backToIdle();
        }
      }
      if (state === 'playing') {
        if (skipPrompt.alpha < 1) {
          skipPrompt.alpha = Math.min(1, skipPrompt.alpha + 0.04);
        }
      }
    };

    const destroyApp = startPixiApp((proxy) => {
      root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
      root.stage.addChild(buttonLayer);

      try {
        player = createVideoPlayer(root, {
          url: STABLE_MP4_URL,
          x: vx, y: vy, width: vw, height: vh,
          loop: false,
          muted: false,
          autoplay: false,
          showControls: false,
          hidePlayButton: true,
          onEnded: onVideoEnded,
          onDebug: (msg) => { console.log(`[PixiVideoPlayer] ${msg}`); },
        });
        player.root.alpha = 1;
        player.root.visible = false;
      } catch (err) {
        console.error('[Cutscene] createVideoPlayer failed:', err);
      }
    });

    if (root) {
      tickerObj = root.ticker;
      tickerObj.add(tickerFn);
    }

    return () => {
      if (tickerObj && tickerFn) tickerObj.remove(tickerFn);
      player?.destroy();
      player = null;
      destroyApp();
    };
  }, []);

  return <></>;
}

ComponentCutsceneDisplay.head = {
  title: 'Component: Cutscene',
  description: 'Click "Play Intro" button to play full-screen cutscene with fade in/out and click-to-skip.',
};
