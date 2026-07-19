import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const createdObjects: Record<string, unknown>[] = [];
let addedToBody: unknown[] = [];

function mockVideoElement() {
  const listeners = new Map<string, Set<() => void>>();
  const video = {
    crossOrigin: '',
    playsInline: false,
    muted: false,
    loop: false,
    src: '',
    currentTime: 0,
    duration: 0,
    readyState: 0,
    networkState: 0,
    paused: true,
    videoWidth: 0,
    videoHeight: 0,
    error: null as { code: number } | null,
    parentNode: null as unknown | null,
    style: {} as Record<string, string>,
    addEventListener: vi.fn(function (this: unknown, evt: string, fn: () => void, _opts?: unknown) {
      let s = listeners.get(evt);
      if (!s) { s = new Set(); listeners.set(evt, s); }
      s.add(fn);
    }),
    removeEventListener: vi.fn(function (this: unknown, evt: string, _fn?: unknown, _opts?: unknown) {
      listeners.delete(evt);
    }),
    removeChild: vi.fn(),
    load: vi.fn(),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    cancelVideoFrameCallback: vi.fn(),
    _videoFrameRequestCallbackHandle: null,
  };
  return video;
}

let mockVideo: ReturnType<typeof mockVideoElement>;

function mockPixiObj(extra: Record<string, unknown> = {}): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    children: [],
    addChild: vi.fn(function (this: Record<string, unknown>, child: unknown) {
      (this.children as unknown[]).push(child);
      return child;
    }),
    removeChild: vi.fn(),
    removeFromParent: vi.fn(),
    destroy: vi.fn(),
    eventMode: null,
    on: vi.fn(),
    off: vi.fn(),
    cursor: 'default',
    x: 0, y: 0, width: 400, height: 300,
    label: '',
    parent: null,
    zIndex: 0,
    mask: null,
    text: '',
    anchor: { set: vi.fn() },
    visible: true,
    scale: { x: 1, y: 1, set: vi.fn() },
    clear: vi.fn(function () { return obj; }),
    rect: vi.fn(function () { return obj; }),
    fill: vi.fn(function () { return obj; }),
    roundRect: vi.fn(function () { return obj; }),
    circle: vi.fn(function () { return obj; }),
    poly: vi.fn(function () { return obj; }),
    ...extra,
  };
  createdObjects.push(obj);
  return obj;
}

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  const Container = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  const Graphics = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  const Sprite = vi.fn(function () { return mockPixiObj({ texture: null }); } as unknown as new () => Record<string, unknown>);
  const Text = vi.fn(function () { return mockPixiObj({ width: 50 }); } as unknown as new () => Record<string, unknown>);
  const Texture = vi.fn(function () { return {}; });
  const VideoSource = vi.fn(function () {
    return { update: vi.fn(), mipLevelCount: 1, _videoFrameRequestCallbackHandle: null };
  });
  return {
    ...actual as object,
    Container, Graphics, Sprite, Text,
    Texture, VideoSource,
    TextStyle: vi.fn(),
    Circle: vi.fn(function (this: Record<string, unknown>, x: number, y: number, r: number) {
      this.x = x; this.y = y; this.radius = r;
    }),
    Rectangle: vi.fn(function (this: Record<string, unknown>, x: number, y: number, w: number, h: number) {
      this.x = x; this.y = y; this.width = w; this.height = h;
    }),
  };
});

import type { SubCanvas } from '../../framework';

function mockSubCanvas(): SubCanvas {
  return {
    stage: { addChild: vi.fn() },
    bounds: { x: 0, y: 0, width: 800, height: 600 },
    globalBounds: { x: 0, y: 0, width: 800, height: 600 },
    setPosition: vi.fn(),
    setSize: vi.fn(),
    createRegion: vi.fn(),
    onPress: vi.fn(),
    onRelease: vi.fn(),
    onMove: vi.fn(),
    offPointer: vi.fn(),
    addChild: vi.fn(),
    removeChild: vi.fn(),
    removeChildren: vi.fn(),
    getChildren: vi.fn(() => []),
    destroy: vi.fn(),
    canvas: { getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 800, height: 600 })) },
    rootApp: { stage: { addChild: vi.fn() }, renderer: { resolution: 1 } } as never,
  } as never;
}

import { createVideoPlayer } from '../PixiVideoPlayer';

describe('createVideoPlayer', () => {
  let parent: SubCanvas;

  beforeEach(() => {
    createdObjects.length = 0;
    mockVideo = mockVideoElement();
    vi.stubGlobal('HTMLMediaElement', {
      HAVE_FUTURE_DATA: 3,
      HAVE_ENOUGH_DATA: 4,
      HAVE_CURRENT_DATA: 2,
      HAVE_METADATA: 1,
      HAVE_NOTHING: 0,
      NETWORK_EMPTY: 0,
      NETWORK_IDLE: 1,
      NETWORK_LOADING: 2,
      NETWORK_NO_SOURCE: 3,
    });
    vi.stubGlobal('MediaError', class {
      static MEDIA_ERR_ABORTED = 1;
      static MEDIA_ERR_NETWORK = 2;
      static MEDIA_ERR_DECODE = 3;
      static MEDIA_ERR_SRC_NOT_SUPPORTED = 4;
    });
    vi.stubGlobal('document', {
      createElement: vi.fn((tag: string) => {
        if (tag === 'video') return mockVideo;
        return {};
      }),
      body: { appendChild: vi.fn((el: unknown) => { addedToBody.push(el); mockVideo.parentNode = el; }) },
    } as never);
    vi.stubGlobal('window', {
      innerWidth: 800,
      innerHeight: 600,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as never);
    parent = mockSubCanvas();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    addedToBody = [];
  });

  it('returns handle with expected shape', () => {
    const handle = createVideoPlayer(parent, { url: 'test.mp4', width: 400, height: 300 });
    expect(handle).toBeDefined();
    expect(typeof handle.play).toBe('function');
    expect(typeof handle.pause).toBe('function');
    expect(typeof handle.toggle).toBe('function');
    expect(typeof handle.seek).toBe('function');
    expect(typeof handle.destroy).toBe('function');
    expect(typeof handle.setControlsVisible).toBe('function');
    expect(typeof handle.paused).toBe('boolean');
    expect(typeof handle.duration).toBe('number');
    expect(typeof handle.currentTime).toBe('number');
    expect(handle.root).toBeDefined();
  });

  it('starts paused by default', () => {
    const handle = createVideoPlayer(parent, { url: 'test.mp4', width: 400, height: 300 });
    expect(handle.paused).toBe(true);
  });

  it('creates video element and adds to body', () => {
    createVideoPlayer(parent, { url: 'test.mp4', width: 400, height: 300 });
    expect(addedToBody.length).toBe(1);
  });

  it('setControlsVisible works', () => {
    const handle = createVideoPlayer(parent, { url: 'test.mp4', width: 400, height: 300 });
    expect(() => handle.setControlsVisible(false)).not.toThrow();
  });

  it('destroy cleans up', () => {
    const handle = createVideoPlayer(parent, { url: 'test.mp4', width: 400, height: 300 });
    expect(handle.destroyed).toBe(false);
    handle.destroy();
    expect(handle.destroyed).toBe(true);
  });

  it('destroy is idempotent', () => {
    const handle = createVideoPlayer(parent, { url: 'test.mp4', width: 400, height: 300 });
    handle.destroy();
    expect(() => handle.destroy()).not.toThrow();
  });

  it('play/pause toggle', () => {
    const handle = createVideoPlayer(parent, { url: 'test.mp4', width: 400, height: 300 });
    expect(() => handle.play()).not.toThrow();
    expect(() => handle.pause()).not.toThrow();
  });

  it('toggle switches play/pause', () => {
    const handle = createVideoPlayer(parent, { url: 'test.mp4', width: 400, height: 300 });
    expect(() => handle.toggle()).not.toThrow();
  });

  it('seek sets currentTime', () => {
    const handle = createVideoPlayer(parent, { url: 'test.mp4', width: 400, height: 300 });
    handle.seek(30);
    expect(mockVideo.currentTime).toBe(30);
  });

  it('root is a container', () => {
    const handle = createVideoPlayer(parent, { url: 'test.mp4', width: 400, height: 300 });
    expect(handle.root).toBeDefined();
  });
});
