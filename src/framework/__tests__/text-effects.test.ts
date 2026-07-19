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
  kill: vi.fn(),
};

vi.mock('../../framework/gsap-pixi', () => ({
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
    (obj as Record<string, unknown>).addChildAt = vi.fn(function (this: Record<string, unknown>, child: unknown) {
      (this.children as unknown[]).push(child);
      return child;
    });
    return obj;
  });
  const Text = vi.fn(function (_config: Record<string, unknown>) {
    return mockPixiObj({ text: (_config?.text as string) ?? '' });
  });
  const Sprite = vi.fn(function () { return mockPixiObj(); });
  const Graphics = vi.fn(function () { return mockPixiObj(); });
  const TextStyle = vi.fn();
  const Rectangle = vi.fn();
  return { ...(actual as object), Container, Text, Sprite, Graphics, TextStyle, Rectangle };
});

import { runTextEffect } from '../text-effects';
import type { TextEffectType } from '../text-effects';

describe('text-effects', () => {
  let parent: Record<string, unknown>;

  beforeEach(() => {
    createdObjects.length = 0;
    parent = mockPixiObj();
  });

  const style = { fontSize: 20, fill: '#ffffff' } as never;

  const effectTypes: TextEffectType[] = [
    'typewriter', 'fadeInChars', 'fadeIn', 'slideIn', 'scaleBounce', 'charRain', 'scramble',
  ];

  it.each(effectTypes)('runTextEffect with %s returns handle with expected shape', (type) => {
    const handle = runTextEffect(parent as never, 'Hello World', style, type);
    expect(handle).toBeDefined();
    expect(handle.container).toBeDefined();
    expect(typeof handle.skip).toBe('function');
    expect(typeof handle.destroy).toBe('function');
    expect(typeof handle.completed).toBe('boolean');
  });

  it('adds container to parent', () => {
    const handle = runTextEffect(parent as never, 'Hello', style, 'fadeIn');
    expect(parent.addChild).toHaveBeenCalledWith(handle.container);
  });

  it('container has eventMode=none', () => {
    const handle = runTextEffect(parent as never, 'Hello', style, 'fadeIn');
    expect(handle.container.eventMode).toBe('none');
  });

  it('respects custom x, y options', () => {
    const handle = runTextEffect(parent as never, 'Test', style, 'fadeIn', { x: 50, y: 100 });
    expect(handle.container.x).toBe(50);
    expect(handle.container.y).toBe(100);
  });

  it('skip() on a completed effect does not throw', () => {
    const handle = runTextEffect(parent as never, 'Test', style, 'fadeIn');
    expect(() => handle.skip()).not.toThrow();
    expect(handle.completed).toBe(true);
  });

  it('destroy removes container from parent', () => {
    const handle = runTextEffect(parent as never, 'Test', style, 'fadeIn');
    handle.destroy();
    expect(handle.container.removeFromParent).toHaveBeenCalled();
    expect(handle.container.destroy).toHaveBeenCalledWith({ children: true });
  });

  it('destroy is idempotent', () => {
    const handle = runTextEffect(parent as never, 'Test', style, 'fadeIn');
    handle.destroy();
    expect(() => handle.destroy()).not.toThrow();
  });

  it('works with TextSegment array (text only)', () => {
    const segments = [{ kind: 'text' as const, text: 'Hello from segment' }];
    const handle = runTextEffect(parent as never, segments, style, 'fadeIn');
    expect(handle).toBeDefined();
    expect(handle.completed).toBe(true);
  });

  it('typewriter with empty string completes immediately', () => {
    const handle = runTextEffect(parent as never, '', style, 'typewriter');
    expect(handle.completed).toBe(true);
  });

  it('scramble with empty string completes immediately', () => {
    const handle = runTextEffect(parent as never, '', style, 'scramble');
    expect(handle.completed).toBe(true);
  });

  it('handles custom speed option for typewriter', () => {
    const handle = runTextEffect(parent as never, 'Hello', style, 'typewriter', { speed: 60 });
    expect(handle.completed).toBe(true);
  });

  it('handles custom duration option', () => {
    const handle = runTextEffect(parent as never, 'Hello', style, 'fadeIn', { duration: 2 });
    expect(handle.completed).toBe(true);
  });

  it('handle with slideIn works', () => {
    const handle = runTextEffect(parent as never, 'Slide me', style, 'slideIn');
    expect(handle.completed).toBe(true);
  });

  it('handle with scaleBounce works', () => {
    const handle = runTextEffect(parent as never, 'Bounce', style, 'scaleBounce');
    expect(handle.completed).toBe(true);
  });

  it('handle with charRain works', () => {
    const handle = runTextEffect(parent as never, 'Rain', style, 'charRain');
    expect(handle.completed).toBe(true);
  });

  it('skip() on typewriter effect sets all text visible', () => {
    const handle = runTextEffect(parent as never, 'Test', style, 'typewriter');
    handle.skip();
    expect(handle.completed).toBe(true);
  });

  it('maxWidth option does not break effect', () => {
    const handle = runTextEffect(parent as never, 'A long text string', style, 'fadeIn', { maxWidth: 50 });
    expect(handle.completed).toBe(true);
  });
});
