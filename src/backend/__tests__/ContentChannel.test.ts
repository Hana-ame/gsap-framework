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
});
