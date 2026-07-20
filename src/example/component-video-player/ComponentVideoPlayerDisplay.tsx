// Example: Video player rendered on SubCanvas (PixiJS sprite)
import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas } from '@framework';
import { makeInfoPanel } from '@components';
import { createVideoPlayer, createScrollable } from '../../components';
// NOTE: this example uses createVideoPlayer/createScrollable() directly as a component demo. Do NOT migrate to WindowManagerAdapter — standalone component showcases should keep using the direct API.
import type { PixiVideoPlayerHandle, Scrollable } from '../../components';

const STABLE_MP4_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4';

const HUD_W = 248;
const HUD_H = 300;
const LOG_MAX = 100;

export function ComponentVideoPlayerDisplay() {
  useEffect(() => {
    let root: SubCanvas | null = null;
    let hudRegion: SubCanvas | null = null;
    let btnRegion: SubCanvas | null = null;
    let scrollableLog: Scrollable | null = null;
    let player: PixiVideoPlayerHandle | null = null;
    const logTexts: PIXI.Text[] = [];

    const destroyApp = startPixiApp((proxy) => {
      // full-screen region for everything
      root = proxy.createRegion({
        x: 0, y: 0, width: window.innerWidth, height: window.innerHeight,
      });

      makeInfoPanel(root, {
        title: '视频播放器（PIXI）',
        lines: [
          '用途：基于 PIXI 的视频播放器，包含自定义控制栏、进度拖拽和播放/暂停。',
          '测试方法：点击播放，拖拽进度条跳转，悬停显示控制栏，点击中央播放按钮。',
          '预期效果：视频播放与进度条同步，跳转功能正常，控制栏 2.5 秒后自动隐藏。',
        ],
        x: window.innerWidth - 400, y: window.innerHeight - 150,
      });

      // video player dimensions
      const vw = Math.min(window.innerWidth - 40, 640);
      const vh = (vw * 9) / 16;
      const vx = (window.innerWidth - vw) / 2;
      const vy = (window.innerHeight - vh) / 2 - 20;

      player = createVideoPlayer(root, {
        url: STABLE_MP4_URL,
        x: vx, y: vy, width: vw, height: vh,
        autoplay: false, loop: true, muted: false,
        showControls: true,
        onDebug: (msg) => {
          if (!scrollableLog) return;
          const t = new PIXI.Text({
            text: `${new Date().toLocaleTimeString()} ${msg}`,
            style: { fontSize: 10, fill: 0xbbccff, fontFamily: 'monospace' },
          });
          logTexts.push(t);
          scrollableLog.content.addChild(t);
          let ly = 0;
          for (const child of scrollableLog.content.children) {
            (child as PIXI.Text).y = ly;
            ly += 14;
          }
          while (logTexts.length > LOG_MAX) {
            const old = logTexts.shift();
            if (old?.parent) old.parent.removeChild(old);
            old?.destroy();
          }
          scrollableLog.recalc();
          scrollableLog.scrollTo(0, scrollableLog.bounds.height);
        },
      });

      // ── HUD panel as a SubCanvas region ──
      const hudX = window.innerWidth - HUD_W - 12;
      const hudY = 12;

      hudRegion = proxy.createRegion({
        x: hudX,
        y: hudY,
        width: HUD_W,
        height: HUD_H,
      });

      // background
      const hudBg = new PIXI.Graphics()
        .roundRect(0, 0, HUD_W, HUD_H, 4)
        .fill({ color: 0x0d0d18, alpha: 0.92 });
      hudBg.stroke({ width: 1, color: 0x2a2a3a });
      hudRegion.stage.addChild(hudBg);

      // title
      const hudTitle = new PIXI.Text({
        text: 'PixiVideoPlayer Test',
        style: { fontSize: 11, fill: 0x88aaff, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      hudTitle.x = 8;
      hudTitle.y = 6;
      hudRegion.stage.addChild(hudTitle);

      // source line
      const hudSrc = new PIXI.Text({
        text: 'Source: MDN (cc0-videos)',
        style: { fontSize: 9, fill: 0x777, fontFamily: 'monospace' },
      });
      hudSrc.x = 8;
      hudSrc.y = 22;
      hudRegion.stage.addChild(hudSrc);

      // scrollable log inside HUD region
      const scX = 6;
      const scY = 36;
      const scW = HUD_W - 12;
      const scH = HUD_H - scY - 6;

      scrollableLog = createScrollable({
        parent: hudRegion,
        width: scW,
        height: scH,
        direction: 'vertical',
        scrollbar: true,
      });
      scrollableLog.stage.x = scX;
      scrollableLog.stage.y = scY;

      // ── external control buttons as a SubCanvas region ──
      const btnW = 140;
      const btnH = 28;
      const btnGap = 6;
      const totalW = btnW * 2 + btnGap;
      const btnX = (window.innerWidth - totalW) / 2;
      const btnY = window.innerHeight - 48;

      btnRegion = proxy.createRegion({
        x: btnX,
        y: btnY,
        width: totalW,
        height: btnH,
      });

      function pixiBtn(label: string, xOff: number, onClick: () => void) {
        const c = new PIXI.Container();
        c.eventMode = 'static';
        c.cursor = 'pointer';
        c.hitArea = new PIXI.Rectangle(0, 0, btnW, btnH);
        c.x = xOff;
        const bg = new PIXI.Graphics()
          .roundRect(0, 0, btnW, btnH, 4)
          .fill({ color: 0x1a1a2e, alpha: 0.9 });
        bg.stroke({ width: 1, color: 0x446 });
        c.addChild(bg);
        const lbl = new PIXI.Text({
          text: label,
          style: { fontSize: 11, fill: 0xffffff, fontFamily: 'monospace' },
        });
        lbl.x = (btnW - lbl.width) / 2;
        lbl.y = (btnH - lbl.height) / 2;
        c.addChild(lbl);
        c.on('pointerdown', onClick);
        btnRegion!.stage.addChild(c);
      }

      pixiBtn('Ext: Play/Pause', 0, () => player?.toggle());
      pixiBtn('Ext: Restart', btnW + btnGap, () => player?.seek(0));
    });

    return () => {
      player?.destroy();
      player = null;
      scrollableLog?.destroy();
      scrollableLog = null;
      btnRegion?.destroy();
      hudRegion = null;
      hudRegion?.destroy();
      hudRegion = null;
      root = null;
      destroyApp();
    };
  }, []);

  return <></>;
}

ComponentVideoPlayerDisplay.head = {
  title: 'Component: Video Player',
  description: 'Testing standard MP4 video playback in PixiJS v8 with custom UI.',
};
