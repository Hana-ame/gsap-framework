import { forwardRef, useImperativeHandle, useRef } from 'react';

export interface VideoPlayerProps {
  url: string;
  width?: number | string;
  height?: number | string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials';
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (e: Error) => void;
}

export interface VideoPlayerHandle {
  play(): void;
  pause(): void;
  toggle(): void;
  seek(t: number): void;
  readonly el: HTMLVideoElement | null;
  readonly paused: boolean;
  readonly duration: number;
  readonly currentTime: number;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer(
  {
    url,
    width,
    height,
    autoplay = false,
    loop = false,
    muted = false,
    controls = true,
    playsInline = true,
    crossOrigin,
    className,
    style,
    onLoad,
    onError,
  },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({
    play() { videoRef.current?.play().catch(() => {}); },
    pause() { videoRef.current?.pause(); },
    toggle() {
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) v.play().catch(() => {});
      else v.pause();
    },
    seek(t: number) {
      if (videoRef.current) videoRef.current.currentTime = t;
    },
    get el() { return videoRef.current; },
    get paused() { return videoRef.current?.paused ?? true; },
    get duration() { return videoRef.current?.duration ?? 0; },
    get currentTime() { return videoRef.current?.currentTime ?? 0; },
  }), []);

  return (
    <video
      ref={videoRef}
      src={url}
      width={width}
      height={height}
      autoPlay={autoplay}
      loop={loop}
      muted={muted}
      controls={controls}
      playsInline={playsInline}
      crossOrigin={crossOrigin}
      className={className}
      style={{ display: 'block', maxWidth: '100%', ...style }}
      onLoadedMetadata={onLoad}
      onError={() => onError?.(new Error('Video failed to load'))}
    />
  );
});
