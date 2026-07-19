import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('gsap', () => ({
  default: {
    to: vi.fn((_target: unknown, vars: Record<string, unknown>) => {
      if (typeof vars.onComplete === 'function') vars.onComplete();
      return { kill: vi.fn() };
    }),
    killTweensOf: vi.fn(),
    registerPlugin: vi.fn(),
  },
  gsap: {
    to: vi.fn((_target: unknown, vars: Record<string, unknown>) => {
      if (typeof vars.onComplete === 'function') vars.onComplete();
      return { kill: vi.fn() };
    }),
    killTweensOf: vi.fn(),
    registerPlugin: vi.fn(),
  },
  PixiPlugin: { registerPIXI: vi.fn() },
}));

const createdObjects: Record<string, unknown>[] = [];

function mockPixiObj(extra: Record<string, unknown> = {}): Record<string, unknown> {
  const handlers = new Map<string, Set<(...args: unknown[]) => void>>();
  const obj: Record<string, unknown> = {
    children: [],
    addChild: vi.fn(function (this: Record<string, unknown>, child: unknown) {
      (this.children as unknown[]).push(child);
      return child;
    }),
    removeChild: vi.fn(function (this: Record<string, unknown>, child: unknown) {
      const idx = (this.children as unknown[]).indexOf(child);
      if (idx >= 0) (this.children as unknown[]).splice(idx, 1);
    }),
    destroy: vi.fn(),
    eventMode: null,
    on: vi.fn(function (this: Record<string, unknown>, evt: string, fn: (...args: unknown[]) => void) {
      let s = handlers.get(evt);
      if (!s) { s = new Set(); handlers.set(evt, s); }
      s.add(fn);
      return this;
    }),
    off: vi.fn(),
    cursor: 'default',
    x: 0, y: 0, width: 0, height: 0,
    label: '',
    parent: null,
    zIndex: 0,
    mask: null,
    position: { set: vi.fn(), x: 0, y: 0 },
    scale: { x: 1, y: 1, set: vi.fn() },
    visible: true,
    anchor: { set: vi.fn() },
    texture: null,
    clear: vi.fn(function () { return obj; }),
    rect: vi.fn(function () { return obj; }),
    fill: vi.fn(function () { return obj; }),
    ...extra,
  };
  createdObjects.push(obj);
  return obj;
}

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  const Container = vi.fn(function () { return mockPixiObj({ sortableChildren: false }); } as unknown as new () => Record<string, unknown>);
  const Graphics = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  const Sprite = vi.fn(function () { return mockPixiObj({ anchor: { set: vi.fn() } }); } as unknown as new () => Record<string, unknown>);
  return {
    ...actual as object,
    Container, Graphics, Sprite,
    Texture: vi.fn(function () { return {}; }),
    Rectangle: vi.fn(function (this: Record<string, unknown>, x: number, y: number, w: number, h: number) {
      this.x = x; this.y = y; this.width = w; this.height = h;
    }),
  };
});

import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { EventBus } from '@framework/EventBus';
import { createFullscreenManager } from '../FullscreenManager';

describe('createFullscreenManager', () => {
  let proxy: { stage: PIXI.Container; bus: EventBus };

  beforeEach(() => {
    vi.clearAllMocks();
    createdObjects.length = 0;
    proxy = {
      stage: new PIXI.Container(),
      bus: new EventBus(),
    } as never;
  });

  it('creates and returns destroy function', () => {
    const fm = createFullscreenManager(proxy as never);
    expect(fm).toBeDefined();
    expect(typeof fm.destroy).toBe('function');
  });

  it('sets stage sortableChildren and adds container', () => {
    createFullscreenManager(proxy as never);
    expect((proxy.stage as Record<string, unknown>).sortableChildren).toBe(true);
    expect(proxy.stage.children.length).toBe(1);
  });

  it('subscribes to fullscreen:show event', () => {
    createFullscreenManager(proxy as never);
    expect(proxy.bus.listenerCount('fullscreen:show')).toBe(1);
  });

  it('destroy removes container from stage', () => {
    const fm = createFullscreenManager(proxy as never);
    const container = proxy.stage.children[0];
    fm.destroy();
    expect((container as Record<string, unknown>).parent).toBeNull();
  });

  it('destroy is idempotent', () => {
    const fm = createFullscreenManager(proxy as never);
    fm.destroy();
    expect(() => fm.destroy()).not.toThrow();
  });

  it('destroy runs without error when no active tweens', () => {
    const fm = createFullscreenManager(proxy as never);
    expect(() => fm.destroy()).not.toThrow();
  });

  it('show via bus event creates gsap animation', () => {
    createFullscreenManager(proxy as never);

    proxy.bus.emit('fullscreen:show', {
      texture: {} as never,
      texW: 200,
      texH: 150,
      thumbGlobalX: 0,
      thumbGlobalY: 0,
      thumbW: 100,
      thumbH: 75,
    });

    expect(gsap.to).toHaveBeenCalled();
  });

  it('double fullscreen:show triggers gsap twice', () => {
    createFullscreenManager(proxy as never);
    proxy.bus.emit('fullscreen:show', {
      texture: {} as never, texW: 200, texH: 150,
      thumbGlobalX: 0, thumbGlobalY: 0, thumbW: 100, thumbH: 75,
    });
    const firstGaspCalls = (gsap.to as ReturnType<typeof vi.fn>).mock.calls.length;

    proxy.bus.emit('fullscreen:show', {
      texture: {} as never, texW: 300, texH: 200,
      thumbGlobalX: 10, thumbGlobalY: 10, thumbW: 120, thumbH: 90,
    });

    expect((gsap.to as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(firstGaspCalls);
  });

  it('show on destroyed manager does not call gsap', () => {
    const fm = createFullscreenManager(proxy as never);
    fm.destroy();
    (gsap.to as ReturnType<typeof vi.fn>).mockClear();

    proxy.bus.emit('fullscreen:show', {
      texture: {} as never, texW: 200, texH: 150,
      thumbGlobalX: 0, thumbGlobalY: 0, thumbW: 100, thumbH: 75,
    });
    expect(gsap.to).not.toHaveBeenCalled();
  });
});
