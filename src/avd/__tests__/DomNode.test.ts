/**
 * DomNode / DomTypingEngine / DomDialogueBox / VnScriptPlayer tests.
 *
 * Covers bugs found in the AVD DOM rendering layer:
 *   1. DomText wordWrapWidth styling (vertically-stacked text / "竖着的" bug)
 *   2. DomTypingEngine container width
 *   3. DomDialogueBox container & textContainer sizing
 *   4. VnScriptPlayer jump/call/return control flow
 *   5. AvdController _onStateChange → _redrawOverlay call chain
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';

// ── jsdom canvas mock ──
// jsdom does not implement HTMLCanvasElement.getContext().  We stub it so
// DomNode.measureText() and DomGraphics can function without the 'canvas' pkg.
const mockCtx = {
  font: '',
  measureText: vi.fn(() => ({ width: 50 })),
  clearRect: vi.fn(),
  rect: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  stroke: vi.fn(),
  arc: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  roundRect: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
};
HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx) as any;

// ──────────────────────────────────────────────
// 1. DomText width styling (vertical-text bug)
// ──────────────────────────────────────────────

import { DomText, DomContainer } from '../dom/DomNode';
import { DomTypingEngine } from '../dom/DomTypingEngine';
import { DomDialogueBox } from '../dom/DomDialogueBox';

describe('DomText', () => {
  it('sets width and maxWidth when wordWrapWidth is given', () => {
    const t = new DomText({ text: 'test', style: { wordWrapWidth: 880, fontFamily: 'serif', fontSize: 18 } });
    expect(t.el.style.width).toBe('880px');
    expect(t.el.style.maxWidth).toBe('880px');
  });

  it('sets CSS width to measured text width and clears maxWidth when wordWrapWidth is omitted', () => {
    const t = new DomText({ text: 'test', style: { fontFamily: 'serif', fontSize: 18 } });
    // mockCtx.measureText returns { width: 50 }
    expect(t.el.style.width).toBe('50px');
    expect(t.el.style.maxWidth).toBe('');
  });

  it('sets width and maxWidth to 0 when wordWrapWidth is 0', () => {
    const t = new DomText({ text: 'test', style: { wordWrapWidth: 0, fontFamily: 'serif', fontSize: 18 } });
    expect(t.el.style.maxWidth).toBe('0px');
    expect(t.el.style.width).toBe('0px');
  });

  it('applies wordWrapWidth set via style setter', () => {
    const t = new DomText({ text: 'test' });
    t.style = { wordWrapWidth: 640, fontFamily: 'sans-serif', fontSize: 16 };
    expect(t.el.style.width).toBe('640px');
    expect(t.el.style.maxWidth).toBe('640px');
  });

  it('style setter without wordWrapWidth sets CSS width to measured text width', () => {
    const t = new DomText({ text: 'test', style: { wordWrapWidth: 880 } });
    expect(t.el.style.width).toBe('880px');
    expect(t.el.style.maxWidth).toBe('880px');
    t.style = { fontFamily: 'serif', fontSize: 16 };
    // mockCtx.measureText returns { width: 50 }
    expect(t.el.style.width).toBe('50px');
    expect(t.el.style.maxWidth).toBe('');
  });

  it('inherits DomDisplayObject alpha, x, y, visible', () => {
    const t = new DomText({ text: 'hi' });
    t.alpha = 0.5;
    expect(t.alpha).toBe(0.5);
    expect(t.el.style.opacity).toBe('0.5');
    t.x = 10;
    expect(t.x).toBe(10);
    t.y = 20;
    expect(t.y).toBe(20);
    t.visible = false;
    expect(t.visible).toBe(false);
    expect(t.el.style.display).toBe('none');
  });
});

// ──────────────────────────────────────────────
// 2. DomTypingEngine container width
// ──────────────────────────────────────────────

describe('DomTypingEngine', () => {
  it('returns a container with width matching maxWidth parameter', () => {
    const engine = new DomTypingEngine();
    const container = engine.start('Hello', 30, { fontFamily: 'serif', fontSize: 16 }, 600, 28);
    expect(container.el.style.width).toBe('600px');
  });

  it('returns container with correct width for different maxWidth values', () => {
    const engine = new DomTypingEngine();
    const c1 = engine.start('A', 30, { fontFamily: 'serif', fontSize: 16 }, 400, 28);
    expect(c1.el.style.width).toBe('400px');
    engine.destroy();
    const c2 = engine.start('B', 30, { fontFamily: 'serif', fontSize: 16 }, 880, 28);
    expect(c2.el.style.width).toBe('880px');
  });

  it('adds children to the returned container', () => {
    const engine = new DomTypingEngine();
    const container = engine.start('Hello world', 30, { fontFamily: 'serif', fontSize: 16 }, 600, 28);
    expect(container.children.length).toBeGreaterThan(0);
  });

  it('container has x=0 and y=0', () => {
    const engine = new DomTypingEngine();
    const container = engine.start('Hi', 30, { fontFamily: 'serif', fontSize: 16 }, 400, 28);
    expect(container.x).toBe(0);
    expect(container.y).toBe(0);
  });
});

// ──────────────────────────────────────────────
// 3. DomDialogueBox container sizing
// ──────────────────────────────────────────────

describe('DomDialogueBox', () => {
  const BASE_OPTS = {
    boxX: 40, boxY: 500, boxWidth: 800, boxHeight: 180,
    boxRadius: 12, boxPadding: 24,
    boxBg: 0x0a0a1e, boxBgAlpha: 0.92,
    nameColor: 0x88ccff, nameSize: 22,
    fontFamily: 'serif', arrowColor: 0x88ccff,
  };

  it('sets container width to boxWidth', () => {
    const parent = new DomContainer();
    const db = new DomDialogueBox(parent, BASE_OPTS);
    expect(db.container.el.style.width).toBe('800px');
  });

  it('sets container height to boxHeight', () => {
    const parent = new DomContainer();
    const db = new DomDialogueBox(parent, BASE_OPTS);
    expect(db.container.el.style.height).toBe('180px');
  });

  it('sets container x to boxX', () => {
    const parent = new DomContainer();
    const db = new DomDialogueBox(parent, BASE_OPTS);
    expect(db.container.x).toBe(40);
  });

  it('sets container y to boxY', () => {
    const parent = new DomContainer();
    const db = new DomDialogueBox(parent, BASE_OPTS);
    expect(db.container.y).toBe(500);
  });

  it('sets _textContainer width to boxWidth - boxPadding * 2', () => {
    const parent = new DomContainer();
    const db = new DomDialogueBox(parent, BASE_OPTS);
    const tc = (db as any)._textContainer as DomContainer;
    expect(tc.el.style.width).toBe('752px'); // 800 - 24*2
  });

  it('sets _textContainer x to boxPadding', () => {
    const parent = new DomContainer();
    const db = new DomDialogueBox(parent, BASE_OPTS);
    const tc = (db as any)._textContainer as DomContainer;
    expect(tc.x).toBe(24);
  });

  it('adds its container to the parent', () => {
    const parent = new DomContainer();
    const db = new DomDialogueBox(parent, BASE_OPTS);
    expect(parent.children).toContain(db.container);
  });

  it('works with different boxPadding values', () => {
    const parent = new DomContainer();
    const db = new DomDialogueBox(parent, { ...BASE_OPTS, boxPadding: 40 });
    const tc = (db as any)._textContainer as DomContainer;
    expect(db.container.el.style.width).toBe('800px');
    expect(tc.el.style.width).toBe('720px'); // 800 - 40*2
    expect(tc.x).toBe(40);
  });

  it('setSpeaker creates and positions name text', () => {
    const parent = new DomContainer();
    const db = new DomDialogueBox(parent, BASE_OPTS);
    db.setSpeaker('Alice');
    // name text should be added as a child of the container
    expect(db.container.children.length).toBeGreaterThan(1);
  });

  it('setSpeaker(null) clears existing name text', () => {
    const parent = new DomContainer();
    const db = new DomDialogueBox(parent, BASE_OPTS);
    db.setSpeaker('Alice');
    const countWithName = db.container.children.length;
    db.setSpeaker(null);
    expect(db.container.children.length).toBe(countWithName - 1);
  });
});

// ──────────────────────────────────────────────
// 4. VnScriptPlayer jump/call/return control flow
// ──────────────────────────────────────────────

describe('VnScriptPlayer', () => {
  let VnScriptPlayer: typeof import('../vn/VnScriptPlayer').VnScriptPlayer;

  function makeMockContainer() {
    const children: unknown[] = [];
    return {
      children,
      addChild: vi.fn(function (c: unknown) { children.push(c); return c; }),
      removeChild: vi.fn(function (c: unknown) {
        const idx = children.indexOf(c);
        if (idx >= 0) children.splice(idx, 1);
        return c;
      }),
      removeChildren: vi.fn(() => { const all = [...children]; children.length = 0; return all; }),
      removeFromParent: vi.fn(),
      destroy: vi.fn(),
      eventMode: null as string | null,
      cursor: 'default',
      alpha: 1, x: 0, y: 0, visible: true, width: 50, height: 20,
      scale: { x: 1, y: 1, set: vi.fn() },
      clear: vi.fn(function () { return this; }),
      rect: vi.fn(function () { return this; }),
      fill: vi.fn(function () { return this; }),
      roundRect: vi.fn(function () { return this; }),
      moveTo: vi.fn(function () { return this; }),
      lineTo: vi.fn(function () { return this; }),
      stroke: vi.fn(function () { return this; }),
    } as any;
  }

  const mockLayer = {
    screenW: 800,
    screenH: 600,
    root: makeMockContainer(),
    emptyTexture: null,
    createContainer: () => makeMockContainer(),
    createGraphics: () => makeMockContainer(),
    createText: vi.fn(() => ({ ...makeMockContainer(), text: '', style: {} })),
    createSprite: vi.fn(() => ({ ...makeMockContainer(), texture: {}, anchor: { set: vi.fn() }, tint: 0xffffff })),
    createDialogueBox: vi.fn(),
    createPortraitLayer: vi.fn(),
    createBackgroundLayer: vi.fn(),
    createScreenEffects: vi.fn(),
    createTypingEngine: vi.fn(),
    destroy: vi.fn(),
  };

  function makeScript(ops: any[]) {
    return { version: 1, ops };
  }

  function makeMockHost() {
    let script: any[] = [];
    return {
      setScript: vi.fn((lines: any[]) => { script = lines; }),
      next: vi.fn(),
      getState: vi.fn(() => 'typing'),
      getLineIndex: vi.fn(() => 0),
      getLineCount: vi.fn(() => script.length),
      goTo: vi.fn(),
      fadeOut: vi.fn(),
      fadeIn: vi.fn(),
      setFlag: vi.fn(),
      clearFlag: vi.fn(),
      hasFlag: vi.fn(() => false),
      _scriptLines: () => script,
    };
  }

  function createPlayer(host: any) {
    const parent = makeMockContainer();
    return new VnScriptPlayer(host as any, mockLayer as any, parent as any);
  }

  beforeAll(async () => {
    vi.mock('gsap', () => ({
      default: {
        to: vi.fn(), killTweensOf: vi.fn(), registerPlugin: vi.fn(), delayedCall: vi.fn(),
      },
      gsap: {
        to: vi.fn(), killTweensOf: vi.fn(), registerPlugin: vi.fn(), delayedCall: vi.fn(),
      },
    }));
    const mod = await import('../vn/VnScriptPlayer');
    VnScriptPlayer = mod.VnScriptPlayer;
  });

  it('processes simple dialog line', () => {
    const host = makeMockHost();
    const player = createPlayer(host);
    player.load(makeScript([
      { type: 'dialog', text: 'Hello' },
    ]));
    const lines = host._scriptLines();
    expect(lines.length).toBe(1);
    expect(lines[0].text).toBe('Hello');
  });

  it('dialog without flush loses earlier dialog if not separated', () => {
    const host = makeMockHost();
    const player = createPlayer(host);
    player.load(makeScript([
      { type: 'dialog', text: 'first' },
      { type: 'dialog', text: 'second' },
    ]));
    // The second dialog overwrites _currentDialog; only one line is flushed at end.
    const lines = host._scriptLines();
    expect(lines.length).toBe(1);
    expect(lines[0].text).toBe('second');
  });

  it('jump to label processes ops from that label forward', () => {
    const host = makeMockHost();
    const player = createPlayer(host);
    player.load(makeScript([
      { type: 'label', name: 'start' },
      { type: 'dialog', text: 'before jump' },
      { type: 'label', name: 'skip' },
      { type: 'jump', target: 'end' },
      { type: 'dialog', text: 'should not appear' },
      { type: 'label', name: 'end' },
      { type: 'dialog', text: 'after jump' },
    ]));
    const lines = host._scriptLines();
    expect(lines.length).toBe(2);
    expect(lines[0].text).toBe('before jump');
    expect(lines[1].text).toBe('after jump');
  });

  it('jump past end of ops does not crash', () => {
    const host = makeMockHost();
    const player = createPlayer(host);
    expect(() => {
      player.load(makeScript([
        { type: 'dialog', text: 'start' },
        { type: 'jump', target: 'nonexistent' },
      ]));
    }).not.toThrow();
  });

  it('multiple sequential jumps process correctly without infinite recursion', () => {
    const host = makeMockHost();
    const player = createPlayer(host);
    player.load(makeScript([
      { type: 'dialog', text: 'line 0' },
      { type: 'label', name: 'a' },
      { type: 'jump', target: 'b' },
      { type: 'label', name: 'b' },
      { type: 'dialog', text: 'line b' },
      { type: 'label', name: 'c' },
      { type: 'jump', target: 'd' },
      { type: 'label', name: 'd' },
      { type: 'dialog', text: 'line d' },
    ]));
    const lines = host._scriptLines();
    // line 0 → jump a → label a → jump b → label b → line b → label c → jump d → label d → line d
    // Result: line 0, line b, line d
    expect(lines.length).toBe(3);
    expect(lines[0].text).toBe('line 0');
    expect(lines[1].text).toBe('line b');
    expect(lines[2].text).toBe('line d');
  });

  it('return without call is a no-op', () => {
    const host = makeMockHost();
    const player = createPlayer(host);
    expect(() => {
      player.load(makeScript([
        { type: 'return' },
        { type: 'dialog', text: 'after return' },
      ]));
    }).not.toThrow();
  });

  it('jumpTo re-processes from the target label', () => {
    const host = makeMockHost();
    const player = createPlayer(host);
    player.load(makeScript([
      { type: 'label', name: 'start' },
      { type: 'dialog', text: 'from start' },
      { type: 'label', name: 'later' },
      { type: 'dialog', text: 'from later' },
    ]));
    // Two consecutive dialogs → second overwrites → only "from later"
    expect(host._scriptLines().length).toBe(1);
    expect(host._scriptLines()[0].text).toBe('from later');

    host.setScript.mockClear();

    // Jump back to 'start' re-processes from that label.
    // Same overwrite happens: dialog "from start" → overwritten by "from later".
    player.jumpTo('start');
    const lines = host._scriptLines();
    expect(lines.length).toBe(1);
    expect(lines[0].text).toBe('from later');
  });

  it('end op flushes current dialog and appends end marker', () => {
    const host = makeMockHost();
    const player = createPlayer(host);
    player.load(makeScript([
      { type: 'dialog', text: 'before end' },
      { type: 'end' },
      { type: 'dialog', text: 'after end' },
    ]));
    const lines = host._scriptLines();
    // dialog "before end" is flushed by 'end' op → line 0
    // 'end' op appends end marker → line 1
    // dialog "after end" is flushed at final _flush → line 2
    expect(lines.length).toBe(3);
    expect(lines[0].text).toBe('before end');
    expect(lines[1].end).toBe(true);
    expect(lines[2].text).toBe('after end');
  });

  it('processes dialog with speaker info', () => {
    const host = makeMockHost();
    const player = createPlayer(host);
    player.load(makeScript([
      { type: 'dialog', text: 'Hello', speaker: 'Alice' },
    ]));
    const lines = host._scriptLines();
    expect(lines[0].speaker).toBe('Alice');
    expect(lines[0].text).toBe('Hello');
  });

  it('setFlag and clearFlag call host methods', () => {
    const host = makeMockHost();
    const player = createPlayer(host);
    player.load(makeScript([
      { type: 'setFlag', name: 'seen_intro' },
      { type: 'clearFlag', name: 'seen_intro' },
    ]));
    expect(host.setFlag).toHaveBeenCalledWith('seen_intro');
    expect(host.clearFlag).toHaveBeenCalledWith('seen_intro');
  });
});

// ──────────────────────────────────────────────
// 5. AvdController _onStateChange → _redrawOverlay
// ──────────────────────────────────────────────

describe('AvdController overlay', () => {
  beforeAll(() => {
    vi.mock('gsap', () => ({
      default: {
        to: vi.fn((_t: unknown, vars: Record<string, unknown>) => {
          if (typeof vars.onComplete === 'function') vars.onComplete();
          return { kill: vi.fn() };
        }),
        killTweensOf: vi.fn(),
        registerPlugin: vi.fn(),
        delayedCall: vi.fn(),
      },
      gsap: {
        to: vi.fn((_t: unknown, vars: Record<string, unknown>) => {
          if (typeof vars.onComplete === 'function') vars.onComplete();
          return { kill: vi.fn() };
        }),
        killTweensOf: vi.fn(),
        registerPlugin: vi.fn(),
        delayedCall: vi.fn(),
      },
    }));

    vi.mock('pixi.js', async () => {
      const actual = await vi.importActual('pixi.js');
      function makeContainer() {
        const children: unknown[] = [];
        return {
          children,
          addChild: vi.fn(function (c: unknown) { children.push(c); return c; }),
          addChildAt: vi.fn(function (c: unknown, idx: number) { children.splice(idx, 0, c); return c; }),
          removeChild: vi.fn(function (c: unknown) {
            const idx = children.indexOf(c);
            if (idx >= 0) children.splice(idx, 1);
            return c;
          }),
          removeChildren: vi.fn(() => { const all = [...children]; children.length = 0; return all; }),
          removeFromParent: vi.fn(),
          destroy: vi.fn(),
          eventMode: null as string | null,
          on: vi.fn(),
          off: vi.fn(),
          cursor: 'default',
          alpha: 1, x: 0, y: 0, visible: true, width: 50, height: 20,
          scale: { x: 1, y: 1, set: vi.fn() },
          clear: vi.fn(function () { return this; }),
          rect: vi.fn(function () { return this; }),
          fill: vi.fn(function () { return this; }),
          roundRect: vi.fn(function () { return this; }),
          moveTo: vi.fn(function () { return this; }),
          lineTo: vi.fn(function () { return this; }),
          stroke: vi.fn(function () { return this; }),
          getLocalBounds: vi.fn(() => ({ x: 0, y: 0, width: 50, height: 20 })),
          getBounds: vi.fn(() => ({ x: 0, y: 0, width: 50, height: 20 })),
        } as any;
      }
      return {
        ...actual as object,
        Container: vi.fn(makeContainer),
        Graphics: vi.fn(makeContainer),
        Text: vi.fn(function () {
          return { ...makeContainer(), width: 50, height: 16, text: '', style: {}, anchor: { set: vi.fn() } };
        }),
        TextStyle: vi.fn(function () { return {}; }),
        Sprite: vi.fn(function () { return { ...makeContainer(), texture: {}, anchor: { set: vi.fn() } }; }),
        Ticker: vi.fn(function () { return { add: vi.fn(), remove: vi.fn(), deltaMS: 16 }; }),
      };
    });
  });

  it('calls onStateChange when setScript transitions to typing', async () => {
    const { AvdController } = await import('../AvdController');
    const PIXI = await import('pixi.js');

    const parent = new PIXI.Container();
    const ticker = { add: vi.fn(), remove: vi.fn(), deltaMS: 16 } as any;
    const onStateChange = vi.fn();
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600, onStateChange });

    expect(onStateChange).not.toHaveBeenCalled();
    ctrl.setScript([{ speaker: 'Alice', text: 'Hello' }]);
    expect(onStateChange).toHaveBeenCalledWith('typing');
  });

  it('tick calls redrawOverlay via _onStateChange', async () => {
    const { AvdController } = await import('../AvdController');
    const PIXI = await import('pixi.js');

    const parent = new PIXI.Container();
    const ticker = { add: vi.fn(), remove: vi.fn(), deltaMS: 16 } as any;
    const ctrl = new AvdController(parent, ticker, { screenW: 800, screenH: 600 });

    // Spy on the private _redrawOverlay method
    const redrawSpy = vi.spyOn(ctrl as any, '_redrawOverlay');

    ctrl.setScript([{ speaker: 'Alice', text: 'Hello' }]);
    expect(redrawSpy).toHaveBeenCalled();

    // The overlay should be eventMode 'static' and have dimensions
    const overlay = (ctrl as any)._clickOverlay;
    expect(overlay.eventMode).toBe('static');
  });

  it('click overlay has correct dimensions after _onStateChange', async () => {
    const { AvdController } = await import('../AvdController');
    const PIXI = await import('pixi.js');

    const parent = new PIXI.Container();
    const ticker = { add: vi.fn(), remove: vi.fn(), deltaMS: 16 } as any;
    const ctrl = new AvdController(parent, ticker, { screenW: 1280, screenH: 720 });

    ctrl.setScript([{ speaker: 'Alice', text: 'Hello' }]);
    const overlay = (ctrl as any)._clickOverlay;

    // _redrawOverlay calls .rect() with screenW/screenH and .fill()
    expect(overlay.rect).toHaveBeenCalledWith(0, 0, 1280, 720);
    expect(overlay.fill).toHaveBeenCalledWith({ color: 0x000000, alpha: 0.001 });
  });

  it('onStateChange callback called for typing, between, done states', async () => {
    const { AvdController } = await import('../AvdController');
    const PIXI = await import('pixi.js');

    const parent = new PIXI.Container();
    const ticker = { add: vi.fn(), remove: vi.fn(), deltaMS: 16 } as any;
    const onStateChange = vi.fn();
    const ctrl = new AvdController(parent, ticker, {
      screenW: 800, screenH: 600, onStateChange,
    });

    ctrl.setScript([{ speaker: 'Alice', text: 'Hi' }]);
    // setScript triggers typing
    // next() triggers typing→between (via complete → advance)
    ctrl.next();
    // next() triggers between→typing (next line)
    ctrl.next();

    expect(onStateChange).toHaveBeenCalledWith('typing');

    // Verify the overlay redraw was called each state change
    const overlay = (ctrl as any)._clickOverlay;
    expect(overlay.clear).toHaveBeenCalled();
  });
});
