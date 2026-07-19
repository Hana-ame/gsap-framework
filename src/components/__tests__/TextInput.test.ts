import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../framework/gsap-pixi', () => ({
  gsap: {
    to: vi.fn(() => ({ kill: vi.fn() })),
    killTweensOf: vi.fn(),
    timeline: vi.fn(() => {
      const tl: any = { kill: vi.fn() };
      tl.to = vi.fn(() => tl);
      tl.call = vi.fn(() => tl);
      return tl;
    }),
    registerPlugin: vi.fn(),
  },
  PixiPlugin: { registerPIXI: vi.fn() },
}));

vi.mock('../../framework/ui-helpers', () => ({
  textPresets: { dim: { fontSize: 12, fill: 0x888899 } },
  makeButton: vi.fn(),
  makeStepper: vi.fn(),
}));

const createdObjects: Record<string, unknown>[] = [];
function mockPixiObj(extra: Record<string, unknown> = {}): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    children: [], addChild: vi.fn((c: unknown) => { (obj.children as unknown[]).push(c); return c; }),
    removeChild: vi.fn(), destroy: vi.fn(), eventMode: null, on: vi.fn(),
    x: 0, y: 0, width: 0, height: 0, text: '', visible: true, alpha: 1, parent: null,
    style: {}, getBounds: vi.fn(() => ({ x: 0, y: 0, width: 200, height: 40, top: 0, left: 0, right: 200, bottom: 40 })),
    clear: vi.fn(() => obj), roundRect: vi.fn(() => obj), fill: vi.fn(() => obj), stroke: vi.fn(() => obj),
    ...extra,
  };
  createdObjects.push(obj);
  return obj;
}

vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  return {
    ...actual as object,
    Container: vi.fn(function () { return mockPixiObj(); }),
    Graphics: vi.fn(function () { return mockPixiObj(); }),
    Text: vi.fn(function () { return mockPixiObj({ width: 50, height: 16, text: '' }); }),
    TextStyle: vi.fn(),
  };
});

import { createTextInput } from '../TextInput';

describe('createTextInput', () => {
  let parent: Record<string, unknown>;

  beforeEach(() => {
    createdObjects.length = 0;
    parent = { addChild: vi.fn(), removeChild: vi.fn(), children: [] };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('returns handle with expected shape', () => {
    const handle = createTextInput(parent as never, { x: 10, y: 20, width: 200, height: 40 });
    expect(handle.stage).toBeDefined();
    expect(handle.inputEl).toBeDefined();
    expect(typeof handle.focus).toBe('function');
    expect(typeof handle.blur).toBe('function');
    expect(typeof handle.getValue).toBe('function');
    expect(typeof handle.setValue).toBe('function');
    expect(typeof handle.setEnabled).toBe('function');
    expect(typeof handle.destroy).toBe('function');
    expect(handle.destroyed).toBe(false);
  });

  it('returns stage container', () => {
    const handle = createTextInput(parent as never, { x: 10, y: 20, width: 200, height: 40 });
    expect(handle.stage).toBeDefined();
  });

  it('creates overlay and input DOM elements', () => {
    createTextInput(parent as never, { x: 10, y: 20, width: 200, height: 40 });
    const inputs = document.querySelectorAll('input');
    expect(inputs.length).toBe(1);
    expect(inputs[0].value).toBe('');
  });

  it('sets initial value on input', () => {
    const handle = createTextInput(parent as never, { x: 10, y: 20, width: 200, height: 40, value: 'hello' });
    expect(handle.getValue()).toBe('hello');
  });

  it('setValue updates input value', () => {
    const handle = createTextInput(parent as never, { x: 10, y: 20, width: 200, height: 40 });
    handle.setValue('world');
    expect(handle.getValue()).toBe('world');
  });

  it('focus/blur toggles state', () => {
    const handle = createTextInput(parent as never, { x: 10, y: 20, width: 200, height: 40 });
    handle.focus();
    handle.blur();
  });

  it('setEnabled false dims the container', () => {
    const handle = createTextInput(parent as never, { x: 10, y: 20, width: 200, height: 40 });
    handle.setEnabled(false);
    expect((handle.stage as any).alpha).toBe(0.5);
  });

  it('setEnabled true restores full alpha', () => {
    const handle = createTextInput(parent as never, { x: 10, y: 20, width: 200, height: 40 });
    handle.setEnabled(false);
    handle.setEnabled(true);
    expect((handle.stage as any).alpha).toBe(1);
  });

  it('getValue returns current input text', () => {
    const handle = createTextInput(parent as never, { x: 10, y: 20, width: 200, height: 40, value: 'test' });
    expect(handle.getValue()).toBe('test');
    handle.inputEl.value = 'updated';
    expect(handle.getValue()).toBe('updated');
  });

  it('destroy toggles destroyed flag', () => {
    const handle = createTextInput(parent as never, { x: 10, y: 20, width: 200, height: 40 });
    expect(handle.destroyed).toBe(false);
    handle.destroy();
    expect(handle.destroyed).toBe(true);
  });

  it('destroy is idempotent', () => {
    const handle = createTextInput(parent as never, { x: 10, y: 20, width: 200, height: 40 });
    handle.destroy();
    expect(() => handle.destroy()).not.toThrow();
  });

  it('destroy removes overlay from body', () => {
    const handle = createTextInput(parent as never, { x: 10, y: 20, width: 200, height: 40 });
    const overlay = document.body.lastChild;
    expect(overlay).not.toBeNull();
    handle.destroy();
    expect(document.body.contains(overlay)).toBe(false);
  });

  it('focus after destroy is no-op', () => {
    const handle = createTextInput(parent as never, { x: 10, y: 20, width: 200, height: 40 });
    handle.destroy();
    expect(() => handle.focus()).not.toThrow();
  });

  it('password mode masks display', () => {
    const handle = createTextInput(parent as never, {
      x: 10, y: 20, width: 200, height: 40, password: true, value: 'secret',
    });
    expect(handle.getValue()).toBe('secret');
    expect(handle.inputEl.type).toBe('password');
  });
});
