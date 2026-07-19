import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, createRef, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { VideoPlayer, type VideoPlayerHandle } from '../VideoPlayer';

describe('VideoPlayer', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(async () => {
    await act(async () => { root?.unmount(); });
    container?.remove();
  });

  it('renders video element with src', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(VideoPlayer, { url: 'test.mp4' }));
    });
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    expect(video?.getAttribute('src')).toBe('test.mp4');
  });

  it('forwards ref with play/pause/toggle/seek', async () => {
    const ref = createRef<VideoPlayerHandle>();
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(VideoPlayer, { url: 'test.mp4', ref }));
    });
    expect(ref.current).toBeDefined();
    expect(typeof ref.current!.play).toBe('function');
    expect(typeof ref.current!.pause).toBe('function');
    expect(typeof ref.current!.toggle).toBe('function');
    expect(typeof ref.current!.seek).toBe('function');
    expect(typeof ref.current!.paused).toBe('boolean');
    expect(typeof ref.current!.duration).toBe('number');
    expect(typeof ref.current!.currentTime).toBe('number');
  });

  it('applies width and height', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(VideoPlayer, { url: 'test.mp4', width: 400, height: 300 }));
    });
    const video = container.querySelector('video');
    expect(video?.getAttribute('width')).toBe('400');
    expect(video?.getAttribute('height')).toBe('300');
  });

  it('sets autoplay, loop, muted attributes', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(VideoPlayer, { url: 'test.mp4', autoplay: true, loop: true, muted: true }));
    });
    const video = container.querySelector('video');
    expect(video?.autoplay).toBe(true);
    expect(video?.loop).toBe(true);
    expect(video?.muted).toBe(true);
  });

  it('calls onLoad when loadedmetadata fires', async () => {
    const onLoad = vi.fn();
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(VideoPlayer, { url: 'test.mp4', onLoad }));
    });
    const video = container.querySelector('video');
    await act(async () => { video?.dispatchEvent(new Event('loadedmetadata')); });
    expect(onLoad).toHaveBeenCalled();
  });

  it('calls onError on error event', async () => {
    const onError = vi.fn();
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(VideoPlayer, { url: 'bad.mp4', onError }));
    });
    const video = container.querySelector('video');
    await act(async () => { video?.dispatchEvent(new Event('error')); });
    expect(onError).toHaveBeenCalled();
  });

  it('ref.el returns video element', async () => {
    const ref = createRef<VideoPlayerHandle>();
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(VideoPlayer, { url: 'test.mp4', ref }));
    });
    expect(ref.current!.el).toBeInstanceOf(HTMLVideoElement);
  });
});
