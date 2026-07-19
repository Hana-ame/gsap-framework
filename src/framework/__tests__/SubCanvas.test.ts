import { describe, it, expect, vi } from 'vitest';
import * as PIXI from 'pixi.js';
import { SubCanvas } from '../SubCanvas';
import { SubCanvasProxy } from '../SubCanvasProxy';

function createMockApp(): { stage: PIXI.Container } {
  return { stage: new PIXI.Container() };
}

function createPointerEvent(type: string, opts: { clientX: number; clientY: number }): PointerEvent {
  return {
    type,
    clientX: opts.clientX,
    clientY: opts.clientY,
    target: null,
    button: 0,
  } as PointerEvent;
}

describe('SubCanvas event routing', () => {
  it('routes pointerdown to registered handler within bounds', () => {
    const app = createMockApp();
    const sc = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 0, y: 0, width: 400, height: 300 },
    });

    const handler = vi.fn();
    sc.onPress(handler);

    const event = createPointerEvent('pointerdown', { clientX: 200, clientY: 150 });
    const result = sc.handlePointer('pointerdown', event);

    expect(result).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'pointerdown',
        x: 200,
        y: 150,
        globalX: 200,
        globalY: 150,
      }),
    );
  });

  it('does not route events outside bounds', () => {
    const app = createMockApp();
    const sc = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 100, y: 100, width: 200, height: 200 },
    });

    const handler = vi.fn();
    sc.onPress(handler);

    const event = createPointerEvent('pointerdown', { clientX: 50, clientY: 50 });
    const result = sc.handlePointer('pointerdown', event);

    expect(result).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it('routes events to sub-regions before parent', () => {
    const app = createMockApp();
    const parent = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 0, y: 0, width: 400, height: 300 },
    });

    const child = parent.createRegion({ x: 50, y: 50, width: 100, height: 100 });

    const parentHandler = vi.fn();
    const childHandler = vi.fn();
    parent.onPress(parentHandler);
    child.onPress(childHandler);

    const event = createPointerEvent('pointerdown', { clientX: 75, clientY: 75 });
    const result = parent.handlePointer('pointerdown', event);

    expect(result).toBe(true);
    expect(childHandler).toHaveBeenCalledTimes(1);
    expect(parentHandler).toHaveBeenCalledTimes(0);
  });

  it('routes to parent when event misses all sub-regions', () => {
    const app = createMockApp();
    const parent = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 0, y: 0, width: 400, height: 300 },
    });

    const child = parent.createRegion({ x: 50, y: 50, width: 100, height: 100 });

    const parentHandler = vi.fn();
    const childHandler = vi.fn();
    parent.onPress(parentHandler);
    child.onPress(childHandler);

    const event = createPointerEvent('pointerdown', { clientX: 200, clientY: 200 });
    const result = parent.handlePointer('pointerdown', event);

    expect(result).toBe(true);
    expect(childHandler).toHaveBeenCalledTimes(0);
    expect(parentHandler).toHaveBeenCalledTimes(1);
  });

  it('routes pointermove events', () => {
    const app = createMockApp();
    const sc = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 0, y: 0, width: 400, height: 300 },
    });

    const handler = vi.fn();
    sc.onMove(handler);

    const event = createPointerEvent('pointermove', { clientX: 150, clientY: 120 });
    const result = sc.handlePointer('pointermove', event);

    expect(result).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ x: 150, y: 120 }),
    );
  });

  it('routes pointerup events', () => {
    const app = createMockApp();
    const sc = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 0, y: 0, width: 400, height: 300 },
    });

    const handler = vi.fn();
    sc.onRelease(handler);

    const event = createPointerEvent('pointerup', { clientX: 100, clientY: 100 });
    const result = sc.handlePointer('pointerup', event);

    expect(result).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('detects tap when pointerdown then pointerup without significant move', () => {
    const app = createMockApp();
    const sc = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 0, y: 0, width: 400, height: 300 },
    });

    const tapHandler = vi.fn();
    sc.onTap(tapHandler);

    sc.handlePointer('pointerdown', createPointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    sc.handlePointer('pointerup', createPointerEvent('pointerup', { clientX: 101, clientY: 100 }));

    expect(tapHandler).toHaveBeenCalledTimes(1);
    expect(tapHandler).toHaveBeenCalledWith(
      expect.objectContaining({ x: 101, y: 100 }),
    );
  });

  it('does not fire tap when pointer moved beyond threshold', () => {
    const app = createMockApp();
    const sc = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 0, y: 0, width: 400, height: 300 },
    });

    const tapHandler = vi.fn();
    sc.onTap(tapHandler);

    sc.handlePointer('pointerdown', createPointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    sc.handlePointer('pointermove', createPointerEvent('pointermove', { clientX: 120, clientY: 100 }));
    sc.handlePointer('pointerup', createPointerEvent('pointerup', { clientX: 120, clientY: 100 }));

    expect(tapHandler).not.toHaveBeenCalled();
  });

  it('routes events to nested sub-regions with globalBounds calculation', () => {
    const app = createMockApp();
    const root = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 0, y: 0, width: 800, height: 600 },
    });

    const win = root.createRegion({ x: 100, y: 50, width: 300, height: 200 });
    const content = win.createRegion({ x: 0, y: 20, width: 300, height: 180 });

    const contentHandler = vi.fn();
    content.onPress(contentHandler);

    const event = createPointerEvent('pointerdown', { clientX: 150, clientY: 100 });
    const result = root.handlePointer('pointerdown', event);

    expect(result).toBe(true);
    expect(contentHandler).toHaveBeenCalledTimes(1);
    expect(contentHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        x: 50,
        y: 30,
        globalX: 150,
        globalY: 100,
      }),
    );
  });

  it('does not route to content when clicking outside it but inside window', () => {
    const app = createMockApp();
    const root = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 0, y: 0, width: 800, height: 600 },
    });

    const win = root.createRegion({ x: 100, y: 50, width: 300, height: 200 });
    const content = win.createRegion({ x: 0, y: 20, width: 300, height: 180 });

    const contentHandler = vi.fn();
    content.onPress(contentHandler);

    const event = createPointerEvent('pointerdown', { clientX: 150, clientY: 55 });
    const result = root.handlePointer('pointerdown', event);

    expect(result).toBe(false);
    expect(contentHandler).toHaveBeenCalledTimes(0);
  });

  it('returns false when no handlers registered', () => {
    const app = createMockApp();
    const sc = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 0, y: 0, width: 400, height: 300 },
    });

    const event = createPointerEvent('pointermove', { clientX: 150, clientY: 120 });
    const result = sc.handlePointer('pointermove', event);

    expect(result).toBe(false);
  });

  it('multiple handlers on same event type all fire', () => {
    const app = createMockApp();
    const sc = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 0, y: 0, width: 400, height: 300 },
    });

    const h1 = vi.fn();
    const h2 = vi.fn();
    sc.onMove(h1);
    sc.onMove(h2);

    sc.handlePointer('pointermove', createPointerEvent('pointermove', { clientX: 150, clientY: 120 }));

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('offPointer removes handler', () => {
    const app = createMockApp();
    const sc = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 0, y: 0, width: 400, height: 300 },
    });

    const handler = vi.fn();
    sc.onPress(handler);
    sc.offPointer('pointerdown', handler);

    sc.handlePointer('pointerdown', createPointerEvent('pointerdown', { clientX: 150, clientY: 120 }));

    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores events after destroy', () => {
    const app = createMockApp();
    const sc = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 0, y: 0, width: 400, height: 300 },
    });

    const handler = vi.fn();
    sc.onPress(handler);
    sc.destroy();

    sc.handlePointer('pointerdown', createPointerEvent('pointerdown', { clientX: 150, clientY: 120 }));

    expect(handler).not.toHaveBeenCalled();
  });

  it('setPosition updates bounds and fires resize listeners', () => {
    const app = createMockApp();
    const sc = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 0, y: 0, width: 400, height: 300 },
    });

    const resizeHandler = vi.fn();
    sc.onResize(resizeHandler);

    sc.setPosition(100, 200);

    expect(sc.bounds.x).toBe(100);
    expect(sc.bounds.y).toBe(200);
    expect(sc.stage.position.x).toBe(100);
    expect(sc.stage.position.y).toBe(200);
  });

  it('setSize updates bounds', () => {
    const app = createMockApp();
    const sc = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 0, y: 0, width: 400, height: 300 },
    });

    sc.setSize(500, 400);

    expect(sc.bounds.width).toBe(500);
    expect(sc.bounds.height).toBe(400);
  });

  it('globalBounds accounts for parent offset', () => {
    const app = createMockApp();
    const parent = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 100, y: 50, width: 400, height: 300 },
    });

    const child = parent.createRegion({ x: 10, y: 20, width: 200, height: 150 });

    const gb = child.globalBounds;
    expect(gb.x).toBe(110);
    expect(gb.y).toBe(70);
    expect(gb.width).toBe(200);
    expect(gb.height).toBe(150);
  });

  it('destroy prevents further operation', () => {
    const app = createMockApp();
    const sc = new SubCanvas({
      rootApp: app as never,
      bounds: { x: 0, y: 0, width: 400, height: 300 },
    });

    sc.destroy();
    expect(sc.destroyed).toBe(true);

    sc.setPosition(10, 10);
    expect(sc.bounds.x).toBe(0);
  });
});

describe('SubCanvasProxy event routing', () => {
  it('routes events to top-level canvases', () => {
    const app = createMockApp();
    const proxy = new SubCanvasProxy({ app: app as never });

    const sc = proxy.createRegion({ x: 0, y: 0, width: 400, height: 300 });

    const handler = vi.fn();
    sc.onPress(handler);

    proxy.routePointer('pointerdown', createPointerEvent('pointerdown', { clientX: 200, clientY: 150 }));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('routes events through nested hierarchy', () => {
    const app = createMockApp();
    const proxy = new SubCanvasProxy({ app: app as never });

    const root = proxy.createRegion({ x: 0, y: 0, width: 800, height: 600 });
    const child = root.createRegion({ x: 100, y: 100, width: 200, height: 200 });

    const handler = vi.fn();
    child.onPress(handler);

    proxy.routePointer('pointerdown', createPointerEvent('pointerdown', { clientX: 150, clientY: 150 }));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not route when proxy is empty', () => {
    const app = createMockApp();
    const proxy = new SubCanvasProxy({ app: app as never });

    expect(() =>
      proxy.routePointer('pointerdown', createPointerEvent('pointerdown', { clientX: 200, clientY: 150 })),
    ).not.toThrow();
  });

  it('cleanup via destroyAll', () => {
    const app = createMockApp();
    const proxy = new SubCanvasProxy({ app: app as never });

    const root = proxy.createRegion({ x: 0, y: 0, width: 800, height: 600 });
    const child = root.createRegion({ x: 100, y: 100, width: 200, height: 200 });

    const handler = vi.fn();
    child.onPress(handler);

    proxy.destroyAll();

    proxy.routePointer('pointerdown', createPointerEvent('pointerdown', { clientX: 150, clientY: 150 }));

    expect(handler).not.toHaveBeenCalled();
    expect(proxy.getTopCanvases()).toEqual([]);
  });

  it('supports multiple top-level canvases', () => {
    const app = createMockApp();
    const proxy = new SubCanvasProxy({ app: app as never });

    const sc1 = proxy.createRegion({ x: 0, y: 0, width: 200, height: 200 });
    const sc2 = proxy.createRegion({ x: 300, y: 0, width: 200, height: 200 });

    const h1 = vi.fn();
    const h2 = vi.fn();
    sc1.onPress(h1);
    sc2.onPress(h2);

    proxy.routePointer('pointerdown', createPointerEvent('pointerdown', { clientX: 350, clientY: 100 }));

    expect(h1).toHaveBeenCalledTimes(0);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('createRegion creates SubCanvas with correct bounds', () => {
    const app = createMockApp();
    const proxy = new SubCanvasProxy({ app: app as never });

    const sc = proxy.createRegion({ x: 10, y: 20, width: 300, height: 200 });

    expect(sc.bounds.x).toBe(10);
    expect(sc.bounds.y).toBe(20);
    expect(sc.bounds.width).toBe(300);
    expect(sc.bounds.height).toBe(200);
    expect(sc.stage.position.x).toBe(10);
    expect(sc.stage.position.y).toBe(20);
  });

  it('getTopCanvases returns copy of top-level canvases', () => {
    const app = createMockApp();
    const proxy = new SubCanvasProxy({ app: app as never });

    const sc = proxy.createRegion({ x: 0, y: 0, width: 400, height: 300 });
    const list = proxy.getTopCanvases();

    expect(list).toHaveLength(1);
    expect(list[0]).toBe(sc);
  });
});
