import { describe, it, expect, vi } from 'vitest';
import * as PIXI from 'pixi.js';
import { SubCanvasProxy } from '../SubCanvasProxy';

function createMockApp() {
  const stage = new PIXI.Container();
  return {
    stage,
    canvas: document.createElement('canvas'),
    ticker: { add: vi.fn(), remove: vi.fn() },
    renderer: { resize: vi.fn(), render: vi.fn() },
  } as never;
}

describe('SubCanvasProxy', () => {
  it('constructs with an app', () => {
    const proxy = new SubCanvasProxy({ app: createMockApp() });
    expect(proxy).toBeInstanceOf(SubCanvasProxy);
  });

  it('bus returns an EventBus', () => {
    const proxy = new SubCanvasProxy({ app: createMockApp() });
    expect(proxy.bus).toBeDefined();
    expect(typeof proxy.bus.on).toBe('function');
    expect(typeof proxy.bus.emit).toBe('function');
  });

  it('canvas returns the app canvas', () => {
    const app = createMockApp();
    const proxy = new SubCanvasProxy({ app });
    expect(proxy.canvas).toBe(app.canvas);
  });

  it('ticker returns the app ticker', () => {
    const app = createMockApp();
    const proxy = new SubCanvasProxy({ app });
    expect(proxy.ticker).toBe(app.ticker);
  });

  it('renderer returns the app renderer', () => {
    const app = createMockApp();
    const proxy = new SubCanvasProxy({ app });
    expect(proxy.renderer).toBe(app.renderer);
  });

  it('stage returns the app stage', () => {
    const app = createMockApp();
    const proxy = new SubCanvasProxy({ app });
    expect(proxy.stage).toBe(app.stage);
  });

  it('getTopCanvases returns empty array initially', () => {
    const proxy = new SubCanvasProxy({ app: createMockApp() });
    expect(proxy.getTopCanvases()).toEqual([]);
  });

  it('createRegion returns a SubCanvas', () => {
    const proxy = new SubCanvasProxy({ app: createMockApp() });
    const sc = proxy.createRegion({ x: 0, y: 0, width: 400, height: 300 });
    expect(sc).toBeDefined();
    expect(typeof sc.destroy).toBe('function');
  });

  it('createRegion adds to topCanvases', () => {
    const proxy = new SubCanvasProxy({ app: createMockApp() });
    const sc = proxy.createRegion({ x: 0, y: 0, width: 400, height: 300 });
    expect(proxy.getTopCanvases()).toHaveLength(1);
    expect(proxy.getTopCanvases()[0]).toBe(sc);
  });

  it('createRegion adds multiple canvases', () => {
    const proxy = new SubCanvasProxy({ app: createMockApp() });
    proxy.createRegion({ x: 0, y: 0, width: 100, height: 100 });
    proxy.createRegion({ x: 100, y: 0, width: 100, height: 100 });
    expect(proxy.getTopCanvases()).toHaveLength(2);
  });

  it('destroy removes canvas from topCanvases', () => {
    const proxy = new SubCanvasProxy({ app: createMockApp() });
    const sc = proxy.createRegion({ x: 0, y: 0, width: 400, height: 300 });
    expect(proxy.getTopCanvases()).toHaveLength(1);
    sc.destroy();
    expect(proxy.getTopCanvases()).toHaveLength(0);
  });

  it('getTopCanvases returns a copy', () => {
    const proxy = new SubCanvasProxy({ app: createMockApp() });
    proxy.createRegion({ x: 0, y: 0, width: 100, height: 100 });
    const list = proxy.getTopCanvases();
    expect(list).toHaveLength(1);
    list.pop();
    expect(proxy.getTopCanvases()).toHaveLength(1);
  });

  it('routePointer delegates to all canvases', () => {
    const proxy = new SubCanvasProxy({ app: createMockApp() });
    const sc1 = proxy.createRegion({ x: 0, y: 0, width: 100, height: 100 });
    const sc2 = proxy.createRegion({ x: 0, y: 0, width: 100, height: 100 });
    const spy1 = vi.spyOn(sc1, 'handlePointer');
    const spy2 = vi.spyOn(sc2, 'handlePointer');
    const e = { clientX: 50, clientY: 50, button: 0 } as PointerEvent;
    proxy.routePointer('pointerdown', e);
    expect(spy1).toHaveBeenCalledWith('pointerdown', e);
    expect(spy2).toHaveBeenCalledWith('pointerdown', e);
  });

  it('destroyAll destroys all canvases and clears bus', () => {
    const proxy = new SubCanvasProxy({ app: createMockApp() });
    const sc1 = proxy.createRegion({ x: 0, y: 0, width: 100, height: 100 });
    const sc2 = proxy.createRegion({ x: 0, y: 0, width: 100, height: 100 });
    const spy1 = vi.spyOn(sc1, 'destroy');
    const spy2 = vi.spyOn(sc2, 'destroy');
    proxy.destroyAll();
    expect(spy1).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
    expect(proxy.getTopCanvases()).toHaveLength(0);
  });

  it('onWindowResize registers listener and returns cleanup', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const proxy = new SubCanvasProxy({ app: createMockApp() });
    const fn = vi.fn();
    const cleanup = proxy.onWindowResize(fn);
    expect(addSpy).toHaveBeenCalledWith('resize', fn);
    cleanup();
    expect(removeSpy).toHaveBeenCalledWith('resize', fn);
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
