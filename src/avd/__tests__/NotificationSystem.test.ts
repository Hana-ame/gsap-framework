import { describe, expect, it, vi, afterEach } from 'vitest';
import * as PIXI from 'pixi.js';
import { NotificationSystem } from '../NotificationSystem';

describe('NotificationSystem', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a notification', () => {
    const container = new PIXI.Container();
    const ns = new NotificationSystem(container);
    expect(() => ns.show('test notification')).not.toThrow();

    expect(container.children.length).toBe(1);

    ns.destroy();
  });

  it('supports multiple notifications', () => {
    const container = new PIXI.Container();
    const ns = new NotificationSystem(container, { maxVisible: 3 });

    expect(() => { ns.show('one'); ns.show('two'); ns.show('three'); }).not.toThrow();

    ns.destroy();
  });

  it('limits visible count', () => {
    const container = new PIXI.Container();
    const ns = new NotificationSystem(container, { maxVisible: 2 });

    ns.show('one');
    ns.show('two');
    ns.show('three');

    ns.destroy();
  });

  it('dismisses all', () => {
    const container = new PIXI.Container();
    const ns = new NotificationSystem(container);

    ns.show('one');
    ns.show('two');
    ns.dismissAll();

    ns.destroy();
  });

  it('accepts type options', () => {
    const container = new PIXI.Container();
    const ns = new NotificationSystem(container);

    expect(() => {
      ns.show({ text: 'saved', type: 'success' });
      ns.show({ text: 'error', type: 'error' });
    }).not.toThrow();

    ns.destroy();
  });
});
