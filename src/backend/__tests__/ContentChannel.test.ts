import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MockBackend } from '../MockBackend';
import { ContentChannel } from '../ContentChannel';

vi.mock('../../framework/SubCanvas', () => {
  class MockSubCanvas {
    stage = { addChild: vi.fn(), removeChild: vi.fn(), children: [] };
    bounds = { x: 0, y: 0, width: 400, height: 300 };
    destroyed = false;
    removeChildren = vi.fn();
    destroy = vi.fn(() => { this.destroyed = true; });
  }
  return { SubCanvas: MockSubCanvas };
});

vi.mock('pixi.js', () => {
  const mockText = vi.fn(function () {
    return { x: 0, y: 0, addChild: vi.fn(), removeFromParent: vi.fn(), destroy: vi.fn() };
  });
  return {
    Text: mockText,
    Assets: { load: vi.fn() },
  };
});

describe('ContentChannel', () => {
  it('receives stream-content commands from backend', () => {
    vi.useFakeTimers();
    const backend = new MockBackend();
    backend.connect(10);
    vi.advanceTimersByTime(10);

    const cc = new ContentChannel(backend);
    const handler = vi.fn();
    cc.onMessage(handler);

    backend.send('stream-content', {
      windowId: 'w1',
      text: 'hello',
      seq: 0,
      total: 1,
      done: true,
    });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        windowId: 'w1',
        text: 'hello',
        done: true,
      }),
    );
    cc.destroy();
    backend.destroy();
    vi.useRealTimers();
  });

  it('triggers for every stream chunk', () => {
    vi.useFakeTimers();
    const backend = new MockBackend();
    backend.connect(10);
    vi.advanceTimersByTime(10);

    const cc = new ContentChannel(backend);
    const handler = vi.fn();
    cc.onMessage(handler);

    backend.send('stream-content', {
      windowId: 'w1', text: 'part1', seq: 0, total: 2, done: false,
    });
    backend.send('stream-content', {
      windowId: 'w1', text: 'part2', seq: 1, total: 2, done: true,
    });

    expect(handler).toHaveBeenCalledTimes(2);
    cc.destroy();
    backend.destroy();
    vi.useRealTimers();
  });

  it('destroy cleans up listeners', () => {
    vi.useFakeTimers();
    const backend = new MockBackend();
    backend.connect(10);
    vi.advanceTimersByTime(10);

    const cc = new ContentChannel(backend);
    const handler = vi.fn();
    cc.onMessage(handler);
    cc.destroy();

    backend.send('stream-content', {
      windowId: 'w1', text: 'x', seq: 0, total: 1, done: true,
    });

    expect(handler).not.toHaveBeenCalled();
    backend.destroy();
    vi.useRealTimers();
  });

  it('onMessage unsubscribe works', () => {
    vi.useFakeTimers();
    const backend = new MockBackend();
    backend.connect(10);
    vi.advanceTimersByTime(10);

    const cc = new ContentChannel(backend);
    const handler = vi.fn();
    const unsub = cc.onMessage(handler);
    unsub();

    backend.send('stream-content', {
      windowId: 'w1', text: 'x', seq: 0, total: 1, done: true,
    });

    expect(handler).not.toHaveBeenCalled();
    cc.destroy();
    backend.destroy();
    vi.useRealTimers();
  });

  it('attachStage/detachStage manages stage references', () => {
    vi.useFakeTimers();
    const backend = new MockBackend();
    backend.connect(10);
    vi.advanceTimersByTime(10);

    const cc = new ContentChannel(backend);
    const stage = {
      destroyed: false,
      removeChildren: vi.fn(),
      stage: { addChild: vi.fn() },
      bounds: { width: 400 },
    };

    cc.attachStage('w1', stage as never);
    backend.send('stream-content', {
      windowId: 'w1', text: 'hello', seq: 0, total: 1, done: true,
    });
    expect(stage.removeChildren).toHaveBeenCalled();
    expect(stage.stage.addChild).toHaveBeenCalled();

    cc.detachStage('w1');
    vi.clearAllMocks();

    backend.send('stream-content', {
      windowId: 'w1', text: 'world', seq: 0, total: 1, done: true,
    });
    expect(stage.removeChildren).not.toHaveBeenCalled();

    cc.destroy();
    backend.destroy();
    vi.useRealTimers();
  });

  it('flush preserves text order across chunks', () => {
    vi.useFakeTimers();
    const backend = new MockBackend();
    backend.connect(10);
    vi.advanceTimersByTime(10);

    const cc = new ContentChannel(backend);
    const stage = {
      destroyed: false,
      removeChildren: vi.fn(),
      stage: { addChild: vi.fn() },
      bounds: { width: 400 },
    };
    cc.attachStage('w1', stage as never);

    backend.send('stream-content', {
      windowId: 'w1', text: 'one ', seq: 0, total: 3, done: false,
    });
    backend.send('stream-content', {
      windowId: 'w1', text: 'two ', seq: 2, total: 3, done: true,
    });
    backend.send('stream-content', {
      windowId: 'w1', text: 'three ', seq: 1, total: 3, done: false,
    });

    expect(stage.removeChildren).toHaveBeenCalled();
    expect(stage.stage.addChild).toHaveBeenCalled();

    cc.destroy();
    backend.destroy();
    vi.useRealTimers();
  });

  it('flush skips when stage is destroyed', () => {
    vi.useFakeTimers();
    const backend = new MockBackend();
    backend.connect(10);
    vi.advanceTimersByTime(10);

    const cc = new ContentChannel(backend);
    const stage = {
      destroyed: false,
      removeChildren: vi.fn(),
      stage: { addChild: vi.fn() },
      bounds: { width: 400 },
    };
    cc.attachStage('w1', stage as never);
    stage.destroyed = true;

    backend.send('stream-content', {
      windowId: 'w1', text: 'x', seq: 0, total: 1, done: true,
    });
    expect(stage.removeChildren).not.toHaveBeenCalled();
    expect(stage.stage.addChild).not.toHaveBeenCalled();

    cc.destroy();
    backend.destroy();
    vi.useRealTimers();
  });

  it('destroy clears stages and buffers', () => {
    vi.useFakeTimers();
    const backend = new MockBackend();
    backend.connect(10);
    vi.advanceTimersByTime(10);

    const cc = new ContentChannel(backend);
    const stage = { destroyed: false, removeChildren: vi.fn(), stage: { addChild: vi.fn() }, bounds: { width: 400 } };
    cc.attachStage('w1', stage as never);
    cc.destroy();

    backend.send('stream-content', {
      windowId: 'w1', text: 'x', seq: 0, total: 1, done: true,
    });
    expect(stage.removeChildren).not.toHaveBeenCalled();
    backend.destroy();
    vi.useRealTimers();
  });

  it('simulateStream does not throw', () => {
    vi.useFakeTimers();
    const backend = new MockBackend();
    backend.connect(10);
    vi.advanceTimersByTime(10);

    const cc = new ContentChannel(backend);
    expect(() => {
      cc.simulateStream('w1', ['line1', 'line2', 'line3'], 100);
    }).not.toThrow();

    vi.advanceTimersByTime(500);
    cc.destroy();
    backend.destroy();
    vi.useRealTimers();
  });
});
