import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../framework/gsap-pixi', () => ({
  gsap: {
    to: vi.fn((_target: unknown, vars: Record<string, unknown>) => {
      if (typeof vars.onUpdate === 'function') vars.onUpdate();
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
    removeChild: vi.fn(),
    removeFromParent: vi.fn(),
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
    x: 0, y: 0, width: 50, height: 20,
    text: '',
    anchor: { set: vi.fn() },
    visible: true,
    alpha: 1,
    scale: { x: 1, y: 1, set: vi.fn() },
    clear: vi.fn(function () { return obj; }),
    rect: vi.fn(function () { return obj; }),
    fill: vi.fn(function () { return obj; }),
    circle: vi.fn(function () { return obj; }),
    moveTo: vi.fn(function () { return obj; }),
    lineTo: vi.fn(function () { return obj; }),
    stroke: vi.fn(function () { return obj; }),
    ...extra,
  };
  createdObjects.push(obj);
  return obj;
}

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  const Container = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  const Graphics = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  const Text = vi.fn(function () { return mockPixiObj({ width: 50, height: 16 }); } as unknown as new () => Record<string, unknown>);
  const TextStyle = vi.fn();
  return {
    ...actual as object,
    Container, Graphics, Text, TextStyle,
  };
});

import { mountDisplays } from '../_shared/Displays';
import type { SubCanvas } from '@framework/SubCanvas';

function mockSubCanvas(): SubCanvas {
  return {
    stage: { addChild: vi.fn(), removeChild: vi.fn(), children: [] },
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
  } as never;
}

describe('mountDisplays', () => {
  let sc: SubCanvas;

  beforeEach(() => {
    createdObjects.length = 0;
    sc = mockSubCanvas();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns a cleanup function', () => {
    const cleanup = mountDisplays(sc);
    expect(typeof cleanup).toBe('function');
  });

  it('adds children to stage', () => {
    mountDisplays(sc);
    expect(sc.stage.addChild).toHaveBeenCalledTimes(4);
  });

  it('registers onMove handler', () => {
    mountDisplays(sc);
    expect(sc.onMove).toHaveBeenCalled();
  });

  it('registers onPress handler', () => {
    mountDisplays(sc);
    expect(sc.onPress).toHaveBeenCalled();
  });

  it('cleanup removes children', () => {
    const cleanup = mountDisplays(sc);
    cleanup();
    expect(sc.stage.removeChild).toHaveBeenCalled();
  });
});
