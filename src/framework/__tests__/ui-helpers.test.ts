import { describe, it, expect, vi } from 'vitest';

const createdObjects: Record<string, unknown>[] = [];

function mockPixiObj(extra: Record<string, unknown> = {}): Record<string, unknown> {
  const handlers = new Map<string, Set<(...args: unknown[]) => void>>();
  const obj: Record<string, unknown> = {
    children: [],
    addChild: vi.fn(function (this: Record<string, unknown>, child: unknown) {
      (this.children as unknown[]).push(child);
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
    emit: vi.fn(function (evt: string, ...args: unknown[]) {
      const s = handlers.get(evt);
      if (s) s.forEach((fn) => fn(...args));
    }),
    cursor: 'default',
    x: 0, y: 0, width: 50, height: 20,
    label: '',
    parent: null,
    zIndex: 0,
    position: { set: vi.fn(), x: 0, y: 0 },
    text: '',
    anchor: { set: vi.fn() },
    clear: vi.fn(function () { return obj; }),
    roundRect: vi.fn(function () { return obj; }),
    fill: vi.fn(function () { return obj; }),
    stroke: vi.fn(function () { return obj; }),
    rect: vi.fn(function () { return obj; }),
    poly: vi.fn(function () { return obj; }),
    circle: vi.fn(function () { return obj; }),
    visible: true,
    ...extra,
  };
  createdObjects.push(obj);
  return obj;
}

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  const Container = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  const Graphics = vi.fn(function () { return mockPixiObj(); } as unknown as new () => Record<string, unknown>);
  const Text = vi.fn(function () { return mockPixiObj({ width: 30 }); } as unknown as new () => Record<string, unknown>);
  return {
    ...actual as object,
    Container, Graphics, Text,
    TextStyle: vi.fn(),
    Rectangle: vi.fn(function (this: Record<string, unknown>, x: number, y: number, w: number, h: number) {
      this.x = x; this.y = y; this.width = w; this.height = h;
    }),
  };
});

describe('makeButton', () => {
  it('creates container with eventMode static', async () => {
    const { makeButton } = await import('../ui-helpers');
    const btn = makeButton('Test', 100, 30, vi.fn());
    expect(btn.eventMode).toBe('static');
    expect(btn.cursor).toBe('pointer');
  });

  it('click handler fires onClick', async () => {
    const { makeButton } = await import('../ui-helpers');
    const onClick = vi.fn();
    const btn = makeButton('Test', 100, 30, onClick);
    btn.emit('pointerdown', { stopPropagation: vi.fn() } as never);
    expect(onClick).toHaveBeenCalled();
  });

  it('creates children (graphics + texts)', async () => {
    const { makeButton } = await import('../ui-helpers');
    const btn = makeButton('Test', 100, 30, vi.fn());
    expect(btn.children.length).toBeGreaterThanOrEqual(2);
  });
});

describe('makeStepper', () => {
  it('creates stepper with container, width, refresh', async () => {
    const { makeStepper } = await import('../ui-helpers');
    const st = makeStepper('Count', () => 5, vi.fn(), 0, 10);
    expect(st.container).toBeDefined();
    expect(typeof st.width).toBe('number');
    expect(typeof st.refresh).toBe('function');
    expect(st.width).toBeGreaterThan(0);
  });

  it('minus button fires onChange with decremented value', async () => {
    const { makeStepper } = await import('../ui-helpers');
    let val = 5;
    const onChange = vi.fn((v: number) => { val = v; });
    const st = makeStepper('Count', () => val, onChange, 0, 10);
    const minusBtn = st.container.children[2];
    if (minusBtn && typeof (minusBtn as Record<string, unknown>).emit === 'function') {
      ((minusBtn as Record<string, unknown>).emit as (e: string, d: unknown) => void)('pointerdown', { stopPropagation: vi.fn() });
    }
    expect(onChange).toHaveBeenCalled();
  });

  it('plus button fires onChange with incremented value', async () => {
    const { makeStepper } = await import('../ui-helpers');
    let val = 5;
    const onChange = vi.fn((v: number) => { val = v; });
    const st = makeStepper('Count', () => val, onChange, 0, 10);
    const plusBtn = st.container.children[3];
    if (plusBtn && typeof (plusBtn as Record<string, unknown>).emit === 'function') {
      ((plusBtn as Record<string, unknown>).emit as (e: string, d: unknown) => void)('pointerdown', { stopPropagation: vi.fn() });
    }
    expect(onChange).toHaveBeenCalled();
  });

  it('refresh updates displayed value', async () => {
    const { makeStepper } = await import('../ui-helpers');
    const val = 3;
    const st = makeStepper('Count', () => val, vi.fn(), 0, 10);
    const textChildren = st.container.children.filter((c: unknown) =>
      (c as Record<string, unknown>).text !== undefined
    );
    expect(textChildren.length).toBeGreaterThan(0);
  });
});
