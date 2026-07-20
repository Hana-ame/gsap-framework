import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MockBackend } from '../MockBackend';
import { WindowManager } from '../WindowManager';

describe('WindowManager', () => {
  let backend: MockBackend;
  let wm: WindowManager;

  beforeEach(() => {
    vi.useFakeTimers();
    backend = new MockBackend();
    backend.connect(10);
    vi.advanceTimersByTime(10);
  });

  afterEach(() => {
    wm?.destroy();
    backend.destroy();
    vi.useRealTimers();
  });

  it('opens window on backend command', () => {
    wm = new WindowManager(backend);
    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 100, y: 100, width: 400, height: 300,
    });

    expect(wm.getWindowCount()).toBe(1);
    expect(wm.getWindow('w1')).toBeDefined();
    expect(wm.getWindow('w1')?.title).toBe('Test');
  });

  it('emits window-opened event', () => {
    wm = new WindowManager(backend);
    const handler = vi.fn();
    wm.on('window-opened', handler);

    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 100, y: 100, width: 400, height: 300,
    });

    expect(handler).toHaveBeenCalledWith({
      spec: expect.objectContaining({ id: 'w1', title: 'Test' }),
    });
  });

  it('emits window-closed event on backend command', () => {
    wm = new WindowManager(backend);
    const handler = vi.fn();
    wm.on('window-closed', handler);

    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('close-window', { id: 'w1' });

    expect(wm.getWindowCount()).toBe(0);
    expect(handler).toHaveBeenCalledWith({ id: 'w1' });
  });

  it('handles multiple windows', () => {
    wm = new WindowManager(backend);
    backend.send('open-window', {
      id: 'w1', title: 'A', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('open-window', {
      id: 'w2', title: 'B', x: 300, y: 0, width: 200, height: 200,
    });

    expect(wm.getWindowCount()).toBe(2);
  });

  it('ignores duplicate open-window for same id', () => {
    wm = new WindowManager(backend);
    backend.send('open-window', {
      id: 'w1', title: 'A', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('open-window', {
      id: 'w1', title: 'A dup', x: 100, y: 100, width: 300, height: 300,
    });

    expect(wm.getWindowCount()).toBe(1);
  });

  it('getOpenWindows returns current specs', () => {
    wm = new WindowManager(backend);
    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 100, y: 100, width: 400, height: 300,
    });

    const specs = wm.getOpenWindows();
    expect(specs).toHaveLength(1);
    expect(specs[0].id).toBe('w1');
    expect(specs[0].title).toBe('Test');
  });

  it('closeAll removes all windows', () => {
    wm = new WindowManager(backend);
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
    wm = new WindowManager(backend);
    backend.send('open-window', {
      id: 'w1', title: 'A', x: 0, y: 0, width: 200, height: 200,
    });
    wm.destroy();
    expect(wm.getWindowCount()).toBe(0);
  });

  it('emits window-hidden event on hide-window command', () => {
    wm = new WindowManager(backend);
    const handler = vi.fn();
    wm.on('window-hidden', handler);

    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('hide-window', { id: 'w1' });

    expect(handler).toHaveBeenCalledWith({ id: 'w1' });
  });

  it('emits window-shown event on show-window command', () => {
    wm = new WindowManager(backend);
    const handler = vi.fn();
    wm.on('window-shown', handler);

    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('show-window', { id: 'w1' });

    expect(handler).toHaveBeenCalledWith({ id: 'w1' });
  });

  it('emits window-focused event on focus-window command', () => {
    wm = new WindowManager(backend);
    const handler = vi.fn();
    wm.on('window-focused', handler);

    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('focus-window', { id: 'w1' });

    expect(handler).toHaveBeenCalledWith({ id: 'w1' });
  });

  it('hide/show/focus on non-existent window does not throw', () => {
    wm = new WindowManager(backend);
    expect(() => {
      backend.send('hide-window', { id: 'nonexistent' });
      backend.send('show-window', { id: 'nonexistent' });
      backend.send('focus-window', { id: 'nonexistent' });
    }).not.toThrow();
  });

  it('close-window on non-existent does not throw', () => {
    wm = new WindowManager(backend);
    expect(() => backend.send('close-window', { id: 'nonexistent' })).not.toThrow();
  });

  it('emits window-moved event on move-window command', () => {
    wm = new WindowManager(backend);
    const handler = vi.fn();
    wm.on('window-moved', handler);

    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('move-window', { id: 'w1', x: 150, y: 250 });

    expect(handler).toHaveBeenCalledWith({ id: 'w1', x: 150, y: 250 });
  });

  it('emits window-resized event on resize-window command', () => {
    wm = new WindowManager(backend);
    const handler = vi.fn();
    wm.on('window-resized', handler);

    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('resize-window', { id: 'w1', width: 400, height: 300 });

    expect(handler).toHaveBeenCalledWith({ id: 'w1', width: 400, height: 300 });
  });

  it('emits window-title-changed event on set-title command', () => {
    wm = new WindowManager(backend);
    const handler = vi.fn();
    wm.on('window-title-changed', handler);

    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('set-title', { id: 'w1', title: 'Updated' });

    expect(handler).toHaveBeenCalledWith({ id: 'w1', title: 'Updated' });
  });

  it('move/resize/set-title on non-existent does not throw', () => {
    wm = new WindowManager(backend);
    expect(() => {
      backend.send('move-window', { id: 'noop', x: 0, y: 0 });
      backend.send('resize-window', { id: 'noop', width: 100, height: 100 });
      backend.send('set-title', { id: 'noop', title: 'x' });
    }).not.toThrow();
  });

  it('clear-content on non-existent does not throw', () => {
    wm = new WindowManager(backend);
    expect(() => backend.send('clear-content', { windowId: 'noop' })).not.toThrow();
  });

  it('set-content without open window does not throw', () => {
    wm = new WindowManager(backend);
    expect(() => backend.send('set-content', { windowId: 'noop', type: 'text' })).not.toThrow();
  });

  it('getWindow on non-existent returns undefined', () => {
    wm = new WindowManager(backend);
    expect(wm.getWindow('noop')).toBeUndefined();
  });

  it('emits content-set event', () => {
    wm = new WindowManager(backend);
    const handler = vi.fn();
    wm.on('content-set', handler);

    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('set-content', { windowId: 'w1', type: 'text' });

    expect(handler).toHaveBeenCalledWith({ windowId: 'w1', type: 'text' });
  });

  it('emits content-cleared event', () => {
    wm = new WindowManager(backend);
    const handler = vi.fn();
    wm.on('content-cleared', handler);

    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('clear-content', { windowId: 'w1' });

    expect(handler).toHaveBeenCalledWith({ windowId: 'w1' });
  });

  it('updates spec on move-window', () => {
    wm = new WindowManager(backend);
    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('move-window', { id: 'w1', x: 150, y: 250 });

    expect(wm.getWindow('w1')).toEqual(
      expect.objectContaining({ x: 150, y: 250 }),
    );
  });

  it('updates spec on resize-window', () => {
    wm = new WindowManager(backend);
    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('resize-window', { id: 'w1', width: 400, height: 300 });

    expect(wm.getWindow('w1')).toEqual(
      expect.objectContaining({ width: 400, height: 300 }),
    );
  });

  it('updates spec on set-title', () => {
    wm = new WindowManager(backend);
    backend.send('open-window', {
      id: 'w1', title: 'Test', x: 0, y: 0, width: 200, height: 200,
    });
    backend.send('set-title', { id: 'w1', title: 'Updated' });

    expect(wm.getWindow('w1')?.title).toBe('Updated');
  });
});
