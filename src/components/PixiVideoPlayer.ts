import * as PIXI from 'pixi.js';
import type { SubCanvas } from '../framework';

export interface PixiVideoPlayerOptions {
  url: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  loop?: boolean;
  muted?: boolean;
  autoplay?: boolean;
  showControls?: boolean;
  onLoad?: () => void;
  onError?: (e: Error) => void;
  onDebug?: (msg: string) => void;
}

export interface PixiVideoPlayerHandle {
  play(): void;
  pause(): void;
  toggle(): void;
  seek(t: number): void;
  destroy(): void;
  destroyed: boolean;
  setControlsVisible(v: boolean): void;
  readonly paused: boolean;
  readonly duration: number;
  readonly currentTime: number;
}

const CTRL_H = 30;
const BTN_R = 11;
const TIME_W = 110;

function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '--:--';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function createVideoPlayer(
  parent: SubCanvas,
  opts: PixiVideoPlayerOptions,
): PixiVideoPlayerHandle {
  const {
    url,
    x = 0,
    y = 0,
    width,
    height,
    loop = false,
    muted = true,
    autoplay = false,
    showControls: showControlsOpt = true,
    onLoad,
    onError,
    onDebug,
  } = opts;

  function dbg(msg: string) {
    console.log(`[PixiVideoPlayer] ${msg}`);
    onDebug?.(msg);
  }

  let destroyed = false;
  let objectUrl: string | null = null;
  let paused = !autoplay;
  let duration = 0;
  let seeking = false;
  let controlsVisible = showControlsOpt;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let curTime = 0;

  // ── scene graph ──
  const root = new PIXI.Container();
  root.x = x;
  root.y = y;
  parent.stage.addChild(root);

  const mask = new PIXI.Graphics().rect(0, 0, width, height).fill({ color: 0xffffff });
  root.addChild(mask);
  root.mask = mask;

  const hoverHit = new PIXI.Container();
  hoverHit.eventMode = 'static';
  hoverHit.hitArea = new PIXI.Rectangle(0, 0, width, height);
  root.addChild(hoverHit);

  const bg = new PIXI.Graphics().rect(0, 0, width, height).fill({ color: 0x1a1a2e });
  root.addChild(bg);

  const videoSprite = new PIXI.Sprite();
  root.addChild(videoSprite);

  // ── center play button ──
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
  root.addChild(cpb);

  // ── controls bar ──
  const ctrl = new PIXI.Container();
  ctrl.y = height - CTRL_H;
  root.addChild(ctrl);

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
  drawPlayIcon(autoplay);
  cpb.visible = !autoplay;
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

  // ── CORE VIDEO INIT (完全同步，无 async/await 隐患) ──
  const htmlVideo = document.createElement('video');
  htmlVideo.crossOrigin = 'anonymous';
  htmlVideo.playsInline = true;
  htmlVideo.muted = muted;
  htmlVideo.loop = loop;

  const videoSource = new PIXI.VideoSource({
    resource: htmlVideo,
    autoPlay: autoplay,
    updateFPS: 30,
  });
  const videoTexture = new PIXI.Texture({ source: videoSource });

  videoSprite.texture = videoTexture;
  // 不在 texture 加载前设 sprite.width/height，否则 scale 基于 1x1 默认值算错
  // 改为在 loadedmetadata 之后设

  // ── seek events ──
  function onSeekDown(e: PIXI.FederatedPointerEvent) {
    if (duration <= 0) return;
    seeking = true;
    const pt = ctrl.toLocal(e.global);
    const pct = Math.max(0, Math.min(1, (pt.x - barX) / barW));
    htmlVideo.currentTime = pct * duration;
    window.addEventListener('pointermove', onWinMove);
    window.addEventListener('pointerup', onWinUp);
  }

  function onWinMove(e: PointerEvent) {
    if (!seeking) return;
    const canvas = parent.canvas;
    const rect = canvas.getBoundingClientRect();
    const res = parent.rootApp.renderer.resolution || 1;
    const globalX = (e.clientX - rect.left) * (canvas.width / rect.width / res);
    const pt = ctrl.toLocal({ x: globalX, y: 0 });
    const pct = Math.max(0, Math.min(1, (pt.x - barX) / barW));
    if (duration > 0) htmlVideo.currentTime = pct * duration;
  }

  function onWinUp() {
    if (!seeking) return;
    seeking = false;
    window.removeEventListener('pointermove', onWinMove);
    window.removeEventListener('pointerup', onWinUp);
  }
  seekHit.on('pointerdown', onSeekDown);

  // 同步触发播放，避免浏览器报 NotAllowedError
  function doPlayAction() {
    if (htmlVideo.paused) {
      htmlVideo.play().catch((e) => dbg(`Play rejected: ${e.message}`));
    } else {
      htmlVideo.pause();
    }
  }

  playBtn.on('pointerdown', (e: PIXI.FederatedPointerEvent) => { e.stopPropagation(); doPlayAction(); });
  cpb.on('pointerdown', (e: PIXI.FederatedPointerEvent) => { e.stopPropagation(); doPlayAction(); });

  function showCtrlsTmp() {
    ctrl.visible = true;
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { if (!destroyed) ctrl.visible = false; }, 2500);
  }
  hoverHit.on('pointermove', () => { if (controlsVisible) showCtrlsTmp(); });
  ctrl.visible = showControlsOpt;
  if (showControlsOpt) showCtrlsTmp();

  let fallbackAttempted = false;

  // 使用命名函数以便 destroy 时 removeEventListener
  const onLoadedMeta = () => {
    if (destroyed) return;
    duration = htmlVideo.duration || 0;
    // texture 已有真实尺寸，此时设 sprite 宽高 scale 计算正确
    videoSprite.width = width;
    videoSprite.height = height;
    dbg(`loadedmetadata duration=${duration} vw=${videoSprite.width} vh=${videoSprite.height}`);
    onLoad?.();
  };

  const onTimeUpdate = () => {
    if (destroyed) return;
    curTime = htmlVideo.currentTime;
    if (!duration && htmlVideo.duration) duration = htmlVideo.duration;
    const pct = duration > 0 ? curTime / duration : 0;
    drawProgress(pct);
    timeText.text = `${fmt(curTime)} / ${fmt(duration)}`;
  };

  const onSeeked = () => {
    if (destroyed) return;
    curTime = htmlVideo.currentTime;
    const pct = duration > 0 ? curTime / duration : 0;
    drawProgress(pct);
    timeText.text = `${fmt(curTime)} / ${fmt(duration)}`;
  };

  const onPlay = () => {
    if (destroyed) return;
    paused = false;
    drawPlayIcon(true);
    cpb.visible = false;
  };

  const onPause = () => {
    if (destroyed) return;
    paused = true;
    drawPlayIcon(false);
    cpb.visible = true;
  };

  const onVideoError = async () => {
    if (destroyed || fallbackAttempted) return;
    const code = htmlVideo.error?.code;
    dbg(`Native video error code: ${code}`);

    // CORS 或代理导致拦截时，无缝开启 Blob 获取模式
    if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || code === MediaError.MEDIA_ERR_NETWORK) {
      fallbackAttempted = true;
      dbg('Attempting Blob fetch fallback...');
      try {
        const resp = await fetch(url);
        if (destroyed) return;
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const rawBlob = await resp.blob();
        const mp4Blob = new Blob([rawBlob], { type: 'video/mp4' });
        objectUrl = URL.createObjectURL(mp4Blob);

        // 更换 Blob 地址，重新拉起
        htmlVideo.src = objectUrl;
        htmlVideo.load();
        if (autoplay) htmlVideo.play().catch(()=>{});
        return;
      } catch (err) {
        dbg(`Fallback failed: ${err}`);
      }
    }

    if (destroyed) return;
    // 如果 Blob 降级也失败了，再呈现报错界面
    onError?.(new Error(`Video error ${code}`));
    const errText = new PIXI.Text({ text: 'Load failed', style: { fontSize: 11, fill: 0xff6666, fontFamily: 'monospace' } });
    errText.x = (width - errText.width) / 2;
    errText.y = (height - errText.height) / 2;
    root.addChild(errText);
  };

  htmlVideo.addEventListener('loadedmetadata', onLoadedMeta);
  htmlVideo.addEventListener('timeupdate', onTimeUpdate);
  htmlVideo.addEventListener('seeked', onSeeked);
  htmlVideo.addEventListener('play', onPlay);
  htmlVideo.addEventListener('pause', onPause);
  htmlVideo.addEventListener('error', onVideoError);

  // 触发原生加载
  htmlVideo.src = url;
  htmlVideo.load();
  if (autoplay) htmlVideo.play().catch(()=>{});

  // ── handle ──
  const handle: PixiVideoPlayerHandle = {
    play() { if (!destroyed) htmlVideo.play().catch(()=>{}); },
    pause() { if (!destroyed) htmlVideo.pause(); },
    toggle() { if (!destroyed) { if (htmlVideo.paused) htmlVideo.play().catch(()=>{}); else htmlVideo.pause(); } },
    seek(t: number) { if (!destroyed) htmlVideo.currentTime = t; },
    destroy() {
      if (destroyed) return;
      destroyed = true;

      // 1. unbind video event handlers FIRST (prevent callbacks on half-destroyed gfx)
      htmlVideo.removeEventListener('loadedmetadata', onLoadedMeta);
      htmlVideo.removeEventListener('timeupdate', onTimeUpdate);
      htmlVideo.removeEventListener('seeked', onSeeked);
      htmlVideo.removeEventListener('play', onPlay);
      htmlVideo.removeEventListener('pause', onPause);
      htmlVideo.removeEventListener('error', onVideoError);

      // 2. stop the video engine
      htmlVideo.pause();
      htmlVideo.src = '';
      htmlVideo.load();

      // 3. PIXI cleanup
      if (hideTimer) clearTimeout(hideTimer);
      window.removeEventListener('pointermove', onWinMove);
      window.removeEventListener('pointerup', onWinUp);

      if (objectUrl) URL.revokeObjectURL(objectUrl);

      try { videoTexture.destroy(true); } catch { /* ok */ }
      try { videoSource.destroy(); } catch { /* ok */ }

      if (root.parent) root.parent.removeChild(root);
      root.destroy({ children: true });
    },
    setControlsVisible(v: boolean) {
      controlsVisible = v;
      ctrl.visible = v;
    },
    get destroyed() { return destroyed; },
    get paused() { return paused; },
    get duration() { return duration; },
    get currentTime() { return curTime; },
  };

  return handle;
}
