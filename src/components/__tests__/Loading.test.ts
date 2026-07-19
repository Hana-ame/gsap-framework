import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('gsap', () => ({
  default: {
    to: vi.fn((_target: unknown, _vars: Record<string, unknown>) => ({ kill: vi.fn() })),
    killTweensOf: vi.fn(),
    registerPlugin: vi.fn(),
  },
  PixiPlugin: { registerPIXI: vi.fn() },
}));

vi.mock('../../framework/gsap-pixi', () => ({
  gsap: {
    to: vi.fn((_target: unknown, _vars: Record<string, unknown>) => ({ kill: vi.fn() })),
    killTweensOf: vi.fn(),
    registerPlugin: vi.fn(),
  },
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
  clear: ReturnType<typeof vi.fn>;
  circle: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  rect: ReturnType<typeof vi.fn>;
  label: string;
  parent: MockContainer | null;
};

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  function makeMockContainer(): MockContainer {
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
      destroy: vi.fn(),
      eventMode: null,
      x: 0, y: 0, width: 0, height: 0,
      clear: vi.fn(function (this: MockContainer) { return this; }),
      circle: vi.fn(function (this: MockContainer) { return this; }),
      fill: vi.fn(function (this: MockContainer) { return this; }),
      rect: vi.fn(function (this: MockContainer) { return this; }),
      label: '',
      parent: null,
    };
  }

  const Graphics = vi.fn(function () {
    return makeMockContainer();
  } as unknown as new () => MockContainer);

  const Text = vi.fn(function () {
    return makeMockContainer();
  } as unknown as new () => MockContainer);

  return {
    ...actual as object,
    Graphics,
    Text,
    Container: vi.fn(makeMockContainer),
  };
});

import { showLoading } from '../Loading';

describe('showLoading', () => {
  let mockSC: { bounds: { width: number; height: number }; stage: MockContainer };

  afterEach(() => {
    vi.clearAllMocks();
  });

  function makeStage(): MockContainer {
    const stage = {
      children: [] as unknown[],
      addChild: vi.fn(function (this: MockContainer, child: unknown) {
        (this.children as unknown[]).push(child);
        (child as MockContainer).parent = this;
        return child;
      }),
      removeChild: vi.fn(),
      destroy: vi.fn(),
      eventMode: null,
      x: 0, y: 0, width: 400, height: 300,
      clear: vi.fn(),
      circle: vi.fn(),
      fill: vi.fn(),
      rect: vi.fn(),
      label: '',
      parent: null,
    } as unknown as MockContainer;
    return stage;
  }

  beforeEach(() => {
    mockSC = { bounds: { width: 400, height: 300 }, stage: makeStage() };
  });

  it('returns a hide function', () => {
    const hide = showLoading(mockSC as never);
    expect(typeof hide).toBe('function');
  });

  it('adds overlay, spinner, and label to stage', () => {
    showLoading(mockSC as never);
    expect(mockSC.stage.addChild).toHaveBeenCalledTimes(3);
  });

  it('hide function removes children from stage', () => {
    const hide = showLoading(mockSC as never);
    hide();
    expect(mockSC.stage.removeChild).toHaveBeenCalled();
  });

  it('does not add spinner when showSpinner is false', () => {
    showLoading(mockSC as never, { showSpinner: false });
    expect(mockSC.stage.addChild).toHaveBeenCalledTimes(2);
  });

  it('accepts string as text option', () => {
    showLoading(mockSC as never, 'Custom Loading...');
    expect(mockSC.stage.addChild).toHaveBeenCalled();
  });

  it('hide is idempotent (calling twice does not throw)', () => {
    const hide = showLoading(mockSC as never);
    hide();
    expect(() => hide()).not.toThrow();
  });
});
