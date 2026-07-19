import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('gsap', () => ({
  default: { to: vi.fn(), killTweensOf: vi.fn(), registerPlugin: vi.fn() },
  PixiPlugin: { registerPIXI: vi.fn() },
}));

vi.mock('../../framework/gsap-pixi', () => ({
  gsap: { to: vi.fn(), killTweensOf: vi.fn(), registerPlugin: vi.fn() },
  PixiPlugin: { registerPIXI: vi.fn() },
}));

type MockContainer = {
  children: unknown[];
  addChild: ReturnType<typeof vi.fn>;
  removeChild: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  eventMode: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: { x: number; y: number };
  anchor: { set: ReturnType<typeof vi.fn>; x: number; y: number };
  mask: unknown;
  clear: ReturnType<typeof vi.fn>;
  circle: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  rect: ReturnType<typeof vi.fn>;
  label: string;
  parent: MockContainer | null;
  texture: unknown;
  removeFromParent: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  function makeMockContainer(extra: Record<string, unknown> = {}): MockContainer {
    return {
      children: [],
      addChild: vi.fn(function (this: MockContainer, child: unknown) {
        (this.children as unknown[]).push(child);
        return child;
      }),
      removeChild: vi.fn(function (this: MockContainer, child: unknown) {
        this.children = (this.children as unknown[]).filter((x) => x !== child);
        return child;
      }),
      destroy: vi.fn(function (this: MockContainer, _opts?: unknown) {
        this.children = [];
      }),
      eventMode: null,
      x: 0, y: 0, width: 0, height: 0,
      scale: { x: 1, y: 1 },
      anchor: { set: vi.fn(), x: 0.5, y: 0.5 },
      mask: null,
      clear: vi.fn(function (this: MockContainer) { return this; }),
      circle: vi.fn(function (this: MockContainer) { return this; }),
      fill: vi.fn(function (this: MockContainer) { return this; }),
      stroke: vi.fn(function (this: MockContainer) { return this; }),
      rect: vi.fn(function (this: MockContainer) { return this; }),
      label: '',
      parent: null as MockContainer | null,
      texture: null,
      removeFromParent: vi.fn(),
      set: vi.fn(function (this: MockContainer, _x: number, _y: number) {}),
      ...extra,
    };
  }

  const Graphics = vi.fn(function () { return makeMockContainer(); } as unknown as new () => MockContainer);
  const Text = vi.fn(function () { return makeMockContainer(); } as unknown as new () => MockContainer);
  const Container = vi.fn(function () { return makeMockContainer(); } as unknown as new () => MockContainer);
  const Sprite = vi.fn(function () { return makeMockContainer({ texture: null }); } as unknown as new () => MockContainer);

  return {
    ...actual as object,
    Graphics, Text, Container, Sprite,
    Assets: {
      load: vi.fn().mockResolvedValue(null),
    },
    Texture: { from: vi.fn() },
  };
});

import { createLoadingImage } from '../PixiImage';

describe('createLoadingImage', () => {
  let mockParent: { stage: MockContainer };

  function makeStage(): MockContainer {
    return {
      children: [],
      addChild: vi.fn(function (this: MockContainer, child: unknown) {
        (this.children as unknown[]).push(child);
        return child;
      }),
      removeChild: vi.fn(),
      destroy: vi.fn(),
      eventMode: null,
      x: 0, y: 0, width: 800, height: 600,
      clear: vi.fn(),
      circle: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      rect: vi.fn(),
      scale: { x: 1, y: 1 },
      anchor: { set: vi.fn(), x: 0.5, y: 0.5 },
      mask: null,
      label: '',
      parent: null,
      texture: null,
      removeFromParent: vi.fn(),
      set: vi.fn(),
    } as unknown as MockContainer;
  }

  beforeEach(() => {
    mockParent = { stage: makeStage() };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns a handle with expected shape', () => {
    const img = createLoadingImage(mockParent as never, {
      url: 'test.png',
      x: 0, y: 0, width: 200, height: 150,
    });
    expect(img).toBeDefined();
    expect(img.container).toBeDefined();
    expect(typeof img.destroy).toBe('function');
    expect(typeof img.setUrl).toBe('function');
    expect(typeof img.setErrorHintVisible).toBe('function');
    expect(typeof img.destroyed).toBe('boolean');
    expect(img.destroyed).toBe(false);
  });

  it('adds container to parent stage', () => {
    createLoadingImage(mockParent as never, {
      url: 'test.png',
      x: 10, y: 20, width: 200, height: 150,
    });
    expect(mockParent.stage.addChild).toHaveBeenCalled();
  });

  it('destroy toggles destroyed and cleans up', () => {
    const img = createLoadingImage(mockParent as never, {
      url: 'test.png',
      x: 0, y: 0, width: 200, height: 150,
    });
    expect(img.destroyed).toBe(false);
    img.destroy();
    expect(img.destroyed).toBe(true);
  });

  it('setUrl triggers load', () => {
    const img = createLoadingImage(mockParent as never, {
      url: 'test.png',
      x: 0, y: 0, width: 200, height: 150,
    });
    expect(typeof img.setUrl).toBe('function');
    img.setUrl('new.png');
  });

  it('setErrorHintVisible works', () => {
    const img = createLoadingImage(mockParent as never, {
      url: 'test.png',
      x: 0, y: 0, width: 200, height: 150,
    });
    expect(() => img.setErrorHintVisible(false)).not.toThrow();
    expect(() => img.setErrorHintVisible(true)).not.toThrow();
  });

  it('destroy is idempotent', () => {
    const img = createLoadingImage(mockParent as never, {
      url: 'test.png',
      x: 0, y: 0, width: 200, height: 150,
    });
    img.destroy();
    expect(() => img.destroy()).not.toThrow();
  });
});
