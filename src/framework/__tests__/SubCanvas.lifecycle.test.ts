import { describe, it, expect, vi } from 'vitest';
import * as PIXI from 'pixi.js';
import { SubCanvas } from '../SubCanvas';

function mockApp() {
  return { stage: new PIXI.Container() } as never;
}

function makePointerEvent(clientX: number, clientY: number): PointerEvent {
  return { clientX, clientY, button: 0, target: null } as PointerEvent;
}

describe('SubCanvas lifecycle', () => {
  it('destroy sets destroyed=true', () => {
    const sc = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 400, height: 300 } });
    expect(sc.destroyed).toBe(false);
    sc.destroy();
    expect(sc.destroyed).toBe(true);
  });

  it('destroy cascades to all sub-regions', () => {
    const parent = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 800, height: 600 } });
    const child = parent.createRegion({ x: 100, y: 100, width: 200, height: 150 });
    const grandchild = child.createRegion({ x: 0, y: 0, width: 100, height: 100 });
    parent.destroy();
    expect(parent.destroyed).toBe(true);
    expect(child.destroyed).toBe(true);
    expect(grandchild.destroyed).toBe(true);
  });

  it('destroy removes stage from parent', () => {
    const parent = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 800, height: 600 } });
    const child = parent.createRegion({ x: 100, y: 100, width: 200, height: 150 });
    child.destroy();
    expect(child.stage.parent).toBeNull();
  });

  it('destroy clears all pointer listeners', () => {
    const sc = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 400, height: 300 } });
    const handler = vi.fn();
    sc.onPress(handler);
    sc.onMove(handler);
    sc.destroy();
    const event = makePointerEvent(200, 150);
    sc.handlePointer('pointerdown', event);
    sc.handlePointer('pointermove', event);
    expect(handler).not.toHaveBeenCalled();
  });

  it('destroy clears resize listeners', () => {
    const sc = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 400, height: 300 } });
    const handler = vi.fn();
    sc.onResize(handler);
    sc.destroy();
    sc.setBounds({ x: 0, y: 0, width: 500, height: 400 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('double destroy is safe', () => {
    const sc = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 400, height: 300 } });
    sc.destroy();
    expect(() => sc.destroy()).not.toThrow();
    expect(sc.destroyed).toBe(true);
  });

  it('parent destroy prevents child events', () => {
    const parent = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 800, height: 600 } });
    const child = parent.createRegion({ x: 100, y: 100, width: 200, height: 150 });
    const handler = vi.fn();
    child.onPress(handler);
    parent.destroy();
    const event = makePointerEvent(150, 150);
    child.handlePointer('pointerdown', event);
    expect(handler).not.toHaveBeenCalled();
  });

  it('onDestroy callback fires during destroy', () => {
    const onDestroy = vi.fn();
    const sc = new SubCanvas({
      rootApp: mockApp(),
      bounds: { x: 0, y: 0, width: 400, height: 300 },
      onDestroy,
    });
    sc.destroy();
    expect(onDestroy).toHaveBeenCalledTimes(1);
  });

  it('setPosition is no-op after destroy', () => {
    const sc = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 400, height: 300 } });
    sc.destroy();
    sc.setPosition(100, 200);
    expect(sc.bounds.x).toBe(0);
    expect(sc.bounds.y).toBe(0);
  });

  it('child subRegions removed from parent on destroy', () => {
    const parent = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 800, height: 600 } });
    const child = parent.createRegion({ x: 100, y: 100, width: 200, height: 150 });
    expect(parent.getChildren()).toHaveLength(1);
    child.destroy();
    expect(parent.getChildren()).toHaveLength(0);
  });

  it('createRegion on destroyed parent returns valid sub but parent destroyed prevents proper cleanup', () => {
    const parent = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 800, height: 600 } });
    parent.destroy();
    const child = parent.createRegion({ x: 100, y: 100, width: 200, height: 150 });
    expect(child.destroyed).toBe(false);
    child.destroy();
    expect(child.destroyed).toBe(true);
  });
});
