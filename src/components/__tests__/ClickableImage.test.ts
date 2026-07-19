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
    removeChild: vi.fn(),
    removeFromParent: vi.fn(),
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
    rect: vi.fn(function () { return obj; }),
    fill: vi.fn(function () { return obj; }),
    stroke: vi.fn(function () { return obj; }),
    visible: true,
    ...extra,
  };
  createdObjects.push(obj);
  return obj;
}

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  function FakeTexture() {
    // noop
  }
  FakeTexture.EMPTY = new FakeTexture();
  FakeTexture.from = vi.fn();
  (FakeTexture.prototype as Record<string, unknown>).width = 0;
  (FakeTexture.prototype as Record<string, unknown>).height = 0;
  const Container = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  const Graphics = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  const Text = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  const Sprite = vi.fn(function () { return mockPixiObj({ texture: new FakeTexture() }); } as unknown as new () => Record<string, unknown>);
  return {
    ...actual as object,
    Container, Graphics, Text, Sprite,
    Texture: FakeTexture,
    TextStyle: vi.fn(),
    Rectangle: vi.fn(function (this: Record<string, unknown>, x: number, y: number, w: number, h: number) {
      this.x = x; this.y = y; this.width = w; this.height = h;
    }),
    Assets: { load: vi.fn().mockResolvedValue({ width: 100, height: 100 }) },
  };
});

import { type SubCanvas } from '../../framework/SubCanvas';
import { EventBus } from '../../framework/EventBus';

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
    canvas: { getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 800, height: 600 })) },
    rootApp: { stage: { addChild: vi.fn() }, renderer: { resolution: 1 } } as never,
  } as never;
}

import { createClickableImage } from '../ClickableImage';

describe('createClickableImage', () => {
  let parent: SubCanvas;
  let bus: EventBus;

  beforeEach(() => {
    createdObjects.length = 0;
    parent = mockSubCanvas();
    bus = new EventBus();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns handle with expected shape', () => {
    const ci = createClickableImage(parent, bus, { url: 'test.png', x: 0, y: 0, width: 100, height: 100 });
    expect(ci).toBeDefined();
    expect(ci.stage).toBeDefined();
    expect(typeof ci.destroy).toBe('function');
    expect(typeof ci.destroyed).toBe('boolean');
    expect(ci.destroyed).toBe(false);
  });

  it('adds stage to parent', () => {
    createClickableImage(parent, bus, { url: 'test.png', x: 0, y: 0, width: 100, height: 100 });
    expect(parent.stage.addChild).toHaveBeenCalled();
  });

  it('subscribes to fullscreen:active/inactive', () => {
    const onSpy = vi.spyOn(bus, 'on');
    createClickableImage(parent, bus, { url: 'test.png', x: 0, y: 0, width: 100, height: 100 });
    expect(onSpy).toHaveBeenCalledWith('fullscreen:active', expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith('fullscreen:inactive', expect.any(Function));
  });

  it('destroy toggles destroyed', () => {
    const ci = createClickableImage(parent, bus, { url: 'test.png', x: 0, y: 0, width: 100, height: 100 });
    expect(ci.destroyed).toBe(false);
    ci.destroy();
    expect(ci.destroyed).toBe(true);
  });

  it('destroy calls offPointer', () => {
    const ci = createClickableImage(parent, bus, { url: 'test.png', x: 0, y: 0, width: 100, height: 100 });
    ci.destroy();
    expect(parent.offPointer).toHaveBeenCalled();
  });

  it('destroy is idempotent', () => {
    const ci = createClickableImage(parent, bus, { url: 'test.png', x: 0, y: 0, width: 100, height: 100 });
    ci.destroy();
    expect(() => ci.destroy()).not.toThrow();
  });

  it('calls Assets.load with url', async () => {
    const { Assets } = await import('pixi.js');
    createClickableImage(parent, bus, { url: 'test.png', x: 0, y: 0, width: 100, height: 100 });
    expect(Assets.load).toHaveBeenCalledWith({ src: 'test.png' });
  });
});
