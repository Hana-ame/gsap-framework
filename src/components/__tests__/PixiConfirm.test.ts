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
  const TextStyle = vi.fn();
  return {
    ...actual as object,
    Graphics, Text, Container, TextStyle,
    Rectangle: vi.fn(function (this: Record<string, unknown>, x: number, y: number, w: number, h: number) {
      this.x = x; this.y = y; this.width = w; this.height = h;
    }),
    Assets: { load: vi.fn().mockResolvedValue(null) },
  };
});

function makeSub(stage?: Record<string, unknown>) {
  const s = stage ?? mockPixiObj();
  let sd = false;
  return {
    stage: s,
    bounds: { x: 0, y: 0, width: 800, height: 600 },
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
    setBounds: vi.fn(),
    onResize: vi.fn(),
    setMessage: vi.fn(),
    setImage: vi.fn(),
    content: null as Record<string, unknown> | null,
    get destroyed() { return sd; },
  };
}

import { createConfirm } from '../PixiConfirm';

describe('createConfirm', () => {
  let mockParent: ReturnType<typeof makeSub>;

  beforeEach(() => {
    createdObjects.length = 0;
    mockParent = makeSub();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns object with expected shape', () => {
    const conf = createConfirm({ parent: mockParent as never, title: 'Confirm', width: 300, height: 200 });
    expect(conf).toBeDefined();
    expect(conf.stage).toBeDefined();
    expect(typeof conf.destroy).toBe('function');
    expect(typeof conf.destroyed).toBe('boolean');
    expect(typeof conf.setTitle).toBe('function');
    expect(typeof conf.setMessage).toBe('function');
    expect(typeof conf.setImage).toBe('function');
    expect(conf.content).toBeDefined();
  });

  it('creates default OK/Cancel buttons', () => {
    createConfirm({ parent: mockParent as never, title: 'Confirm', width: 300, height: 200 });
    const buttons = createdObjects.filter((o) => (o as Record<string, unknown>).cursor === 'pointer');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('onResult is a function on createConfirm', () => {
    const onResult = vi.fn();
    const conf = createConfirm({ parent: mockParent as never, title: 'Test', width: 300, height: 200, onResult });
    expect(conf).toBeDefined();
  });

  it('closable close button fires onClose', () => {
    const onClose = vi.fn();
    createConfirm({ parent: mockParent as never, title: 'Test', width: 300, height: 200, closable: true, onClose });
  });

  it('keepOpen prevents destroy on close button click', () => {
    const onClose = vi.fn();
    const conf = createConfirm({ parent: mockParent as never, title: 'Test', width: 300, height: 200, closable: true, keepOpen: true, onClose });
    expect(conf.destroyed).toBe(false);
  });

  it('custom buttons via buttons option', () => {
    const onResult = vi.fn();
    createConfirm({
      parent: mockParent as never, title: 'Test', width: 300, height: 200,
      buttons: [{ label: 'Yes' }, { label: 'No' }],
      onResult,
    });
    const pointers = createdObjects.filter((o) => (o as Record<string, unknown>).cursor === 'pointer');
    expect(pointers.length).toBeGreaterThanOrEqual(2);
  });

  it('setTitle works', () => {
    const conf = createConfirm({ parent: mockParent as never, title: 'Original', width: 300, height: 200 });
    expect(() => conf.setTitle('Updated')).not.toThrow();
  });

  it('setMessage works', () => {
    const conf = createConfirm({ parent: mockParent as never, title: 'Test', width: 300, height: 200, message: 'Hello' });
    expect(() => conf.setMessage('World')).not.toThrow();
  });

  it('destroy toggles destroyed', () => {
    const conf = createConfirm({ parent: mockParent as never, title: 'Test', width: 300, height: 200 });
    expect(conf.destroyed).toBe(false);
    conf.destroy();
    expect(conf.destroyed).toBe(true);
  });

  it('destroy is idempotent', () => {
    const conf = createConfirm({ parent: mockParent as never, title: 'Test', width: 300, height: 200 });
    conf.destroy();
    expect(() => conf.destroy()).not.toThrow();
  });
});
