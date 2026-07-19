import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

let _mockCanvas: unknown;

beforeAll(() => {
  if (typeof document === 'undefined') {
    const elPrototype = {
      style: {},
      dataset: {},
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      remove: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      getContext: vi.fn(() => null),
      addEventListener: vi.fn(),
    };
    const doc = {
      createElement: vi.fn(() => {
        const el = Object.create(elPrototype);
        el.style = {};
        el.dataset = {};
        return el;
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        querySelectorAll: vi.fn(() => []),
      },
    } as unknown as Document;
    vi.stubGlobal('document', doc);

    const mc = Object.create(elPrototype) as Record<string, unknown>;
    mc.style = {};
    mc.dataset = {};
    _mockCanvas = mc;

    vi.stubGlobal('window', {
      innerWidth: 1024,
      innerHeight: 768,
      devicePixelRatio: 1,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as Window & typeof globalThis);
  } else {
    _mockCanvas = document.createElement('canvas');
  }
});

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  const MockApplication: new () => Record<string, unknown> = function () {
    this.canvas = _mockCanvas;
    this.stage = { eventMode: '', children: [], addChild: vi.fn() };
    this.renderer = { resize: vi.fn(), width: 800, height: 600, type: 'webgl', name: 'WebGL' };
    this.ticker = { maxFPS: 60, addOnce: vi.fn(), add: vi.fn(), remove: vi.fn(), start: vi.fn(), stop: vi.fn() };
    this.init = vi.fn().mockResolvedValue(undefined);
    this.destroy = vi.fn();
    this.start = vi.fn();
  } as unknown as new () => Record<string, unknown>;
  return { ...actual as object, Application: MockApplication as unknown as typeof actual.Application };
});

vi.mock('../SubCanvasProxy', () => {
  const MockProxy: new (...args: unknown[]) => Record<string, unknown> = function () {
    this.routePointer = vi.fn();
    this.destroyAll = vi.fn();
    this.canvas = null;
  } as unknown as new (...args: unknown[]) => Record<string, unknown>;
  return { SubCanvasProxy: MockProxy };
});

import { startPixiApp, debugBodyCanvases } from '../PixiApp';

describe('PixiApp', () => {
  afterAll(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('startPixiApp returns a destroy function', () => {
    const destroy = startPixiApp();
    expect(typeof destroy).toBe('function');
    destroy();
  });

  it('destroy function does not throw', () => {
    const destroy = startPixiApp();
    expect(() => destroy()).not.toThrow();
  });

  it('startPixiApp with onReady callback', async () => {
    const onReady = vi.fn();
    const destroy = startPixiApp(onReady);
    await vi.waitFor(() => {
      expect(onReady).toHaveBeenCalled();
    });
    destroy();
  });

  it('debugBodyCanvases returns array', () => {
    const result = debugBodyCanvases();
    expect(Array.isArray(result)).toBe(true);
  });

  it('calling destroy twice does not throw', () => {
    const destroy = startPixiApp();
    destroy();
    expect(() => destroy()).not.toThrow();
  });
});
