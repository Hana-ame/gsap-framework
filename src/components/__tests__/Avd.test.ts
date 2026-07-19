import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../framework/gsap-pixi', () => ({
  gsap: {
    to: vi.fn((_target: unknown, vars: Record<string, unknown>) => {
      if (typeof vars.onComplete === 'function') vars.onComplete();
      return { kill: vi.fn() };
    }),
    killTweensOf: vi.fn(),
    registerPlugin: vi.fn(),
  },
  PixiPlugin: { registerPIXI: vi.fn() },
}));

const createdObjects: Record<string, unknown>[] = [];

function mockPixiObj(extra: Record<string, unknown> = {}): Record<string, unknown> {
  const handlers = new Map<string, Set<(...args: unknown[]) => void>>();
  const obj: Record<string, unknown> = {
    children: [],
    addChild: vi.fn(function (this: Record<string, unknown>, child: Record<string, unknown>) {
      (this.children as unknown[]).push(child);
      (child as Record<string, unknown>).parent = this;
      return child;
    }),
    removeChild: vi.fn(),
    destroy: vi.fn(),
    eventMode: null,
    on: vi.fn(function (this: Record<string, unknown>, evt: string, fn: (...args: unknown[]) => void) {
      let s = handlers.get(evt);
      if (!s) { s = new Set(); handlers.set(evt, s); }
      s.add(fn);
      return this;
    }),
    off: vi.fn(),
    cursor: 'default',
    x: 0, y: 0, width: 50, height: 20,
    text: '',
    anchor: { set: vi.fn() },
    style: { fill: 0xffffff },
    visible: true,
    alpha: 1,
    scale: { x: 1, y: 1, set: vi.fn() },
    clear: vi.fn(function () { return obj; }),
    rect: vi.fn(function () { return obj; }),
    fill: vi.fn(function () { return obj; }),
    roundRect: vi.fn(function () { return obj; }),
    moveTo: vi.fn(function () { return obj; }),
    lineTo: vi.fn(function () { return obj; }),
    ...extra,
  };
  createdObjects.push(obj);
  return obj;
}

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  const Container = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  const Graphics = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  const Text = vi.fn(function () { return mockPixiObj({ width: 50, height: 16 }); } as unknown as new () => Record<string, unknown>);
  const TextStyle = vi.fn();
  return {
    ...actual as object,
    Container, Graphics, Text, TextStyle,
    Ticker: vi.fn(function () {
      const listeners: ((t: { deltaMS: number }) => void)[] = [];
      return {
        add: vi.fn((fn: (t: { deltaMS: number }) => void) => listeners.push(fn)),
        remove: vi.fn(),
        deltaMS: 16,
      };
    }),
  };
});

import * as PIXI from 'pixi.js';
import { Avd } from '../Avd';

const SCREEN_W = 800;
const SCREEN_H = 600;

describe('Avd', () => {
  let parent: PIXI.Container;
  let ticker: PIXI.Ticker;

  beforeEach(() => {
    createdObjects.length = 0;
    parent = new PIXI.Container();
    ticker = { add: vi.fn(), remove: vi.fn(), deltaMS: 16 } as never;
  });

  it('constructs and adds container to parent', () => {
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker);
    expect(avd.container.parent).toBe(parent);
  });

  it('setScript enters first line', () => {
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker);
    avd.setScript([{ speaker: 'Alice', text: 'Hello' }]);
    expect(avd.getLineIndex()).toBe(0);
    expect(avd.getLineCount()).toBe(1);
  });

  it('getState returns typing initially', () => {
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker);
    expect(avd.getState()).toBe('typing');
  });

  it('setScript transitions to typing', () => {
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker);
    avd.setScript([{ speaker: 'Alice', text: 'Hello' }]);
    expect(avd.getState()).toBe('typing');
  });

  it('next advances from typing to between', () => {
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker);
    avd.setScript([{ speaker: 'Alice', text: 'Hi' }]);
    avd.next();
    expect(avd.getState()).toBe('between');
  });

  it('next advances from between to next line', () => {
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker);
    avd.setScript([
      { speaker: 'Alice', text: 'Hi' },
      { speaker: 'Bob', text: 'Hello' },
    ]);
    avd.next(); // typing -> between
    expect(avd.getState()).toBe('between');
    avd.next(); // between -> next line
    expect(avd.getLineIndex()).toBe(1);
    expect(avd.getState()).toBe('typing');
  });

  it('next on last line fires onComplete', () => {
    const onComplete = vi.fn();
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker, { onComplete });
    avd.setScript([{ speaker: 'Alice', text: 'Hi' }]);
    avd.next(); // typing -> between
    avd.next(); // between -> done
    expect(onComplete).toHaveBeenCalled();
    expect(avd.getState()).toBe('done');
  });

  it('next is no-op when state is done', () => {
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker);
    avd.setScript([{ speaker: 'Alice', text: 'Hi' }]);
    avd.next(); // typing -> between
    avd.next(); // between -> done
    avd.next(); // no-op
    expect(avd.getState()).toBe('done');
  });

  it('goTo jumps to specified index', () => {
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker);
    avd.setScript([
      { speaker: 'Alice', text: 'A' },
      { speaker: 'Bob', text: 'B' },
      { speaker: 'Carol', text: 'C' },
    ]);
    avd.goTo(2);
    expect(avd.getLineIndex()).toBe(2);
  });

  it('goTo ignores out-of-bounds index', () => {
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker);
    avd.setScript([{ speaker: 'Alice', text: 'Hi' }]);
    avd.goTo(5);
    expect(avd.getLineIndex()).toBe(0);
  });

  it('setTypewriterSpeed changes speed', () => {
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker);
    avd.setTypewriterSpeed(50);
    expect(avd['typewriterSpeed']).toBe(50);
  });

  it('setTypewriterSpeed clamps to 1', () => {
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker);
    avd.setTypewriterSpeed(0);
    expect(avd['typewriterSpeed']).toBe(1);
  });

  it('applyOptions updates options', () => {
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker);
    avd.applyOptions({ textColor: 0xff0000 });
  });

  it('setRoster sets roster and applies highlight', () => {
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker);
    avd.setRoster({
      Alice: { pos: 'left', texture: {} as never },
    });
    expect(Object.keys(avd.getRoster()).length).toBe(1);
  });

  it('getRosterMode returns default mode', () => {
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker);
    expect(avd.getRosterMode()).toBe('speaker-only');
  });

  it('setRosterMode changes mode', () => {
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker);
    avd.setRosterMode('persistent');
    expect(avd.getRosterMode()).toBe('persistent');
  });

  it('destroy removes ticker and container', () => {
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker);
    const destroySpy = vi.spyOn(avd.container, 'destroy');
    avd.destroy();
    expect(ticker.remove).toHaveBeenCalled();
    expect(destroySpy).toHaveBeenCalledWith({ children: true });
  });

  it('calls onStateChange callback', () => {
    const onStateChange = vi.fn();
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker, { onStateChange });
    avd.setScript([{ speaker: 'Alice', text: 'Hi' }]);
    expect(onStateChange).toHaveBeenCalledWith('typing');
  });

  it('calls onLineEnter and onLineExit', () => {
    const onLineEnter = vi.fn();
    const onLineExit = vi.fn();
    const avd = new Avd(parent, SCREEN_W, SCREEN_H, ticker, { onLineEnter, onLineExit });
    avd.setScript([
      { speaker: 'Alice', text: 'Hi' },
      { speaker: 'Bob', text: 'Hello' },
    ]);
    expect(onLineEnter).toHaveBeenCalledWith(expect.objectContaining({ speaker: 'Alice' }), 0);
    avd.next(); // typing -> between
    avd.next(); // between -> next line (calls onLineExit)
    expect(onLineExit).toHaveBeenCalledWith(expect.objectContaining({ speaker: 'Alice' }), 0);
  });
});
