import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VnAssetLoader } from '../loader';

// jsdom 无真实 Image 网络加载，mock 以便手动触发 onload
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

describe('VnAssetLoader', () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubImage();
  });
  afterEach(() => restore());

  it('registers key->url and tracks loading', () => {
    const loader = new VnAssetLoader();
    const entry = loader.load({ key: 'a', url: 'http://x/a.png' });
    expect(entry.key).toBe('a');
    expect(entry.url).toBe('http://x/a.png');
    expect(loader.get('a')).toBe(entry);
    loader.dispose();
  });

  it('waitFor resolves once onload fires (wait mode)', async () => {
    const loader = new VnAssetLoader();
    const entry = loader.load({ key: 'a', url: 'http://x/a.png' });
    const img = entry.img as HTMLImageElement;
    const p = loader.waitFor('a');
    let settled = false;
    p.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false); // 未加载完不 resolve
    img.onload?.(new Event("load"));
    await p;
    expect(loader.get('a')!.loaded).toBe(true);
    expect(settled).toBe(true);
    loader.dispose();
  });

  it('waitAll resolves after all load', async () => {
    const loader = new VnAssetLoader();
    loader.load({ key: 'a', url: 'http://x/a.png' });
    loader.load({ key: 'b', url: 'http://x/b.png' });
    const waitAll = loader.waitAll(['a', 'b']);
    let done = false;
    waitAll.then(() => (done = true));
    loader.get("a")!.img!.onload?.(new Event("load"));
    loader.get("b")!.img!.onload?.(new Event("load"));
    await waitAll;
    expect(done).toBe(true);
    loader.dispose();
  });

  it('progress reports loaded/total', () => {
    const loader = new VnAssetLoader();
    loader.load({ key: 'a', url: 'http://x/a.png' });
    loader.load({ key: 'b', url: 'http://x/b.png' });
    expect(loader.progress(['a', 'b'])).toEqual({ loaded: 0, total: 2 });
    loader.dispose();
  });

  it('allLoaded is false before load completes', () => {
    const loader = new VnAssetLoader();
    loader.load({ key: 'a', url: 'http://x/a.png' });
    expect(loader.allLoaded(['a'])).toBe(false);
    loader.dispose();
  });
});