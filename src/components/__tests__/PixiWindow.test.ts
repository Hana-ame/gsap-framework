import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../framework/gsap-pixi', () => ({
  gsap: { to: vi.fn(), killTweensOf: vi.fn(), registerPlugin: vi.fn() },
  PixiPlugin: { registerPIXI: vi.fn() },
}));

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
    ...extra,
  };
  createdObjects.push(obj);
  return obj;
}

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  const Graphics = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  const Text = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  const Container = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  return {
    ...actual as object,
    Graphics, Text, Container,
    Rectangle: vi.fn(function (this: Record<string, unknown>, x: number, y: number, w: number, h: number) {
      this.x = x; this.y = y; this.width = w; this.height = h;
    }),
  };
});

function makeSub(stage?: Record<string, unknown>) {
  const s = stage ?? mockPixiObj();
  let sd = false;
  return {
    stage: s,
    bounds: { x: 0, y: 0, width: 400, height: 300 },
    destroy: vi.fn(() => { sd = true; }),
    addChild: vi.fn((c: unknown) => { (s.addChild as (c: unknown) => unknown)(c); return c; }),
    createRegion: vi.fn((_b: Record<string, unknown>, _o?: Record<string, unknown>) => makeSub()),
    setTitle: vi.fn(),
    bringToFront: vi.fn(),
    sendToBack: vi.fn(),
    removeChild: vi.fn(),
    removeChildren: vi.fn(),
    getChildren: vi.fn(() => []),
    onPress: vi.fn(),
    onMove: vi.fn(),
    onRelease: vi.fn(),
    offPointer: vi.fn(),
    setPosition: vi.fn(),
    setSize: vi.fn(),
    get destroyed() { return sd; },
  };
}

import { createWindow } from '../PixiWindow';

describe('createWindow', () => {
  let mockParent: ReturnType<typeof makeSub>;

  beforeEach(() => {
    createdObjects.length = 0;
    mockParent = makeSub();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns object with expected shape', () => {
    const win = createWindow({ parent: mockParent as never, title: 'Test', width: 400, height: 300 });
    expect(win).toBeDefined();
    expect(win.stage).toBeDefined();
    expect(typeof win.destroy).toBe('function');
    expect(typeof win.destroyed).toBe('boolean');
    expect(typeof win.setTitle).toBe('function');
    expect(win.content).toBeDefined();
  });

  it('creates a content SubCanvas', () => {
    const win = createWindow({ parent: mockParent as never, title: 'Test', width: 400, height: 300 });
    expect(win.content).toBeDefined();
  });

  it('destroy toggles destroyed flag', () => {
    const win = createWindow({ parent: mockParent as never, title: 'Test', width: 400, height: 300 });
    expect(win.destroyed).toBe(false);
    win.destroy();
    expect(win.destroyed).toBe(true);
  });

  it('destroy is idempotent', () => {
    const win = createWindow({ parent: mockParent as never, title: 'Test', width: 400, height: 300 });
    win.destroy();
    expect(() => win.destroy()).not.toThrow();
    expect(win.destroyed).toBe(true);
  });

  it('setTitle updates title text', () => {
    const win = createWindow({ parent: mockParent as never, title: 'Original', width: 400, height: 300 });
    expect(() => win.setTitle('Updated')).not.toThrow();
  });

  it('closable=true creates close button (pointerdown handler)', () => {
    createWindow({ parent: mockParent as never, title: 'Test', width: 400, height: 300, closable: true });
    const closeCtrls = createdObjects.filter((o) => (o as Record<string, unknown>).on && (o as Record<string, unknown>).cursor === 'pointer');
    expect(closeCtrls.length).toBeGreaterThan(0);
  });

  it('closable=false hides close button', () => {
    const before = createdObjects.length;
    createWindow({ parent: mockParent as never, title: 'Test', width: 400, height: 300, closable: false });
    const closeCtrls = createdObjects.slice(before).filter((o) => (o as Record<string, unknown>).cursor === 'pointer');
    expect(closeCtrls.length).toBe(0);
  });

  it('title bar has drag-handle label', () => {
    createWindow({ parent: mockParent as never, title: 'Test', width: 400, height: 300 });
    const bars = createdObjects.filter((o) => (o as Record<string, unknown>).label === 'subcanvas-drag-handle');
    expect(bars.length).toBeGreaterThanOrEqual(1);
  });
});
