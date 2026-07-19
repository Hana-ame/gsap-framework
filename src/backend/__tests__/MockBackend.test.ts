import { describe, it, expect, vi, afterEach } from 'vitest';
import { MockBackend } from '../MockBackend';

describe('MockBackend', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts disconnected', () => {
    const b = new MockBackend();
    expect(b.status).toBe('disconnected');
  });

  it('connects after delay', () => {
    vi.useFakeTimers();
    const b = new MockBackend();
    const handler = vi.fn();
    b.on('status', handler);

    b.connect(100);
    expect(b.status).toBe('disconnected');

    vi.advanceTimersByTime(100);
    expect(b.status).toBe('connected');
    expect(handler).toHaveBeenCalledWith('connected');
  });

  it('emits command when send is called', () => {
    vi.useFakeTimers();
    const b = new MockBackend();
    const handler = vi.fn();
    b.on('command', handler);

    b.connect(10);
    vi.advanceTimersByTime(10);

    b.send('open-window', { id: 'w1' });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'open-window',
        payload: { id: 'w1' },
      }),
    );
  });

  it('ignores send when disconnected', () => {
    const b = new MockBackend();
    const handler = vi.fn();
    b.on('command', handler);
    b.send('open-window', {});
    expect(handler).not.toHaveBeenCalled();
  });

  it('sendSequence sends commands in order with delays', () => {
    vi.useFakeTimers();
    const b = new MockBackend();
    const handler = vi.fn();
    b.on('command', handler);
    b.connect(10);
    vi.advanceTimersByTime(10);

    b.sendSequence([
      { type: 'open-window', payload: { id: 'w1' }, delay: 100 },
      { type: 'move-window', payload: { id: 'w1', x: 100 }, delay: 200 },
    ]);

    vi.advanceTimersByTime(100);
    expect(handler).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(200);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'move-window' }),
    );
  });

  it('disconnect clears timers and emits status', () => {
    vi.useFakeTimers();
    const b = new MockBackend();
    const handler = vi.fn();
    b.on('status', handler);
    b.connect(100);
    b.disconnect();
    expect(b.status).toBe('disconnected');
    expect(handler).toHaveBeenCalledWith('disconnected');
  });

  it('destroy cleans up', () => {
    const b = new MockBackend();
    b.destroy();
    expect(b.status).toBe('disconnected');
  });

  it('multiple listeners on same event', () => {
    vi.useFakeTimers();
    const b = new MockBackend();
    const h1 = vi.fn();
    const h2 = vi.fn();
    b.on('command', h1);
    b.on('command', h2);
    b.connect(10);
    vi.advanceTimersByTime(10);
    b.send('ping', {});
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe removes listener', () => {
    vi.useFakeTimers();
    const b = new MockBackend();
    const h1 = vi.fn();
    const h2 = vi.fn();
    b.connect(10);
    vi.advanceTimersByTime(10);

    const unsub = b.on('command', h1);
    b.on('command', h2);
    unsub();
    b.send('ping', {});
    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledTimes(1);
  });
});
