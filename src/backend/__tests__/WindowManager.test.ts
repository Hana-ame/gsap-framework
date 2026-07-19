import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MockBackend } from '../MockBackend';
import { WindowManager } from '../WindowManager';
import { SubCanvas } from '../../framework/SubCanvas';

let mockDestroyed = false;

function makeMockWindow() {
  let vis = true;
  return {
    stage: { addChild: vi.fn(), removeChild: vi.fn(), children: [] },
    bounds: { x: 0, y: 0, width: 400, height: 300 },
    createRegion: vi.fn(() => makeMockWindow()),
    setPosition: vi.fn(),
    setSize: vi.fn(),
    removeChildren: vi.fn(),
    destroy: vi.fn(() => { mockDestroyed = true; }),
    setTitle: vi.fn(),
    content: {
      stage: { addChild: vi.fn(), removeChild: vi.fn(), children: [] },
      bounds: { x: 0, y: 0, width: 380, height: 278 },
      removeChildren: vi.fn(),
    },
    get destroyed() { return mockDestroyed; },
    get visible() { return vis; },
    set visible(v: boolean) { vis = v; },
    bringToFront: vi.fn(),
  };
}

vi.mock('../../components/PixiWindow', () => ({
  createWindow: vi.fn(() => makeMockWindow()),
}));

vi.mock('../../framework/SubCanvas', () => {
  class MockSubCanvas {
    stage = { addChild: vi.fn(), removeChild: vi.fn(), children: [], destroyed: false };
    bounds = { x: 0, y: 0, width: 0, height: 0 };
    destroyed = false;
    listeners = new Map();
    subRegions: MockSubCanvas[] = [];
    createRegion = vi.fn((_b, _o?) => {
      const sub = new MockSubCanvas();
      this.subRegions.push(sub);
      return sub;
    });
    setPosition = vi.fn((x, y) => { this.bounds = { ...this.bounds, x, y }; });
    setSize = vi.fn((w, h) => { this.bounds = { ...this.bounds, width: w, height: h }; });
    onPress = vi.fn();
    onMove = vi.fn();
    onRelease = vi.fn();
    removeChildren = vi.fn();
    addChild = vi.fn((c: unknown) => c);
    destroy = vi.fn(() => { this.destroyed = true; });
    setTitle = vi.fn();
  }
  return { SubCanvas: MockSubCanvas };
});


describe('WindowManager', () => {
  let backend: MockBackend;
  let parent: SubCanvas;
  let wm: WindowManager;

  beforeEach(() => {
    vi.useFakeTimers();
    backend = new MockBackend();
    parent = new SubCanvas({
      rootApp: { stage: new (vi.mocked(SubCanvas as unknown as new () => SubCanvas))() } as never,
      bounds: { x: 0, y: 0, width: 800, height: 600 },
    });
    backend.connect(10);
    vi.advanceTimersByTime(10);
  });

  afterEach(() => {
    wm?.destroy();
    backend.destroy();
    vi.useRealTimers();
  });

  it('opens window on backend command', () => {
    wm = new WindowManager(backend, parent);
    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 100, y: 100, width: 400, height: 300,
    });

    expect(wm.getWindowCount()).toBe(1);
    expect(wm.getWindow('w1')).toBeDefined();
  });

  it('closes window on backend command', () => {
    wm = new WindowManager(backend, parent);
    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 100, y: 100, width: 400, height: 300,
    });
    expect(wm.getWindowCount()).toBe(1);

    backend.send('close-window', { id: 'w1' });
    expect(wm.getWindowCount()).toBe(0);
  });

  it('handles multiple windows', () => {
    wm = new WindowManager(backend, parent);
    backend.send('open-window', {
      id: 'w1', title: 'A', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('open-window', {
      id: 'w2', title: 'B', x: 300, y: 0, width: 200, height: 200,
    });

    expect(wm.getWindowCount()).toBe(2);
  });

  it('ignores duplicate open-window for same id', () => {
    wm = new WindowManager(backend, parent);
    backend.send('open-window', {
      id: 'w1', title: 'A', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('open-window', {
      id: 'w1', title: 'A dup', x: 100, y: 100, width: 300, height: 300,
    });

    expect(wm.getWindowCount()).toBe(1);
  });

  it('getOpenWindows returns current specs', () => {
    wm = new WindowManager(backend, parent);
    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 100, y: 100, width: 400, height: 300,
    });

    const specs = wm.getOpenWindows();
    expect(specs).toHaveLength(1);
    expect(specs[0].id).toBe('w1');
    expect(specs[0].title).toBe('Test');
  });

  it('closeAll removes all windows', () => {
    wm = new WindowManager(backend, parent);
    backend.send('open-window', {
      id: 'w1', title: 'A', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('open-window', {
      id: 'w2', title: 'B', x: 300, y: 0, width: 200, height: 200,
    });

    wm.closeAll();
    expect(wm.getWindowCount()).toBe(0);
  });

  it('destroy cleans up windows and unsubs', () => {
    wm = new WindowManager(backend, parent);
    backend.send('open-window', {
      id: 'w1', title: 'A', x: 0, y: 0, width: 200, height: 200,
    });
    wm.destroy();
    expect(wm.getWindowCount()).toBe(0);
  });

  it('hide-window sets visible=false', () => {
    wm = new WindowManager(backend, parent);
    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    const win = wm.getWindow('w1')!;
    expect(win.visible).toBe(true);

    backend.send('hide-window', { id: 'w1' });
    expect(win.visible).toBe(false);
  });

  it('show-window sets visible=true', () => {
    wm = new WindowManager(backend, parent);
    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    const win = wm.getWindow('w1')!;
    win.visible = false;

    backend.send('show-window', { id: 'w1' });
    expect(win.visible).toBe(true);
  });

  it('focus-window calls bringToFront', () => {
    wm = new WindowManager(backend, parent);
    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    const win = wm.getWindow('w1')!;

    backend.send('focus-window', { id: 'w1' });
    expect(win.bringToFront).toHaveBeenCalled();
  });

  it('hide/show/focus on non-existent window does not throw', () => {
    wm = new WindowManager(backend, parent);
    expect(() => {
      backend.send('hide-window', { id: 'nonexistent' });
      backend.send('show-window', { id: 'nonexistent' });
      backend.send('focus-window', { id: 'nonexistent' });
    }).not.toThrow();
  });

  it('close-window on non-existent does not throw', () => {
    wm = new WindowManager(backend, parent);
    expect(() => backend.send('close-window', { id: 'nonexistent' })).not.toThrow();
  });

  it('move-window calls setPosition', () => {
    wm = new WindowManager(backend, parent);
    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    const win = wm.getWindow('w1')!;
    backend.send('move-window', { id: 'w1', x: 150, y: 250 });
    expect(win.setPosition).toHaveBeenCalledWith(150, 250);
  });

  it('resize-window calls setSize', () => {
    wm = new WindowManager(backend, parent);
    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    const win = wm.getWindow('w1')!;
    backend.send('resize-window', { id: 'w1', width: 400, height: 300 });
    expect(win.setSize).toHaveBeenCalledWith(400, 300);
  });

  it('set-title calls setTitle', () => {
    wm = new WindowManager(backend, parent);
    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    const win = wm.getWindow('w1')!;
    backend.send('set-title', { id: 'w1', title: 'Updated' });
    expect(win.setTitle).toHaveBeenCalledWith('Updated');
  });

  it('move/resize/set-title on non-existent does not throw', () => {
    wm = new WindowManager(backend, parent);
    expect(() => {
      backend.send('move-window', { id: 'noop', x: 0, y: 0 });
      backend.send('resize-window', { id: 'noop', width: 100, height: 100 });
      backend.send('set-title', { id: 'noop', title: 'x' });
    }).not.toThrow();
  });

  it('clear-content on non-existent does not throw', () => {
    wm = new WindowManager(backend, parent);
    expect(() => backend.send('clear-content', { windowId: 'noop' })).not.toThrow();
  });

  it('set-content without open window does not throw', () => {
    wm = new WindowManager(backend, parent);
    expect(() => backend.send('set-content', { windowId: 'noop', type: 'text' })).not.toThrow();
  });

  it('getWindow on non-existent returns undefined', () => {
    wm = new WindowManager(backend, parent);
    expect(wm.getWindow('noop')).toBeUndefined();
  });
});
