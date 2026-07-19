import { describe, it, expect, vi } from 'vitest';

const createdObjects: Record<string, unknown>[] = [];

function mockPixiObj(extra: Record<string, unknown> = {}): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    children: [],
    addChild: vi.fn(function (this: Record<string, unknown>, child: unknown) {
      (this.children as unknown[]).push(child);
      return child;
    }),
    destroy: vi.fn(),
    x: 0, y: 0, width: 50, height: 20,
    text: '',
    anchor: { set: vi.fn() },
    visible: true,
    ...extra,
  };
  createdObjects.push(obj);
  return obj;
}

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  const Container = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  const Text = vi.fn(function () { return mockPixiObj({ width: 50, height: 16 }); } as unknown as new () => Record<string, unknown>);
  const Sprite = vi.fn(function () { return mockPixiObj({ width: 50, height: 50 }); } as unknown as new () => Record<string, unknown>);
  const TextStyle = vi.fn();
  return {
    ...actual as object,
    Container, Text, Sprite, TextStyle,
  };
});

import { buildInlineLayout, updateInlineLayout, destroyInlineLayout } from '../AvdInlineLayout';

const BASE_OPTS = { maxWidth: 300, lineHeight: 30, fontSize: 16, fontFamily: 'sans-serif', fill: 0xffffff };

describe('buildInlineLayout', () => {
  it('builds layout from text segment', () => {
    const segments = [{ kind: 'text' as const, text: 'Hello world' }];
    const layout = buildInlineLayout(segments, BASE_OPTS);
    expect(layout.container).toBeDefined();
    expect(layout.items.length).toBeGreaterThan(0);
    expect(layout.totalUnits).toBe(11);
  });

  it('builds layout from image segment', () => {
    const segments = [{ kind: 'image' as const, texture: {} as never, width: 50, height: 50 }];
    const layout = buildInlineLayout(segments, BASE_OPTS);
    expect(layout.items.length).toBe(1);
    expect(layout.totalUnits).toBe(0);
  });

  it('builds layout from mixed segments', () => {
    const segments = [
      { kind: 'text' as const, text: 'Hi ' },
      { kind: 'image' as const, texture: {} as never, width: 50, height: 50 },
      { kind: 'text' as const, text: ' there' },
    ];
    const layout = buildInlineLayout(segments, BASE_OPTS);
    expect(layout.items.length).toBeGreaterThan(0);
  });

  it('wraps text that exceeds maxWidth', () => {
    const segments = [{ kind: 'text' as const, text: 'A'.repeat(200) }];
    const layout = buildInlineLayout(segments, BASE_OPTS);
    expect(layout.items.length).toBeGreaterThan(0);
  });

  it('handles empty segments', () => {
    const layout = buildInlineLayout([], BASE_OPTS);
    expect(layout.container).toBeDefined();
    expect(layout.items.length).toBe(0);
    expect(layout.totalUnits).toBe(0);
  });

  it('all items start hidden', () => {
    const segments = [{ kind: 'text' as const, text: 'Hello' }];
    const layout = buildInlineLayout(segments, BASE_OPTS);
    layout.items.forEach((item) => {
      if (item.textObj) expect(item.textObj.visible).toBe(false);
      if (item.sprite) expect(item.sprite.visible).toBe(false);
    });
  });
});

describe('updateInlineLayout', () => {
  it('reveals characters progressively', () => {
    const segments = [{ kind: 'text' as const, text: 'Hello' }];
    const layout = buildInlineLayout(segments, BASE_OPTS);
    updateInlineLayout(layout, 3);
    const item = layout.items[0];
    expect(item.textObj?.visible).toBe(true);
    expect(typeof item.textObj?.text).toBe('string');
  });

  it('fully reveals at totalUnits', () => {
    const segments = [{ kind: 'text' as const, text: 'Hi' }];
    const layout = buildInlineLayout(segments, BASE_OPTS);
    updateInlineLayout(layout, 2);
    const item = layout.items[0];
    expect(item.textObj?.visible).toBe(true);
  });

  it('reveals 0 chars hides all', () => {
    const segments = [{ kind: 'text' as const, text: 'Hello' }];
    const layout = buildInlineLayout(segments, BASE_OPTS);
    updateInlineLayout(layout, 0);
    const item = layout.items[0];
    expect(item.textObj?.visible).toBe(false);
  });

  it('shows image when revealedChars >= startUnit', () => {
    const segments = [{ kind: 'image' as const, texture: {} as never, width: 30, height: 30 }];
    const layout = buildInlineLayout(segments, BASE_OPTS);
    updateInlineLayout(layout, 0);
    expect(layout.items[0].sprite?.visible).toBe(true);
  });
});

describe('destroyInlineLayout', () => {
  it('destroys container', () => {
    const segments = [{ kind: 'text' as const, text: 'Test' }];
    const layout = buildInlineLayout(segments, BASE_OPTS);
    const spy = vi.spyOn(layout.container, 'destroy');
    destroyInlineLayout(layout);
    expect(spy).toHaveBeenCalledWith({ children: true });
  });
});
