import { describe, it, expect, vi } from 'vitest';
import { MockBackend } from '../MockBackend';
import { ContentChannel } from '../ContentChannel';

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
      windowId: 'w1', text: 'hello', seq: 0, total: 1, done: true,
    });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ windowId: 'w1', text: 'hello', done: true }),
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

  it('onFlushed emits assembled text when stream completes', () => {
    vi.useFakeTimers();
    const backend = new MockBackend();
    backend.connect(10);
    vi.advanceTimersByTime(10);

    const cc = new ContentChannel(backend);
    const handler = vi.fn();
    cc.onFlushed(handler);

    backend.send('stream-content', {
      windowId: 'w1', text: 'one ', seq: 0, total: 2, done: false,
    });
    expect(handler).not.toHaveBeenCalled();

    backend.send('stream-content', {
      windowId: 'w1', text: 'two ', seq: 1, total: 2, done: true,
    });

    expect(handler).toHaveBeenCalledWith({ windowId: 'w1', text: 'one two ' });
    cc.destroy();
    backend.destroy();
    vi.useRealTimers();
  });

  it('onFlushed preserves text order across out-of-order chunks', () => {
    vi.useFakeTimers();
    const backend = new MockBackend();
    backend.connect(10);
    vi.advanceTimersByTime(10);

    const cc = new ContentChannel(backend);
    const handler = vi.fn();
    cc.onFlushed(handler);

    backend.send('stream-content', {
      windowId: 'w1', text: 'second ', seq: 1, total: 3, done: false,
    });
    expect(handler).not.toHaveBeenCalled();

    backend.send('stream-content', {
      windowId: 'w1', text: 'first ', seq: 0, total: 3, done: false,
    });
    expect(handler).not.toHaveBeenCalled();

    backend.send('stream-content', {
      windowId: 'w1', text: 'third ', seq: 2, total: 3, done: true,
    });

    expect(handler).toHaveBeenCalledWith({ windowId: 'w1', text: 'first second third ' });
    cc.destroy();
    backend.destroy();
    vi.useRealTimers();
  });

  it('onFlushed not called on incomplete stream', () => {
    vi.useFakeTimers();
    const backend = new MockBackend();
    backend.connect(10);
    vi.advanceTimersByTime(10);

    const cc = new ContentChannel(backend);
    const handler = vi.fn();
    cc.onFlushed(handler);

    backend.send('stream-content', {
      windowId: 'w1', text: 'part1', seq: 0, total: 2, done: false,
    });

    expect(handler).not.toHaveBeenCalled();
    cc.destroy();
    backend.destroy();
    vi.useRealTimers();
  });

  it('onFlushed unsubscribe works', () => {
    vi.useFakeTimers();
    const backend = new MockBackend();
    backend.connect(10);
    vi.advanceTimersByTime(10);

    const cc = new ContentChannel(backend);
    const handler = vi.fn();
    const unsub = cc.onFlushed(handler);
    unsub();

    backend.send('stream-content', {
      windowId: 'w1', text: 'x', seq: 0, total: 1, done: true,
    });

    expect(handler).not.toHaveBeenCalled();
    cc.destroy();
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
