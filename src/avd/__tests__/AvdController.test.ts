import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('gsap', () => ({
  default: {
    to: vi.fn((_target: unknown, vars: Record<string, unknown>) => {
      if (typeof vars.onComplete === 'function') vars.onComplete();
      return { kill: vi.fn() };
    }),
    killTweensOf: vi.fn(),
    registerPlugin: vi.fn(),
    delayedCall: vi.fn((_delay: number, fn: () => void) => {
      fn();
      return { kill: vi.fn() };
    }),
  },
  gsap: {
    to: vi.fn((_target: unknown, vars: Record<string, unknown>) => {
      if (typeof vars.onComplete === 'function') vars.onComplete();
      return { kill: vi.fn() };
    }),
    killTweensOf: vi.fn(),
    registerPlugin: vi.fn(),
    delayedCall: vi.fn((_delay: number, fn: () => void) => {
      fn();
      return { kill: vi.fn() };
    }),
  },
}));

function makeContainer() {
  const children: unknown[] = [];
  const ret = {
    children,
    addChild: vi.fn(function (c: unknown) { children.push(c); return c; }),
    addChildAt: vi.fn(function (c: unknown, idx: number) { children.splice(idx, 0, c); return c; }),
    removeChild: vi.fn(function (c: unknown) {
      const idx = children.indexOf(c);
      if (idx >= 0) children.splice(idx, 1);
      return c;
    }),
    removeChildren: vi.fn(function () {
      const all = [...children];
      children.length = 0;
      return all;
    }),
    removeFromParent: vi.fn(),
    destroy: vi.fn(),
    eventMode: null as string | null,
    on: vi.fn(),
    off: vi.fn(),
    cursor: 'default',
    alpha: 1, x: 0, y: 0, visible: true, width: 50, height: 20,
    scale: { x: 1, y: 1, set: vi.fn() },
    clear: vi.fn(function () { return ret; }),
    rect: vi.fn(function () { return ret; }),
    fill: vi.fn(function () { return ret; }),
    roundRect: vi.fn(function () { return ret; }),
    moveTo: vi.fn(function () { return ret; }),
    lineTo: vi.fn(function () { return ret; }),
    stroke: vi.fn(function () { return ret; }),
    getLocalBounds: vi.fn(() => ({ x: 0, y: 0, width: 50, height: 20 })),
    getBounds: vi.fn(() => ({ x: 0, y: 0, width: 50, height: 20 })),
  };
  return ret;
}

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  const Container = vi.fn(makeContainer);
  const Graphics = vi.fn(makeContainer);
  const Text = vi.fn(function () {
    return { ...makeContainer(), width: 50, height: 16, text: '', style: { fill: 0xffffff, fontFamily: '', fontSize: 0, wordWrap: false, wordWrapWidth: 0, lineHeight: 0 }, anchor: { set: vi.fn() } };
  });
  const TextStyle = vi.fn(function () { return {}; });
  const Sprite = vi.fn(function () {
    return { ...makeContainer(), width: 100, height: 200, texture: {}, anchor: { set: vi.fn() } };
  });
  return {
    ...actual as object,
    Container, Graphics, Text, TextStyle, Sprite,
    Ticker: vi.fn(function () {
      return { add: vi.fn(), remove: vi.fn(), deltaMS: 16 };
    }),
  };
});

import * as PIXI from 'pixi.js';
import { AvdController } from '../AvdController';

describe('AvdController', () => {
  let parent: PIXI.Container;
  let ticker: PIXI.Ticker;

  beforeEach(() => {
    parent = new PIXI.Container();
    ticker = { add: vi.fn(), remove: vi.fn(), deltaMS: 16 } as never;
  });

  it('constructs and adds click overlay to parent', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    expect(parent.children.length).toBeGreaterThan(0);
  });

  it('setScript enters first line', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setScript([{ speaker: 'Alice', text: 'Hello' }]);
    expect(ctrl.getLineIndex()).toBe(0);
    expect(ctrl.getLineCount()).toBe(1);
  });

  it('getState returns done before setScript', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    expect(ctrl.getState()).toBe('done');
  });

  it('setScript transitions to typing', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setScript([{ speaker: 'Alice', text: 'Hello' }]);
    expect(ctrl.getState()).toBe('typing');
  });

  it('next advances from typing to between', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setScript([{ speaker: 'Alice', text: 'Hi' }]);
    ctrl.next();
    expect(ctrl.getState()).toBe('between');
  });

  it('next advances from between to next line', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setScript([
      { speaker: 'Alice', text: 'Hi' },
      { speaker: 'Bob', text: 'Hello' },
    ]);
    ctrl.next();
    expect(ctrl.getState()).toBe('between');
    ctrl.next();
    expect(ctrl.getLineIndex()).toBe(1);
    expect(ctrl.getState()).toBe('typing');
  });

  it('next on last line fires onComplete', () => {
    const onComplete = vi.fn();
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600, onComplete });
    ctrl.setScript([{ speaker: 'Alice', text: 'Hi' }]);
    ctrl.next();
    ctrl.next();
    expect(onComplete).toHaveBeenCalled();
    expect(ctrl.getState()).toBe('done');
  });

  it('next is no-op when state is done', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setScript([{ speaker: 'Alice', text: 'Hi' }]);
    ctrl.next();
    ctrl.next();
    ctrl.next();
    expect(ctrl.getState()).toBe('done');
  });

  it('goTo jumps to specified index', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setScript([
      { speaker: 'Alice', text: 'A' },
      { speaker: 'Bob', text: 'B' },
      { speaker: 'Carol', text: 'C' },
    ]);
    ctrl.goTo(2);
    expect(ctrl.getLineIndex()).toBe(2);
  });

  it('goTo clamps out-of-bounds index', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setScript([{ speaker: 'Alice', text: 'Hi' }]);
    ctrl.goTo(5);
    expect(ctrl.getLineIndex()).toBe(0);
  });

  it('goToLast jumps to last line', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setScript([
      { speaker: 'A', text: 'a' },
      { speaker: 'B', text: 'b' },
      { speaker: 'C', text: 'c' },
    ]);
    ctrl.goToLast();
    expect(ctrl.getLineIndex()).toBe(2);
  });

  it('reset goes back to first line', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setScript([
      { speaker: 'A', text: 'a' },
      { speaker: 'B', text: 'b' },
    ]);
    ctrl.next();
    ctrl.next();
    expect(ctrl.getLineIndex()).toBe(1);
    ctrl.reset();
    expect(ctrl.getLineIndex()).toBe(0);
    expect(ctrl.getState()).toBe('typing');
  });

  it('setTypewriterSpeed changes speed', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setTypewriterSpeed(50);
    expect(ctrl['_opts'].typewriterSpeed).toBe(50);
  });

  it('setTypewriterSpeed clamps to 1', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setTypewriterSpeed(0);
    expect(ctrl['_opts'].typewriterSpeed).toBe(1);
  });

  it('applyOptions updates options', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.applyOptions({ boxBg: 0xff0000 });
  });

  it('setRoster sets roster', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setRoster({
      Alice: { pos: 'left', texture: {} as never },
    });
    expect(Object.keys(ctrl.getRoster()).length).toBe(1);
  });

  it('getRosterMode returns default mode', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    expect(ctrl.getRosterMode()).toBe('speaker-only');
  });

  it('setRosterMode changes mode', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setRosterMode('persistent');
    expect(ctrl.getRosterMode()).toBe('persistent');
  });

  it('destroy removes ticker', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.destroy();
    expect(ticker.remove).toHaveBeenCalled();
  });

  it('calls onStateChange callback', () => {
    const onStateChange = vi.fn();
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600, onStateChange });
    ctrl.setScript([{ speaker: 'Alice', text: 'Hi' }]);
    expect(onStateChange).toHaveBeenCalledWith('typing');
  });

  it('calls onLineEnter callback', () => {
    const onLineEnter = vi.fn();
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600, onLineEnter });
    ctrl.setScript([
      { speaker: 'Alice', text: 'Hi' },
      { speaker: 'Bob', text: 'Hello' },
    ]);
    expect(onLineEnter).toHaveBeenCalledWith(expect.objectContaining({ speaker: 'Alice' }), 0);
  });

  it('enters choice state when line has choices', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setScript([{
      speaker: 'Alice',
      text: 'What now?',
      choices: [
        { text: 'Go left', targetLine: 1 },
        { text: 'Go right', targetLine: 2 },
      ],
    }, { speaker: 'Alice', text: 'Left path' }, { speaker: 'Bob', text: 'Right path' }]);
    ctrl.next();
    expect(ctrl.getState()).toBe('choice');
  });

  it('click is no-op in choice state', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setScript([{
      speaker: 'Alice',
      text: 'What now?',
      choices: [{ text: 'Go', targetLine: 1 }],
    }, { speaker: 'Alice', text: 'Chosen' }]);
    ctrl.next();
    expect(ctrl.getState()).toBe('choice');
    ctrl.next();
    expect(ctrl.getState()).toBe('choice');
  });

  it('calls onChoiceEnter when choices appear', () => {
    const onChoiceEnter = vi.fn();
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600, onChoiceEnter });
    ctrl.setScript([{
      speaker: 'Alice',
      text: 'What now?',
      choices: [{ text: 'Go', targetLine: 1 }],
    }, { speaker: 'Alice', text: 'Chosen' }]);
    ctrl.next();
    expect(onChoiceEnter).toHaveBeenCalledWith([{ text: 'Go', targetLine: 1 }]);
  });

  it('calls onChoiceSelect when choice is selected', () => {
    const onChoiceSelect = vi.fn();
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600, onChoiceSelect });
    ctrl.setScript([{
      speaker: 'Alice',
      text: 'What now?',
      choices: [{ text: 'Go', targetLine: 1 }],
    }, { speaker: 'Alice', text: 'Chosen' }]);
    ctrl.next();
    expect(ctrl.getState()).toBe('choice');
    ctrl['_onChoiceSelected']({ text: 'Go', targetLine: 1 }, 0);
    expect(onChoiceSelect).toHaveBeenCalledWith({ text: 'Go', targetLine: 1 }, 0);
  });

  it('choice selection jumps to target line', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setScript([{
      speaker: 'Alice',
      text: 'What now?',
      choices: [
        { text: 'A', targetLine: 2 },
        { text: 'B', targetLine: 3 },
      ],
    }, { speaker: 'Skip', text: 'skip' }, { speaker: 'Alice', text: 'Path A' }, { speaker: 'Bob', text: 'Path B' }]);
    ctrl.next();
    expect(ctrl.getState()).toBe('choice');
    ctrl['_onChoiceSelected']({ text: 'A', targetLine: 2 }, 0);
    expect(ctrl.getLineIndex()).toBe(2);
    expect(ctrl.getState()).toBe('typing');
  });

  it('choice selection resolves targetSegment', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setScript([
      { speaker: 'Alice', text: 'Pick one:', choices: [{ text: 'Go', targetSegment: 'route-a' }] },
      { speaker: 'Skip', text: 'skip' },
      { segment: 'route-a', speaker: 'Alice', text: 'You went to route A' },
    ]);
    ctrl.next();
    expect(ctrl.getState()).toBe('choice');
    ctrl['_onChoiceSelected']({ text: 'Go', targetSegment: 'route-a' }, 0);
    expect(ctrl.getLineIndex()).toBe(2);
  });

  it('end:true line stops script instead of advancing', () => {
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
    ctrl.setScript([
      { speaker: 'Narrator', text: 'line 0' },
      { speaker: 'Narrator', text: 'the end', end: true },
      { speaker: 'Narrator', text: 'should never play' },
    ]);
    // line 0 starts typing (from setScript)
    ctrl.next();
    // typing completed → advance to 'between'
    expect(ctrl.getState()).toBe('between');
    expect(ctrl.getLineIndex()).toBe(0);
    ctrl.next();
    // advance → line 1 starts typing
    expect(ctrl.getState()).toBe('typing');
    expect(ctrl.getLineIndex()).toBe(1);
    ctrl.next();
    // typing completed → end:true → done (not advancing to line 2)
    expect(ctrl.getState()).toBe('done');
    expect(ctrl.getLineIndex()).toBe(1);
  });

  describe('quick save/load', () => {
    let store: Record<string, string> = {};

    beforeEach(() => {
      store = {};
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((k: string) => store[k] ?? null),
        setItem: vi.fn((k: string, v: string) => { store[k] = v; }),
        removeItem: vi.fn((k: string) => { delete store[k]; }),
        clear: vi.fn(() => { store = {}; }),
        length: 0,
        key: vi.fn(() => null),
      });
    });

    it('quickSave stores data to localStorage', () => {
      const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
      ctrl.setScript([
        { speaker: 'A', text: 'hello' },
        { speaker: 'B', text: 'world' },
      ]);
      ctrl.quickSave();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'avd_quicksave',
        expect.any(String),
      );
      const saved = JSON.parse(store['avd_quicksave']);
      expect(saved.lineIndex).toBe(0);
      expect(saved.label).toBe('quicksave');
    });

    it('quickLoad restores saved state', () => {
      const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
      ctrl.setScript([
        { speaker: 'A', text: 'line 0' },
        { speaker: 'B', text: 'line 1' },
        { speaker: 'C', text: 'line 2' },
      ]);

      // Save at line 2
      ctrl['_fsm'].goTo(2);
      ctrl.quickSave();

      // Go back to line 0
      ctrl['_fsm'].goTo(0);

      // Load
      ctrl.quickLoad();
      expect(ctrl.getLineIndex()).toBe(2);
    });

    it('quickLoad with no save shows warning', () => {
      const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });
      ctrl.setScript([{ speaker: 'A', text: 'hello' }]);
      // Should not throw
      expect(() => ctrl.quickLoad()).not.toThrow();
    });
  });
});
