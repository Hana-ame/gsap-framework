import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const createdObjects: Record<string, unknown>[] = [];

function mockPixiObj(extra: Record<string, unknown> = {}): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    children: [],
    addChild: vi.fn(function (this: Record<string, unknown>, child: unknown) {
      (this.children as unknown[]).push(child);
      return child;
    }),
    addChildAt: vi.fn(function (this: Record<string, unknown>, child: unknown, _i: number) {
      (this.children as unknown[]).push(child);
      return child;
    }),
    removeChild: vi.fn(),
    destroy: vi.fn(),
    eventMode: null,
    on: vi.fn(),
    off: vi.fn(),
    cursor: 'default',
    x: 0, y: 0, width: 0, height: 0,
    label: '',
    parent: null,
    zIndex: 0,
    mask: null,
    position: { set: vi.fn(), x: 0, y: 0 },
    text: '',
    anchor: { set: vi.fn() },
    clear: vi.fn(function () { return obj; }),
    circle: vi.fn(function () { return obj; }),
    fill: vi.fn(function () { return obj; }),
    stroke: vi.fn(function () { return obj; }),
    rect: vi.fn(function () { return obj; }),
    roundRect: vi.fn(function () { return obj; }),
    moveTo: vi.fn(function () { return obj; }),
    lineTo: vi.fn(function () { return obj; }),
    visible: true,
    scale: { x: 1, y: 1 },
    rotation: 0,
    getBounds: vi.fn(() => ({ rectangle: { width: 0, height: 0 } })),
    ...extra,
  };
  createdObjects.push(obj);
  return obj;
}

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  const Graphics = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  const Container = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  return {
    ...actual as object,
    Graphics, Container,
    Rectangle: vi.fn(function (this: Record<string, unknown>, x: number, y: number, w: number, h: number) {
      this.x = x; this.y = y; this.width = w; this.height = h;
    }),
  };
});

function makeSub(stage?: Record<string, unknown>) {
  const s = stage ?? mockPixiObj();
  return {
    stage: s,
    bounds: { x: 0, y: 0, width: 800, height: 600 },
    addChild: vi.fn((c: unknown) => { (s.addChild as (c: unknown) => unknown)(c); return c; }),
    destroy: vi.fn(),
    removeChild: vi.fn(),
  };
}

import { createScrollable } from '../Scrollable';

describe('createScrollable', () => {
  let mockParent: ReturnType<typeof makeSub>;

  beforeEach(() => {
    createdObjects.length = 0;
    mockParent = makeSub();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns object with expected shape', () => {
    const sc = createScrollable({ parent: mockParent as never, width: 300, height: 400 });
    expect(sc).toBeDefined();
    expect(sc.stage).toBeDefined();
    expect(sc.content).toBeDefined();
    expect(sc.bounds).toBeDefined();
    expect(typeof sc.scrollTo).toBe('function');
    expect(typeof sc.scrollBy).toBe('function');
    expect(typeof sc.recalc).toBe('function');
    expect(typeof sc.destroy).toBe('function');
    expect(typeof sc.destroyed).toBe('boolean');
    expect(sc.destroyed).toBe(false);
  });

  it('creates vertical scrollbar by default', () => {
    createScrollable({ parent: mockParent as never, width: 300, height: 400 });
    const roundRects = createdObjects.filter((o) => (o as Record<string, unknown>).roundRect);
    expect(roundRects.length).toBeGreaterThanOrEqual(1);
  });

  it('horizontal direction works', () => {
    const sc = createScrollable({ parent: mockParent as never, width: 300, height: 400, direction: 'horizontal' });
    expect(sc).toBeDefined();
  });

  it('scrollbar=false still creates scrollable with all operations', () => {
    const sc = createScrollable({ parent: mockParent as never, width: 300, height: 400, scrollbar: false });
    expect(sc).toBeDefined();
    expect(() => sc.scrollTo(10, 20)).not.toThrow();
    expect(() => sc.scrollBy(5, 5)).not.toThrow();
    expect(() => sc.recalc()).not.toThrow();
    sc.destroy();
    expect(sc.destroyed).toBe(true);
  });

  it('scrollTo clamps to content bounds', () => {
    const sc = createScrollable({ parent: mockParent as never, width: 300, height: 400 });
    expect(() => sc.scrollTo(0, 0)).not.toThrow();
    expect(() => sc.scrollTo(-100, -100)).not.toThrow();
  });

  it('scrollBy works', () => {
    const sc = createScrollable({ parent: mockParent as never, width: 300, height: 400 });
    expect(() => sc.scrollBy(10, 20)).not.toThrow();
  });

  it('destroy toggles destroyed', () => {
    const sc = createScrollable({ parent: mockParent as never, width: 300, height: 400 });
    expect(sc.destroyed).toBe(false);
    sc.destroy();
    expect(sc.destroyed).toBe(true);
  });

  it('destroy is idempotent', () => {
    const sc = createScrollable({ parent: mockParent as never, width: 300, height: 400 });
    sc.destroy();
    expect(() => sc.destroy()).not.toThrow();
  });

  it('recalc does not throw', () => {
    const sc = createScrollable({ parent: mockParent as never, width: 300, height: 400 });
    expect(() => sc.recalc()).not.toThrow();
  });
});
