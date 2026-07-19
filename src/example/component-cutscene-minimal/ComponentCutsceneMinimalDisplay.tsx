import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '../../framework/PixiApp';
import { createVideoPlayer } from '../../components';
import type { PixiVideoPlayerHandle } from '../../components';
import type { SubCanvas } from '../../framework/SubCanvas';
import { makeInfoPanel } from '../../framework';

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

    const btnW = 200;
    const btnH = 56;
    const startBtn = new PIXI.Graphics()
      .roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 8)
      .fill({ color: 0x1a1a2e, alpha: 0.92 });
    startBtn.stroke({ width: 2, color: 0x446 });
    startBtn.eventMode = 'static';
    startBtn.cursor = 'pointer';
    startBtn.hitArea = new PIXI.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH);
    const startText = new PIXI.Text({
      text: '\u25B6  Start Video',
      style: { fontSize: 16, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
    });
    startText.anchor.set(0.5);
    const startContainer = new PIXI.Container();
    startContainer.x = W / 2;
    startContainer.y = H / 2;
    startContainer.addChild(startBtn);
    startContainer.addChild(startText);
    startBtn.on('pointerover', () => { startBtn.tint = 0xaabbff; });
    startBtn.on('pointerout', () => { startBtn.tint = 0xffffff; });

    const destroyApp = startPixiApp((proxy) => {
      root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
      makeInfoPanel(root, { title: '过场动画（基础版）', lines: ['用途：基础过场动画测试——原生 PIXI.App + <video> + 精灵，不使用 SubCanvas', '测试方法：点击开始播放', '预期效果：视频直接在画布上渲染，无需 SubCanvas 抽象层'], x: window.innerWidth - 400, y: window.innerHeight - 150 });
      root.stage.addChild(startContainer);

      player = createVideoPlayer(root, {
        url: STABLE_MP4_URL,
        x: finalX, y: vy, width: vw2, height: vh2,
        autoplay: false,
        loop: true,
        muted: false,
        showControls: true,
        onDebug: (msg) => { console.log(`[Minimal] ${msg}`); },
      });
      player.stage.visible = false;

      startBtn.on('pointerdown', () => {
        if (!player) return;
        startContainer.visible = false;
        player.stage.visible = true;
        player.play();
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
  description: 'Sanity test: single PIXI.App via SubCanvas + createVideoPlayer, click-to-start with sound. Hidden until click to avoid first-render race with video primer (see README gotcha #20).',
};
