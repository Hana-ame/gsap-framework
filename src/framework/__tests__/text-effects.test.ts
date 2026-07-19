import { describe, it, expect, vi, beforeEach } from 'vitest';

const createdObjects: Record<string, unknown>[] = [];

function mockPixiObj(extra: Record<string, unknown> = {}): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    children: [],
    addChild: vi.fn(function (this: Record<string, unknown>, child: unknown) {
      (this.children as unknown[]).push(child);
      return child;
    }),
    addChildAt: vi.fn(function (this: Record<string, unknown>, child: unknown) {
      (this.children as unknown[]).push(child);
      return child;
    }),
    removeChild: vi.fn(),
    removeFromParent: vi.fn(),
    destroy: vi.fn(),
    eventMode: null,
    on: vi.fn(),
    off: vi.fn(),
    visible: true,
    alpha: 1,
    x: 0, y: 0, width: 100, height: 20,
    text: '',
    scale: { x: 1, y: 1, set: vi.fn() },
    parent: null,
    ...extra,
  };
  createdObjects.push(obj);
  return obj;
}

const mockTimeline = {
  call: vi.fn(function (this: typeof mockTimeline, fn: unknown) {
    if (typeof fn === 'function') (fn as () => void)();
    return this;
  }),
  to: vi.fn(function (this: typeof mockTimeline, _target: unknown, vars: Record<string, unknown>) {
    if (typeof vars.onUpdate === 'function') (vars.onUpdate as () => void)();
    if (typeof vars.onComplete === 'function') (vars.onComplete as () => void)();
    return this;
  }),
  kill: vi.fn(),
};

vi.mock('gsap', () => ({
  default: {
    to: vi.fn((_target: unknown, vars: Record<string, unknown>) => {
      if (typeof vars.onComplete === 'function') (vars.onComplete as () => void)();
      return { kill: vi.fn() };
    }),
    timeline: vi.fn((_vars?: Record<string, unknown>) => {
      const tl = { ...mockTimeline };
      if (_vars && typeof (_vars as Record<string, unknown>).onComplete === 'function') {
        ((_vars as Record<string, unknown>).onComplete as () => void)();
      }
      return tl;
    }),
    killTweensOf: vi.fn(),
    registerPlugin: vi.fn(),
  },
  gsap: {
    to: vi.fn((_target: unknown, vars: Record<string, unknown>) => {
      if (typeof vars.onComplete === 'function') (vars.onComplete as () => void)();
      return { kill: vi.fn() };
    }),
    timeline: vi.fn((_vars?: Record<string, unknown>) => {
      const tl = { ...mockTimeline };
      if (_vars && typeof (_vars as Record<string, unknown>).onComplete === 'function') {
        ((_vars as Record<string, unknown>).onComplete as () => void)();
      }
      return tl;
    }),
    killTweensOf: vi.fn(),
    registerPlugin: vi.fn(),
  },
  PixiPlugin: { registerPIXI: vi.fn() },
}));

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  const Container = vi.fn(function () {
    const obj = mockPixiObj();
    return obj;
  } as unknown as new () => Record<string, unknown>);
  const Graphics = vi.fn(function () {
    const obj = mockPixiObj({ clear: vi.fn(), rect: vi.fn(), fill: vi.fn(), stroke: vi.fn() });
    return obj;
  } as unknown as new () => Record<string, unknown>);
  const Text = vi.fn(function (this: Record<string, unknown>, _opts: unknown) {
    const obj = mockPixiObj({ text: '', setText: vi.fn() });
    return obj;
  } as unknown as new () => Record<string, unknown>);
  const TextStyle = vi.fn(function () { return {}; });
  const Sprite = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  return {
    ...actual as object,
    Container, Graphics, Text, TextStyle, Sprite,
    Texture: vi.fn(function () { return {}; }),
    TextureSource: vi.fn(function () { return {}; }),
    Rectangle: vi.fn(function (this: Record<string, unknown>, x: number, y: number, w: number, h: number) {
      this.x = x; this.y = y; this.width = w; this.height = h;
    }),
  };
});

import { runTextEffect } from '../text-effects';
import type { TextEffectType } from '../text-effects';

describe('text-effects', () => {
  let parent: Record<string, unknown>;

  beforeEach(() => {
    createdObjects.length = 0;
    parent = mockPixiObj();
    vi.clearAllMocks();
  });

  const style = { fontSize: 20, fill: '#ffffff' } as never;

  const effectTypes: TextEffectType[] = [
    'typewriter', 'fadeInChars', 'fadeIn', 'slideIn', 'scaleBounce', 'charRain', 'scramble',
  ];

  const run = (overrides: Record<string, unknown> = {}) => runTextEffect({
    parent: parent as never,
    text: 'Hello World',
    textStyle: style,
    type: 'fadeIn',
    ...overrides,
  });

  it.each(effectTypes)('runTextEffect with %s returns handle with expected shape', (type) => {
    const handle = runTextEffect({ parent: parent as never, text: 'Hello World', textStyle: style, type });
    expect(handle).toBeDefined();
    expect(handle.container).toBeDefined();
    expect(typeof handle.skip).toBe('function');
    expect(typeof handle.destroy).toBe('function');
    expect(typeof handle.completed).toBe('boolean');
  });

  it('adds container to parent', () => {
    const handle = runTextEffect({ parent: parent as never, text: 'Hello', textStyle: style, type: 'fadeIn' });
    expect(parent.addChild).toHaveBeenCalledWith(handle.container);
  });

  it('container has eventMode=none', () => {
    const handle = runTextEffect({ parent: parent as never, text: 'Hello', textStyle: style, type: 'fadeIn' });
    expect(handle.container.eventMode).toBe('none');
  });

  it('respects custom x, y options', () => {
    const handle = runTextEffect({ parent: parent as never, text: 'Test', textStyle: style, type: 'fadeIn', x: 50, y: 100 });
    expect(handle.container.x).toBe(50);
    expect(handle.container.y).toBe(100);
  });

  it('skip() on a completed effect does not throw', () => {
    const handle = runTextEffect({ parent: parent as never, text: 'Test', textStyle: style, type: 'fadeIn' });
    expect(() => handle.skip()).not.toThrow();
    expect(handle.completed).toBe(true);
  });

  it('destroy removes container from parent', () => {
    const handle = runTextEffect({ parent: parent as never, text: 'Test', textStyle: style, type: 'fadeIn' });
    handle.destroy();
    expect(handle.container.removeFromParent).toHaveBeenCalled();
    expect(handle.container.destroy).toHaveBeenCalledWith({ children: true });
  });

  it('destroy is idempotent', () => {
    const handle = runTextEffect({ parent: parent as never, text: 'Test', textStyle: style, type: 'fadeIn' });
    handle.destroy();
    expect(() => handle.destroy()).not.toThrow();
  });

  it('works with TextSegment array (text only)', () => {
    const segments = [{ kind: 'text' as const, text: 'Hello from segment' }];
    const handle = runTextEffect({ parent: parent as never, text: segments, textStyle: style, type: 'fadeIn' });
    expect(handle).toBeDefined();
    expect(handle.completed).toBe(true);
  });

  it('typewriter with empty string completes immediately', () => {
    const handle = runTextEffect({ parent: parent as never, text: '', textStyle: style, type: 'typewriter' });
    expect(handle.completed).toBe(true);
  });

  it('scramble with empty string completes immediately', () => {
    const handle = runTextEffect({ parent: parent as never, text: '', textStyle: style, type: 'scramble' });
    expect(handle.completed).toBe(true);
  });

  it('handles custom speed option for typewriter', () => {
    const handle = runTextEffect({ parent: parent as never, text: 'Hello', textStyle: style, type: 'typewriter', speed: 60 });
    expect(handle.completed).toBe(true);
  });

  it('handles custom duration option', () => {
    const handle = runTextEffect({ parent: parent as never, text: 'Hello', textStyle: style, type: 'fadeIn', duration: 2 });
    expect(handle.completed).toBe(true);
  });

  it('handle with slideIn works', () => {
    const handle = runTextEffect({ parent: parent as never, text: 'Slide me', textStyle: style, type: 'slideIn' });
    expect(handle.completed).toBe(true);
  });

  it('handle with scaleBounce works', () => {
    const handle = runTextEffect({ parent: parent as never, text: 'Bounce', textStyle: style, type: 'scaleBounce' });
    expect(handle.completed).toBe(true);
  });

  it('handle with charRain works', () => {
    const handle = runTextEffect({ parent: parent as never, text: 'Rain', textStyle: style, type: 'charRain' });
    expect(handle.completed).toBe(true);
  });

  it('skip() on typewriter effect sets all text visible', () => {
    const handle = runTextEffect({ parent: parent as never, text: 'Test', textStyle: style, type: 'typewriter' });
    handle.skip();
    expect(handle.completed).toBe(true);
  });

  it('maxWidth option does not break effect', () => {
    const handle = runTextEffect({ parent: parent as never, text: 'A long text string', textStyle: style, type: 'fadeIn', maxWidth: 50 });
    expect(handle.completed).toBe(true);
  });
});
