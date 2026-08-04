import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  registerSceneScript,
  prefetchScene,
  clearWarmLayer,
  setWarmLayerCountdown,
  resetSceneRegistry,
  knownSceneKeys,
} from '../prefetch';
import type { VnScript } from '../types';

// jsdom 无真实 Image 网络加载，mock 以便手动触发 load
function stubImage() {
  const orig = globalThis.Image;
  (globalThis as any).Image = class {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    src = '';
    naturalWidth = 100;
    naturalHeight = 100;
  };
  return () => {
    globalThis.Image = orig;
  };
}

function makeScript(urls: string[]): VnScript {
  return {
    meta: { strictLoad: true },
    lines: [{ type: 'preload', wait: true, assets: urls.map((u, i) => ({ key: `k${i}`, url: u })) }],
  };
}

describe('prefetch', () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubImage();
    resetSceneRegistry();
    document.body.innerHTML = '';
  });
  afterEach(() => restore());

  it('registers and prefetches a scene, warming its preload urls into hidden DOM layer', async () => {
    registerSceneScript('sceneA', () => makeScript(['http://x/a1.png', 'http://x/a2.png']));
    await prefetchScene('sceneA');

    const layer = document.querySelector('[data-vn-prefetch]');
    expect(layer).not.toBeNull();
    const imgs = layer!.querySelectorAll('img');
    expect(imgs.length).toBe(2);
    expect(imgs[0].src).toBe('http://x/a1.png');
  });

  it('is idempotent: prefetching same scene twice does not duplicate imgs', async () => {
    registerSceneScript('sceneA', () => makeScript(['http://x/a1.png']));
    await prefetchScene('sceneA');
    await prefetchScene('sceneA');
    const imgs = document.querySelectorAll('[data-vn-prefetch] img');
    expect(imgs.length).toBe(1);
  });

  it('clearWarmLayer removes the hidden DOM layer', async () => {
    registerSceneScript('sceneA', () => makeScript(['http://x/a1.png']));
    await prefetchScene('sceneA');
    expect(document.querySelector('[data-vn-prefetch]')).not.toBeNull();
    clearWarmLayer();
    expect(document.querySelector('[data-vn-prefetch]')).toBeNull();
  });

  it('cleans up after N scene changes via countdown', async () => {
    setWarmLayerCountdown(2);
    registerSceneScript('sceneA', () => makeScript(['http://x/a1.png']));
    registerSceneScript('sceneB', () => makeScript(['http://x/b1.png']));
    await prefetchScene('sceneA');
    const afterA = document.querySelectorAll('[data-vn-prefetch] img').length;
    await prefetchScene('sceneB');
    const afterB = document.querySelectorAll('[data-vn-prefetch] img').length;
    expect(afterA).toBe(1);
    expect(afterB).toBe(1);
    const src = document.querySelector('[data-vn-prefetch] img')?.getAttribute('src');
    expect(src).toBe('http://x/b1.png');
  });

  it('setWarmLayerCountdown(0) disables auto cleanup', async () => {
    setWarmLayerCountdown(0);
    registerSceneScript('sceneA', () => makeScript(['http://x/a1.png']));
    await prefetchScene('sceneA');
    await prefetchScene('sceneA');
    expect(document.querySelectorAll('[data-vn-prefetch] img').length).toBe(1);
  });

  it('knownSceneKeys lists registered scenes', () => {
    registerSceneScript('sceneA', () => makeScript([]));
    expect(knownSceneKeys()).toContain('sceneA');
  });
});
