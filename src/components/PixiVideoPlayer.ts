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
  let videoTexture: PIXI.Texture | null = null;
  let htmlVideo: HTMLVideoElement | null = null;
  let paused = true;
  let duration = 0;
  let seeking = false;
  let controlsVisible = showControlsOpt;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let curTime = 0;
  let loadCancelled = false;
  let isLoading = false;

  dbg(`create x=${x} y=${y} w=${width} h=${height} url=${url.slice(0,60)}...`);

  // ── scene graph ──
  const root = new PIXI.Container();
  root.x = x;
  root.y = y;
  parent.stage.addChild(root);

  // clip mask
  const mask = new PIXI.Graphics()
    .rect(0, 0, width, height)
    .fill({ color: 0xffffff });
  root.addChild(mask);
  root.mask = mask;

  // hover hit (placed before controls so controls render on top)
  const hoverHit = new PIXI.Container();
  hoverHit.eventMode = 'static';
  hoverHit.hitArea = new PIXI.Rectangle(0, 0, width, height);
  root.addChild(hoverHit);

  // placeholder background
  const bg = new PIXI.Graphics()
    .rect(0, 0, width, height)
    .fill({ color: 0x1a1a2e });
  root.addChild(bg);

  // video sprite
  const videoSprite = new PIXI.Sprite();
  root.addChild(videoSprite);

  // ── center play button ──
  const cpb = new PIXI.Container();
  cpb.eventMode = 'static';
  cpb.cursor = 'pointer';
  cpb.x = width / 2;
  cpb.y = height / 2;
  cpb.hitArea = new PIXI.Circle(0, 0, 32);

  const cpbBg = new PIXI.Graphics()
    .circle(0, 0, 32)
    .fill({ color: 0x000000, alpha: 0.55 });
  cpb.addChild(cpbBg);

  const cpbTri = new PIXI.Graphics()
    .poly([-10, -8, -10, 8, 8, 0])
    .fill({ color: 0xffffff });
  cpb.addChild(cpbTri);

  root.addChild(cpb);

  // ── controls bar ──
  const ctrl = new PIXI.Container();
  ctrl.y = height - CTRL_H;
  root.addChild(ctrl);

  // bar background
  const ctrlBg = new PIXI.Graphics()
    .rect(0, 0, width, CTRL_H)
    .fill({ color: 0x0a0a14, alpha: 0.85 });
  ctrl.addChild(ctrlBg);

  // ── play/pause button ──
  const playBtn = new PIXI.Container();
  playBtn.eventMode = 'static';
  playBtn.cursor = 'pointer';
  playBtn.hitArea = new PIXI.Circle(CTRL_H / 2, CTRL_H / 2, BTN_R);

  const playBtnBg = new PIXI.Graphics()
    .circle(CTRL_H / 2, CTRL_H / 2, BTN_R)
    .fill({ color: 0xffffff });
  playBtn.addChild(playBtnBg);

  const playIcon = new PIXI.Graphics();
  playBtn.addChild(playIcon);

  function drawPlayIcon(playing: boolean) {
    playIcon.clear();
    if (playing) {
      playIcon
        .rect(CTRL_H / 2 - 4, CTRL_H / 2 - 5, 3, 10)
        .fill({ color: 0x1a1a2e });
      playIcon
        .rect(CTRL_H / 2 + 1, CTRL_H / 2 - 5, 3, 10)
        .fill({ color: 0x1a1a2e });
    } else {
      playIcon
        .poly([
          CTRL_H / 2 - 3, CTRL_H / 2 - 6,
          CTRL_H / 2 - 3, CTRL_H / 2 + 6,
          CTRL_H / 2 + 6, CTRL_H / 2,
        ])
        .fill({ color: 0x1a1a2e });
    }
  }
  drawPlayIcon(false);
  ctrl.addChild(playBtn);

  // ── time text ──
  const timeText = new PIXI.Text({
    text: '--:-- / --:--',
    style: { fontSize: 11, fill: 0xcccccc, fontFamily: 'monospace' },
  });
  timeText.x = width - TIME_W - 8;
  timeText.y = (CTRL_H - timeText.height) / 2;
  ctrl.addChild(timeText);

  // ── progress bar ──
  const barX = CTRL_H + 6;
  const barY = CTRL_H / 2 - 3;
  const barW = width - barX - TIME_W - 16;
  const barH = 6;

  const progBg = new PIXI.Graphics()
    .roundRect(barX, barY, barW, barH, 3)
    .fill({ color: 0x444466 });
  ctrl.addChild(progBg);

  const progFill = new PIXI.Graphics();
  ctrl.addChild(progFill);

  function drawProgress(pct: number) {
    progFill.clear();
    if (pct > 0) {
      progFill
        .roundRect(barX, barY, Math.max(2, pct * barW), barH, 3)
        .fill({ color: 0x88aaff });
    }
  }

  // seek hit area
  const seekHit = new PIXI.Container();
  seekHit.eventMode = 'static';
  seekHit.cursor = 'pointer';
  seekHit.hitArea = new PIXI.Rectangle(barX, barY - 4, barW, barH + 8);
  ctrl.addChild(seekHit);

  // ── events ──
  function onSeekDown(e: PIXI.FederatedPointerEvent) {
    if (!htmlVideo || duration <= 0) return;
    seeking = true;

    const pt = ctrl.toLocal(e.global);
    const relX = pt.x - barX;
    const pct = Math.max(0, Math.min(1, relX / barW));
    htmlVideo.currentTime = pct * duration;

    window.addEventListener('pointermove', onWinMove);
    window.addEventListener('pointerup', onWinUp);
  }

  function onWinMove(e: PointerEvent) {
    if (!seeking || !htmlVideo) return;

    // convert DOM clientX to PIXI global coordinate
    const canvas = parent.canvas;
    const rect = canvas.getBoundingClientRect();
    const res = parent.rootApp.renderer.resolution || 1;
    const globalX = (e.clientX - rect.left) * (canvas.width / rect.width / res);

    const pt = ctrl.toLocal({ x: globalX, y: 0 });
    const relX = pt.x - barX;
    const pct = Math.max(0, Math.min(1, relX / barW));
    if (duration > 0) {
      htmlVideo.currentTime = pct * duration;
    }
  }

  function onWinUp() {
    if (!seeking) return;
    seeking = false;
    window.removeEventListener('pointermove', onWinMove);
    window.removeEventListener('pointerup', onWinUp);
  }

  seekHit.on('pointerdown', onSeekDown);

  function doPlayAction() {
    dbg(`doPlayAction htmlVideo=${!!htmlVideo} paused=${htmlVideo?.paused} destroyed=${destroyed}`);
    if (!htmlVideo) {
      loadAndPlay(true);
      return;
    }
    if (htmlVideo.paused) {
      htmlVideo.play().catch(() => {});
    } else {
      htmlVideo.pause();
    }
  }

  playBtn.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
    e.stopPropagation();
    doPlayAction();
  });

  cpb.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
    e.stopPropagation();
    doPlayAction();
  });

  // ── controls show/hide ──
  function showCtrlsTmp() {
    ctrl.visible = true;
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (!destroyed) ctrl.visible = false;
    }, 2500);
  }

  hoverHit.on('pointermove', () => {
    if (controlsVisible) showCtrlsTmp();
  });

  ctrl.visible = showControlsOpt;
  if (showControlsOpt) showCtrlsTmp();

  // ── helpers: custom video element loader (bypass PIXI.Assets.load for detailed error info) ──
  function mediaErrorReason(video: HTMLVideoElement): string {
    const code = video.error?.code;
    if (code === MediaError.MEDIA_ERR_ABORTED) return 'ABORTED(1)';
    if (code === MediaError.MEDIA_ERR_NETWORK) return 'NETWORK(2)';
    if (code === MediaError.MEDIA_ERR_DECODE) return 'DECODE(3)';
    if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) return 'SRC_NOT_SUPPORTED(4)';
    return `unknown(${code})`;
  }

  function loadVideoElement(): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'auto';
      video.muted = muted;
      video.loop = loop;
      video.playsInline = true;

      const onCanPlay = () => {
        cleanup();
        dbg(`video canplay readyState=${video.readyState} w=${video.videoWidth} h=${video.videoHeight}`);
        resolve(video);
      };
      const onError = () => {
        cleanup();
        const reason = mediaErrorReason(video);
        dbg(`video error code=${video.error?.code} reason=${reason}`);
        reject(new Error(`VideoError: ${reason}`));
      };
      function cleanup() {
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('error', onError);
      }

      video.addEventListener('canplay', onCanPlay);
      video.addEventListener('error', onError);

      // Check if already ready (cached)
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA && video.videoWidth > 0) {
        cleanup();
        resolve(video);
        return;
      }

      video.src = url;
      video.load();
    });
  }

  function attachVideoListeners() {
    if (!htmlVideo) return;
    htmlVideo.loop = loop;
    htmlVideo.muted = muted;

    duration = htmlVideo.duration || 0;
    dbg(`initial duration=${duration} readyState=${htmlVideo.readyState} paused=${htmlVideo.paused}`);

    htmlVideo.addEventListener('loadedmetadata', () => {
      duration = htmlVideo?.duration || 0;
      dbg(`loadedmetadata duration=${duration}`);
    });

    htmlVideo.addEventListener('timeupdate', () => {
      if (!htmlVideo || destroyed) return;
      curTime = htmlVideo.currentTime;
      if (!duration && htmlVideo.duration) duration = htmlVideo.duration;
      const pct = duration > 0 ? curTime / duration : 0;
      drawProgress(pct);
      timeText.text = `${fmt(curTime)} / ${fmt(duration)}`;
    });

    htmlVideo.addEventListener('seeked', () => {
      if (!htmlVideo || destroyed) return;
      curTime = htmlVideo.currentTime;
      if (!duration && htmlVideo.duration) duration = htmlVideo.duration;
      const pct = duration > 0 ? curTime / duration : 0;
      drawProgress(pct);
      timeText.text = `${fmt(curTime)} / ${fmt(duration)}`;
    });

    htmlVideo.addEventListener('play', () => {
      dbg('native video play event');
      paused = false;
      drawPlayIcon(true);
      cpb.visible = false;
    });

    htmlVideo.addEventListener('pause', () => {
      dbg(`native video pause event currentTime=${htmlVideo?.currentTime}`);
      paused = true;
      drawPlayIcon(false);
      cpb.visible = true;
    });

    htmlVideo.addEventListener('ended', () => {
      dbg('native video ended event');
      paused = true;
      drawPlayIcon(false);
      cpb.visible = true;
    });

    // initial UI sync
    curTime = htmlVideo.currentTime;
    if (!duration && htmlVideo.duration) duration = htmlVideo.duration;
    const initPct = duration > 0 ? curTime / duration : 0;
    drawProgress(initPct);
    timeText.text = `${fmt(curTime)} / ${fmt(duration)}`;
    dbg(`initial sync curTime=${curTime} duration=${duration} pct=${initPct}`);
  }

  // ── loading ──
  async function loadAndPlay(forcePlay = false) {
    dbg(`loadAndPlay forcePlay=${forcePlay} isLoading=${isLoading} loadCancelled=${loadCancelled} htmlVideo=${!!htmlVideo}`);
    if (loadCancelled || isLoading) return;

    // already loaded — just play if needed
    if (htmlVideo) {
      dbg('loadAndPlay: already loaded, just play');
      if (autoplay || forcePlay) htmlVideo.play().catch(() => {});
      return;
    }

    isLoading = true;
    try {
      dbg('loadVideoElement start...');
      const video = await loadVideoElement();
      dbg(`loadVideoElement done readyState=${video.readyState} duration=${video.duration}`);

      if (loadCancelled || destroyed) {
        dbg('loadAndPlay: cancelled after load');
        video.removeAttribute('src');
        video.load();
        return;
      }

      // Create PIXI VideoSource + Texture from the loaded video element
      const source = new PIXI.VideoSource({
        resource: video,
        autoPlay: false,
        autoLoad: false,
        playsinline: true,
        updateFPS: 30,
      });
      dbg('VideoSource created, calling source.load()...');
      await source.load();
      dbg('VideoSource.load() done');

      const texture = new PIXI.Texture({ source });

      videoTexture = texture;
      videoSprite.texture = texture;
      videoSprite.width = width;
      videoSprite.height = height;

      htmlVideo = video;
      attachVideoListeners();

      if (autoplay || forcePlay) {
        dbg('calling htmlVideo.play()...');
        await htmlVideo.play().catch((e: Error) => dbg(`play() rejected: ${e.message}`));
        dbg(`htmlVideo.play() done paused=${htmlVideo.paused}`);
      } else {
        htmlVideo.pause();
        paused = true;
        drawPlayIcon(false);
        cpb.visible = true;
      }

      onLoad?.();
    } catch (err) {
      dbg(`loadAndPlay error: ${err instanceof Error ? err.message : String(err)}`);
      if (loadCancelled || destroyed) return;
      const msg = err instanceof Error ? err.message : String(err);
      onError?.(err instanceof Error ? err : new Error(msg));

      const errText = new PIXI.Text({
        text: 'Video load failed: ' + (err instanceof Error ? err.message : 'unknown'),
        style: { fontSize: 14, fill: 0xff6666, fontFamily: 'monospace' },
      });
      errText.x = (width - errText.width) / 2;
      errText.y = (height - errText.height) / 2;
      root.addChild(errText);
    } finally {
      isLoading = false;
      dbg('loadAndPlay done');
    }
  }

  if (autoplay) {
    loadAndPlay();
  }

  // ── handle ──
  const handle: PixiVideoPlayerHandle = {
    play() {
      if (destroyed) return;
      if (!htmlVideo) { loadAndPlay(true); return; }
      htmlVideo.play().catch(() => {});
    },
    pause() {
      if (destroyed || !htmlVideo) return;
      htmlVideo.pause();
    },
    toggle() {
      if (destroyed) return;
      if (!htmlVideo) { loadAndPlay(true); return; }
      if (htmlVideo.paused) {
        htmlVideo.play().catch(() => {});
      } else {
        htmlVideo.pause();
      }
    },
    seek(t: number) {
      if (destroyed || !htmlVideo) return;
      htmlVideo.currentTime = t;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      loadCancelled = true;
      if (hideTimer) clearTimeout(hideTimer);
      window.removeEventListener('pointermove', onWinMove);
      window.removeEventListener('pointerup', onWinUp);
      if (videoTexture) {
        try { videoTexture.destroy(); } catch { /* ok */ }
        videoTexture = null;
      }
      if (root.parent) {
        root.parent.removeChild(root);
      }
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
