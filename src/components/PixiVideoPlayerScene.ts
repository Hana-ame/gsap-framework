import * as PIXI from 'pixi.js';

const CTRL_H = 30;
const BTN_R = 11;
const TIME_W = 110;

export function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '--:--';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export interface VideoPlayerSceneGraph {
  root: PIXI.Container;
  mask: PIXI.Graphics;
  hoverHit: PIXI.Container;
  bg: PIXI.Graphics;
  videoSprite: PIXI.Sprite;
  cpb: PIXI.Container;
  ctrl: PIXI.Container;
  ctrlBg: PIXI.Graphics;
  playBtn: PIXI.Container;
  playIcon: PIXI.Graphics;
  timeText: PIXI.Text;
  progBg: PIXI.Graphics;
  progFill: PIXI.Graphics;
  seekHit: PIXI.Container;
  drawPlayIcon: (playing: boolean) => void;
  drawProgress: (pct: number) => void;
  barX: number;
  barW: number;
}

export function buildVideoPlayerSceneGraph(
  width: number,
  height: number,
  cpbVisibleAllowed: boolean,
  showControlsOpt: boolean,
): VideoPlayerSceneGraph {
  const root = new PIXI.Container();

  const mask = new PIXI.Graphics().rect(0, 0, width, height).fill({ color: 0xffffff });
  root.addChild(mask);
  root.mask = mask;

  const hoverHit = new PIXI.Container();
  hoverHit.eventMode = 'static';
  hoverHit.hitArea = new PIXI.Rectangle(0, 0, width, height);
  root.addChild(hoverHit);

  const bg = new PIXI.Graphics().rect(0, 0, width, height).fill({ color: 0x1a1a2e });
  root.addChild(bg);
  bg.zIndex = 0;

  const videoSprite = new PIXI.Sprite();
  videoSprite.zIndex = 1;
  root.addChild(videoSprite);

  const cpb = new PIXI.Container();
  cpb.eventMode = 'static';
  cpb.cursor = 'pointer';
  cpb.x = width / 2;
  cpb.y = height / 2;
  cpb.hitArea = new PIXI.Circle(0, 0, 32);
  const cpbBg = new PIXI.Graphics().circle(0, 0, 32).fill({ color: 0x000000, alpha: 0.55 });
  cpb.addChild(cpbBg);
  const cpbTri = new PIXI.Graphics().poly([-10, -8, -10, 8, 8, 0]).fill({ color: 0xffffff });
  cpb.addChild(cpbTri);
  if (!cpbVisibleAllowed) cpb.eventMode = 'none';
  root.addChild(cpb);
  cpb.zIndex = 2;

  const ctrl = new PIXI.Container();
  ctrl.y = height - CTRL_H;
  if (!showControlsOpt) ctrl.eventMode = 'none';
  root.addChild(ctrl);
  ctrl.zIndex = 3;

  const ctrlBg = new PIXI.Graphics().rect(0, 0, width, CTRL_H).fill({ color: 0x0a0a14, alpha: 0.85 });
  ctrl.addChild(ctrlBg);

  const playBtn = new PIXI.Container();
  playBtn.eventMode = 'static';
  playBtn.cursor = 'pointer';
  playBtn.hitArea = new PIXI.Circle(CTRL_H / 2, CTRL_H / 2, BTN_R);
  const playBtnBg = new PIXI.Graphics().circle(CTRL_H / 2, CTRL_H / 2, BTN_R).fill({ color: 0xffffff });
  playBtn.addChild(playBtnBg);
  const playIcon = new PIXI.Graphics();
  playBtn.addChild(playIcon);

  function drawPlayIcon(playing: boolean) {
    playIcon.clear();
    if (playing) {
      playIcon.rect(CTRL_H / 2 - 4, CTRL_H / 2 - 5, 3, 10).fill({ color: 0x1a1a2e });
      playIcon.rect(CTRL_H / 2 + 1, CTRL_H / 2 - 5, 3, 10).fill({ color: 0x1a1a2e });
    } else {
      playIcon.poly([CTRL_H / 2 - 3, CTRL_H / 2 - 6, CTRL_H / 2 - 3, CTRL_H / 2 + 6, CTRL_H / 2 + 6, CTRL_H / 2]).fill({ color: 0x1a1a2e });
    }
  }
  drawPlayIcon(false);
  cpb.visible = cpbVisibleAllowed;
  ctrl.addChild(playBtn);

  const timeText = new PIXI.Text({ text: '--:-- / --:--', style: { fontSize: 11, fill: 0xcccccc, fontFamily: 'monospace' } });
  timeText.x = width - TIME_W - 8;
  timeText.y = (CTRL_H - timeText.height) / 2;
  ctrl.addChild(timeText);

  const barX = CTRL_H + 6;
  const barY = CTRL_H / 2 - 3;
  const barW = width - barX - TIME_W - 16;
  const barH = 6;

  const progBg = new PIXI.Graphics().roundRect(barX, barY, barW, barH, 3).fill({ color: 0x444466 });
  ctrl.addChild(progBg);

  const progFill = new PIXI.Graphics();
  ctrl.addChild(progFill);

  function drawProgress(pct: number) {
    progFill.clear();
    if (pct > 0) {
      progFill.roundRect(barX, barY, Math.max(2, pct * barW), barH, 3).fill({ color: 0x88aaff });
    }
  }

  const seekHit = new PIXI.Container();
  seekHit.eventMode = 'static';
  seekHit.cursor = 'pointer';
  seekHit.hitArea = new PIXI.Rectangle(barX, barY - 4, barW, barH + 8);
  ctrl.addChild(seekHit);

  return {
    root, mask, hoverHit, bg, videoSprite,
    cpb, ctrl, ctrlBg, playBtn, playIcon,
    timeText, progBg, progFill, seekHit,
    drawPlayIcon, drawProgress, barX, barW,
  };
}
