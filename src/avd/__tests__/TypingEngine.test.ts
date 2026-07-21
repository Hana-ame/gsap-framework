import { describe, it, expect, vi } from 'vitest';

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  const Container = vi.fn(function () { return { children: [], addChild: vi.fn(), removeChild: vi.fn(), removeFromParent: vi.fn(), destroy: vi.fn(), eventMode: null, on: vi.fn(), off: vi.fn(), visible: true }; });
  const Text = vi.fn(function () { return { children: [], addChild: vi.fn(), removeChild: vi.fn(), removeFromParent: vi.fn(), destroy: vi.fn(), eventMode: null, on: vi.fn(), off: vi.fn(), visible: true, text: '', width: 50, height: 16, style: {} }; });
  const TextStyle = vi.fn(function () { return {}; });
  const Sprite = vi.fn(function () { return { children: [], addChild: vi.fn(), removeChild: vi.fn(), removeFromParent: vi.fn(), destroy: vi.fn(), eventMode: null, on: vi.fn(), off: vi.fn(), visible: true, anchor: { set: vi.fn() } }; });
  return {
    ...actual as object,
    Container, Text, TextStyle, Sprite,
  };
});

vi.mock('@framework/text-effects-layout', () => ({
  buildLayout: vi.fn(() => ({
    container: { children: [], addChild: vi.fn(), removeChild: vi.fn(), destroy: vi.fn() },
    items: [
      { kind: 'text', textObj: { visible: false, text: '' }, textContent: 'Hello', startUnit: 0, endUnit: 5 },
    ],
    totalUnits: 5,
  })),
}));

import * as PIXI from 'pixi.js';
import { TypingEngine } from '../TypingEngine';

describe('TypingEngine', () => {
  it('constructs', () => {
    const te = new TypingEngine();
    expect(te.active).toBe(false);
  });

  it('start returns a container', () => {
    const te = new TypingEngine();
    const style = new PIXI.TextStyle();
    const container = te.start('Hello', 30, style, 300, 28);
    expect(container).toBeDefined();
    expect(te.active).toBe(true);
  });

  it('update reveals characters', () => {
    const te = new TypingEngine();
    const style = new PIXI.TextStyle();
    te.start('Hello', 1000, style, 300, 28);
    expect(te.revealedChars).toBe(0);
    te.update(1000);
    expect(te.revealedChars).toBeGreaterThan(0);
  });

  it('complete finishes immediately', () => {
    const te = new TypingEngine();
    const style = new PIXI.TextStyle();
    te.start('Hello', 30, style, 300, 28);
    te.complete();
    expect(te.revealedChars).toBe(5);
    expect(te.active).toBe(false);
  });

  it('destroy cleans up', () => {
    const te = new TypingEngine();
    const style = new PIXI.TextStyle();
    te.start('Hello', 30, style, 300, 28);
    te.destroy();
    expect(te.active).toBe(false);
  });

  it('progress returns 1 when idle', () => {
    const te = new TypingEngine();
    expect(te.progress).toBe(1);
  });

  it('progress returns 0 before any update', () => {
    const te = new TypingEngine();
    const style = new PIXI.TextStyle();
    te.start('Hello', 30, style, 300, 28);
    expect(te.progress).toBe(0);
  });
});
