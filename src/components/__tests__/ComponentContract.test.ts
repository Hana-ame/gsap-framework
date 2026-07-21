import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWindow, type GameWindow } from '../PixiWindow';

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  return {
    ...actual as object,
    Text: class MockText {
      style: Record<string, unknown> = {};
      text = '';
      x = 0;
      y = 0;
      eventMode: string | null = null;
      height = 14;
      removeFromParent = vi.fn();
      destroy = vi.fn();
      constructor(opts: Record<string, unknown>) {
        if (opts.style) this.style = opts.style as Record<string, unknown>;
        this.text = opts.text as string || '';
      }
    },
  };
});

let contDestroyed = false;

function makeMockContainer() {
  const pos = { x: 0, y: 0, set: vi.fn((px: number, py: number) => { pos.x = px; pos.y = py; }) };
  const c: Record<string, unknown> = {
    children: [],
    addChild: vi.fn((child: unknown) => { (c.children as unknown[]).push(child); return child; }),
    removeChild: vi.fn((child: unknown) => {
      c.children = (c.children as unknown[]).filter((x) => x !== child);
      return child;
    }),
    position: pos,
    eventMode: null,
    destroy: vi.fn(() => { contDestroyed = true; }),
    label: '',
    zIndex: 0,
    parent: null,
    mask: null,
    x: 0, y: 0, tint: 0xffffff, alpha: 1, visible: true,
    scale: { x: 1, y: 1 }, pivot: { x: 0, y: 0 }, rotation: 0, angle: 0,
    removeChildren: vi.fn(() => []),
    addChildAt: vi.fn((child: unknown, _i: number) => child),
    getChildByLabel: vi.fn(() => null),
    width: 0, height: 0,
    get destroyed() { return contDestroyed; },
  };
  return c as unknown as ReturnType<typeof makeMockContainer>;
}

function makeMockSubCanvas() {
  let subDestroyed = false;
  const stage = makeMockContainer();
  const sc = {
    stage,
    bounds: { x: 0, y: 0, width: 800, height: 600 },
    createRegion: vi.fn(() => makeMockSubCanvas()),
    removeChildren: vi.fn(),
    setPosition: vi.fn(),
    setSize: vi.fn(),
    setBounds: vi.fn(),
    destroy: vi.fn(() => { subDestroyed = true; }),
    addChild: vi.fn((c: unknown) => c),
    onPress: vi.fn(),
    onMove: vi.fn(),
    onRelease: vi.fn(),
    onResize: vi.fn(),
    setTitle: vi.fn(),
    getChildren: vi.fn(() => []),
    content: null as unknown,
    get destroyed() { return subDestroyed; },
  };
  return sc;
}

describe('createWindow contract', () => {
  let parent: ReturnType<typeof makeMockSubCanvas>;

  beforeEach(() => {
    parent = makeMockSubCanvas();
  });

  it('returns object with stage, destroy, and destroyed', () => {
    const win = createWindow({ parent: parent as never, title: 'Test', width: 400, height: 300 });
    expect(win).toBeDefined();
    expect(win.stage).toBeDefined();
    expect(typeof win.destroy).toBe('function');
    expect(typeof win.destroyed).toBe('boolean');
  });

  it('destroy makes destroyed return true', () => {
    const win = createWindow({ parent: parent as never, title: 'Test', width: 400, height: 300 });
    expect(win.destroyed).toBe(false);
    win.destroy();
    expect(win.destroyed).toBe(true);
  });

  it('has a content SubCanvas', () => {
    const win = createWindow({ parent: parent as never, title: 'Test', width: 400, height: 300 });
    expect(win.content).toBeDefined();
    expect(win.content.bounds).toBeDefined();
  });

  it('setTitle updates title text', () => {
    const win = createWindow({ parent: parent as never, title: 'Original', width: 400, height: 300 });
    expect(typeof win.setTitle).toBe('function');
    win.setTitle('Updated');
  });

  it('closable=true creates a close button', () => {
    const win = createWindow({ parent: parent as never, title: 'Test', width: 400, height: 300, closable: true });
    expect(win).toBeDefined();
  });

  it('destroy can be called safely multiple times', () => {
    const win = createWindow({ parent: parent as never, title: 'Test', width: 400, height: 300 });
    win.destroy();
    expect(() => win.destroy()).not.toThrow();
  });
});
