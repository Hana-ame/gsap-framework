import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../EventBus';

describe('EventBus', () => {
  it('on/emit delivers payload', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('test:event', handler);
    bus.emit('test:event', { foo: 'bar' });
    expect(handler).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('multiple handlers receive the same event', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('evt', h1);
    bus.on('evt', h2);
    bus.emit('evt', 42);
    expect(h1).toHaveBeenCalledWith(42);
    expect(h2).toHaveBeenCalledWith(42);
  });

  it('unsubscribe removes handler', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const unsub = bus.on('evt', handler);
    unsub();
    bus.emit('evt', 'data');
    expect(handler).not.toHaveBeenCalled();
  });

  it('off removes specific handler', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('evt', handler);
    bus.off('evt', handler);
    bus.emit('evt', 'data');
    expect(handler).not.toHaveBeenCalled();
  });

  it('emit with no listeners does nothing', () => {
    const bus = new EventBus();
    expect(() => bus.emit('nonexistent', 'data')).not.toThrow();
  });

  it('listenerCount returns correct count', () => {
    const bus = new EventBus();
    expect(bus.listenerCount('evt')).toBe(0);
    bus.on('evt', () => {});
    expect(bus.listenerCount('evt')).toBe(1);
    bus.on('evt', () => {});
    expect(bus.listenerCount('evt')).toBe(2);
  });

  it('clear removes all listeners', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('a', handler);
    bus.on('b', handler);
    bus.clear();
    expect(bus.listenerCount('a')).toBe(0);
    expect(bus.listenerCount('b')).toBe(0);
    bus.emit('a', 'data');
    expect(handler).not.toHaveBeenCalled();
  });

  it('handler exception does not affect other handlers', () => {
    const bus = new EventBus();
    const throwing = vi.fn(() => { throw new Error('handler error'); });
    const normal = vi.fn();
    bus.on('evt', throwing);
    bus.on('evt', normal);
    expect(() => bus.emit('evt', 'data')).not.toThrow();
    expect(normal).toHaveBeenCalledWith('data');
  });

  it('supports multiple events independently', () => {
    const bus = new EventBus();
    const handlerA = vi.fn();
    const handlerB = vi.fn();
    bus.on('a', handlerA);
    bus.on('b', handlerB);
    bus.emit('a', 1);
    expect(handlerA).toHaveBeenCalledWith(1);
    expect(handlerB).not.toHaveBeenCalled();
  });
});
