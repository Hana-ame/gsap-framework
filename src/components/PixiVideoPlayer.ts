/** Video player with controls (play/pause, seek, volume) rendered in PixiJS. */
import * as PIXI from 'pixi.js';
import type { SubCanvas } from '@framework';
import { buildVideoPlayerSceneGraph, fmt } from './PixiVideoPlayerScene';

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
  hidePlayButton?: boolean;
  onLoad?: () => void;
  onError?: (e: Error) => void;
  onEnded?: () => void;
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
  readonly stage: PIXI.Container;
  readonly root: PIXI.Container;
  readonly paused: boolean;
  readonly duration: number;
  readonly currentTime: number;
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
    hidePlayButton = false,
    onLoad,
    onError,
    onEnded,
    onDebug,
  } = opts;

  function dbg(msg: string) {
    console.log(`[PixiVideoPlayer] ${msg}`);
    onDebug?.(msg);
  }

  let destroyed = false;
  dbg(`createVideoPlayer start url=${url} autoplay=${autoplay} muted=${muted} loop=${loop}`);
  let objectUrl: string | null = null;
  let paused = true;
  let duration = 0;
  let seeking = false;
  let controlsVisible = showControlsOpt;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let curTime = 0;
  let videoSource: PIXI.VideoSource | null = null;
  let videoTexture: PIXI.Texture | null = null;
  let userPlayRequested = false;
  const cpbVisibleAllowed = !hidePlayButton;

  // ── scene graph ──
  const {
    root: sceneRoot, hoverHit, videoSprite,
    cpb, ctrl, playBtn,
    timeText, seekHit,
    drawPlayIcon, drawProgress, barX, barW,
  } = buildVideoPlayerSceneGraph(width, height, cpbVisibleAllowed, showControlsOpt);

  const root = sceneRoot;
  root.x = x;
  root.y = y;
  parent.stage.addChild(root);

  // ── VIDEO SETUP ──
  // 参照 PixiJS 官方 loadVideoTextures 流程：先设 src → 等 canplay → 再建 VideoSource
  // 空 src 时创建 VideoSource 会在 Firefox 上触发 error 事件导致 listener 被移除
  const htmlVideo = document.createElement('video');
  htmlVideo.crossOrigin = 'anonymous';
  htmlVideo.playsInline = true;
  htmlVideo.muted = muted;
  htmlVideo.loop = loop;

  // 挂到 DOM 防止 Chrome 跳过画面解码
  // 1px 极小元素 + opacity:0 会让 Chrome 判定为"不可见"，严重降帧解码 → 画面卡顿
  // 用 off-screen 定位 + 合理尺寸，Chrome 不会 throttle
  htmlVideo.style.position = 'absolute';
  htmlVideo.style.left = '-9999px';
  htmlVideo.style.top = '0';
  htmlVideo.style.width = `${width}px`;
  htmlVideo.style.height = `${height}px`;
  htmlVideo.style.pointerEvents = 'none';
  document.body.appendChild(htmlVideo);

  let videoReady = false;

  function initVideoSource() {
    if (destroyed || videoReady) return;
    videoReady = true;
    dbg('initVideoSource: creating VideoSource + Texture');
    videoSource = new PIXI.VideoSource({
      resource: htmlVideo,
      autoPlay: false,
      updateFPS: 0,
    });
    try { (videoSource as unknown as { mipLevelCount?: number }).mipLevelCount = 1; } catch { /* ok */ }
    dbg(`initVideoSource: source mipLevelCount=${(videoSource as unknown as { mipLevelCount?: number }).mipLevelCount}`);
    videoTexture = new PIXI.Texture({ source: videoSource });
    videoSprite.texture = videoTexture;
    try { videoSource.update(); } catch (e) { dbg('initVideoSource: source.update() THREW ' + String(e)); }
    adjustSpriteScale();

    if (autoplay) {
      userPlayRequested = true;
      htmlVideo.play().catch(() => {
        if (destroyed) return;
        dbg('autoplay blocked by browser policy; UI stays paused, await user click');
      });
    } else {
      const prevMuted = htmlVideo.muted;
      htmlVideo.muted = true;
      htmlVideo.play().then(() => {
        if (destroyed) return;
        if (userPlayRequested) {
          htmlVideo.muted = prevMuted;
          dbg('prime skipped: user already playing');
          return;
        }
        htmlVideo.pause();
        htmlVideo.currentTime = 0;
        htmlVideo.muted = prevMuted;
        dbg('primed first frame');
      }).catch(() => {
        if (destroyed) return;
        htmlVideo.muted = prevMuted;
        dbg('first-frame prime rejected');
      });
    }
  }

  // 顺序：先注册 canplay listener（防同步 canplay 漏） → 再 set src/load → 最后 readyState 检查
  // readyState 检查必须放在 src 赋值之后才有意义（之前 readyState 永远 0）
  htmlVideo.addEventListener('canplay', () => { dbg(`canplay event readyState=${htmlVideo.readyState} networkState=${htmlVideo.networkState}`); initVideoSource(); }, { once: true });
  dbg(`setting src=${url}`);
  htmlVideo.src = url;
  htmlVideo.load();
  dbg(`after load() readyState=${htmlVideo.readyState} networkState=${htmlVideo.networkState}`);
  if (htmlVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    initVideoSource();
  }

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

  function doPlayAction() {
    if (htmlVideo.paused) {
      userPlayRequested = true;
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

  function adjustSpriteScale() {
    if (videoSprite.destroyed) return;
    const vw = htmlVideo.videoWidth;
    const vh = htmlVideo.videoHeight;
    if (vw > 0 && vh > 0) {
      videoSprite.scale.set(width / vw, height / vh);
      dbg(`adjustSpriteScale vw=${vw} vh=${vh} sx=${videoSprite.scale.x} sy=${videoSprite.scale.y}`);
    }
  }

  const onLoadedMeta = () => {
    if (destroyed || videoSprite.destroyed) return;
    duration = htmlVideo.duration || 0;
    adjustSpriteScale();
    dbg(`loadedmetadata duration=${duration}`);
    onLoad?.();
  };

  const onTimeUpdate = () => {
    if (destroyed || videoSprite.destroyed) return;
    curTime = htmlVideo.currentTime;
    if (!duration && htmlVideo.duration) duration = htmlVideo.duration;
    if (videoSprite.scale.x === 0) adjustSpriteScale();
    const pct = duration > 0 ? curTime / duration : 0;
    drawProgress(pct);
    timeText.text = `${fmt(curTime)} / ${fmt(duration)}`;
  };

  const onSeeked = () => {
    if (destroyed || videoSprite.destroyed) return;
    curTime = htmlVideo.currentTime;
    const pct = duration > 0 ? curTime / duration : 0;
    drawProgress(pct);
    timeText.text = `${fmt(curTime)} / ${fmt(duration)}`;
  };

  const onPlay = () => {
    if (destroyed) return;
    dbg(`onPlay event: readyState=${htmlVideo.readyState} networkState=${htmlVideo.networkState} currentTime=${htmlVideo.currentTime}`);
    paused = false;
    drawPlayIcon(true);
    cpb.visible = false;
  };

  const onPause = () => {
    if (destroyed) return;
    dbg(`onPause event: currentTime=${htmlVideo.currentTime}`);
    paused = true;
    drawPlayIcon(false);
    if (cpbVisibleAllowed) cpb.visible = true;
  };

  const onEndedEvt = () => {
    if (destroyed) return;
    if (duration > 0 && htmlVideo.currentTime < duration - 0.5) {
      dbg(`ignored phantom ended event at currentTime=${htmlVideo.currentTime}`);
      return;
    }
    onEnded?.();
  };

  const onVideoError = async () => {
    if (destroyed || fallbackAttempted) return;
    const code = htmlVideo.error?.code;
    dbg(`Native video error code: ${code}`);

    if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || code === MediaError.MEDIA_ERR_NETWORK) {
      fallbackAttempted = true;
      dbg('Attempting Blob fetch fallback...');
      try {
        const resp = await fetch(url);
        if (destroyed) return;
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const rawBlob = await resp.blob();
        const contentType = resp.headers.get('content-type') || 'video/mp4';
        const mediaBlob = new Blob([rawBlob], { type: contentType });
        objectUrl = URL.createObjectURL(mediaBlob);
        htmlVideo.src = objectUrl;
        htmlVideo.load();
        if (autoplay) htmlVideo.play().catch(()=>{});
        return;
      } catch (err) {
        dbg(`Fallback failed: ${err}`);
      }
    }

    if (destroyed) return;
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
  htmlVideo.addEventListener('ended', onEndedEvt);
  htmlVideo.addEventListener('error', onVideoError);

  // ── handle ──
  const handle: PixiVideoPlayerHandle = {
    play() { if (!destroyed) { dbg(`play() called by handle: readyState=${htmlVideo.readyState} currentTime=${htmlVideo.currentTime}`); userPlayRequested = true; htmlVideo.play().then(() => dbg('play() resolved'), (e) => dbg('play() rejected: ' + e.name + ' ' + e.message)); } },
    pause() { if (!destroyed) htmlVideo.pause(); },
    toggle() { if (!destroyed) { if (htmlVideo.paused) { userPlayRequested = true; htmlVideo.play().catch(()=>{}); } else htmlVideo.pause(); } },
    seek(t: number) {
      if (destroyed) return;
      htmlVideo.currentTime = t;
      curTime = t;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      dbg('destroy() start: paused=' + htmlVideo.paused + ' readyState=' + htmlVideo.readyState + ' networkState=' + htmlVideo.networkState + ' currentTime=' + htmlVideo.currentTime);

      try { htmlVideo.pause(); } catch { /* ok */ }

      htmlVideo.removeEventListener('canplay', initVideoSource);
      htmlVideo.removeEventListener('loadedmetadata', onLoadedMeta);
      htmlVideo.removeEventListener('timeupdate', onTimeUpdate);
      htmlVideo.removeEventListener('seeked', onSeeked);
      htmlVideo.removeEventListener('play', onPlay);
      htmlVideo.removeEventListener('pause', onPause);
      htmlVideo.removeEventListener('ended', onEndedEvt);
      htmlVideo.removeEventListener('error', onVideoError);
      dbg('destroy(): removed 7 listeners');

      if (hideTimer) clearTimeout(hideTimer);
      window.removeEventListener('pointermove', onWinMove);
      window.removeEventListener('pointerup', onWinUp);

      const oldTexture = videoTexture;
      const oldSource = videoSource;
      const oldVideo = htmlVideo;
      const oldUrl = objectUrl;
      videoSource = null;
      videoTexture = null;
      objectUrl = null;

      if (oldSource) {
        const s = oldSource as unknown as { _videoFrameRequestCallbackHandle?: number | null };
        if (s._videoFrameRequestCallbackHandle != null) {
          try { oldVideo.cancelVideoFrameCallback(s._videoFrameRequestCallbackHandle); } catch { /* ok */ }
          s._videoFrameRequestCallbackHandle = null;
          dbg('destroy(): cancelled rVFC');
        }
      }
      if (oldVideo.parentNode) { oldVideo.parentNode.removeChild(oldVideo); dbg('destroy(): removed oldVideo from DOM'); }
      if (oldUrl) { URL.revokeObjectURL(oldUrl); dbg('destroy(): revoked objectUrl'); }

      if (root.parent) { root.parent.removeChild(root); }
      root.destroy({ children: true });
      dbg('destroy(): scene graph destroyed');

      try { oldTexture?.destroy(false); dbg('destroy(): texture.destroy(false) ok'); } catch (e) { dbg('destroy(): texture.destroy(false) THREW ' + String(e)); }
      dbg('destroy() done');
    },
    setControlsVisible(v: boolean) {
      controlsVisible = v;
      ctrl.visible = v;
    },
    get stage() { return root; },
    get root() { return root; },
    get destroyed() { return destroyed; },
    get paused() { return paused; },
    get duration() { return duration; },
    get currentTime() { return curTime; },
  };

  return handle;
}
