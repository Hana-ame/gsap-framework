import { describe, it, expect, vi } from 'vitest';
import * as PIXI from 'pixi.js';
import { SubCanvas } from '../SubCanvas';

function mockApp() {
  const stage = new PIXI.Container();
  return {
    stage,
    canvas: document.createElement('canvas'),
    ticker: { add: vi.fn(), remove: vi.fn() },
    renderer: { resize: vi.fn(), render: vi.fn() },
  } as never;
}

describe('SubCanvas property delegates', () => {
  it('ticker returns rootApp.ticker', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    expect(sc.ticker).toBe(app.ticker);
  });

  it('renderer returns rootApp.renderer', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    expect(sc.renderer).toBe(app.renderer);
  });

  it('canvas returns rootApp.canvas', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    expect(sc.canvas).toBe(app.canvas);
  });

  it('onLeave registers and fires pointerleave handler', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    const handler = vi.fn();
    sc.onLeave(handler);
    const event = { clientX: 200, clientY: 150 } as PointerEvent;
    sc.handlePointer('pointerleave', event);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'pointerleave', x: 200, y: 150 }),
    );
  });

  it('pointerleave clears press state (prevents stale tap)', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    const handler = vi.fn();
    sc.onTap(handler);
    sc.handlePointer('pointerdown', { clientX: 100, clientY: 100 } as PointerEvent);
    sc.handlePointer('pointerleave', { clientX: 100, clientY: 100 } as PointerEvent);
    sc.handlePointer('pointerup', { clientX: 100, clientY: 100 } as PointerEvent);
    expect(handler).not.toHaveBeenCalled();
  });

  it('getChildAt delegates to stage', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    const child = new PIXI.Container();
    sc.stage.addChild(child);
    expect(sc.getChildAt(0)).toBe(child);
  });

  it('getChildByLabel returns matching child', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    const child = new PIXI.Container();
    child.label = 'my-label';
    sc.stage.addChild(child);
    expect(sc.getChildByLabel('my-label')).toBe(child);
  });

  it('getChildByLabel returns null when no match', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    expect(sc.getChildByLabel('nothing')).toBeNull();
  });

  it('position returns stage.position', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    expect(sc.position).toBe(sc.stage.position);
  });

  it('scale returns stage.scale', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    expect(sc.scale).toBe(sc.stage.scale);
  });

  it('pivot returns stage.pivot', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    expect(sc.pivot).toBe(sc.stage.pivot);
  });

  it('alpha get/set delegates to stage', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    sc.alpha = 0.5;
    expect(sc.stage.alpha).toBe(0.5);
    expect(sc.alpha).toBe(0.5);
  });

  it('visible get/set delegates to stage', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    sc.visible = false;
    expect(sc.stage.visible).toBe(false);
    expect(sc.visible).toBe(false);
  });

  it('rotation get/set delegates to stage', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    sc.rotation = 1.5;
    expect(sc.stage.rotation).toBe(1.5);
    expect(sc.rotation).toBe(1.5);
  });

  it('angle get/set delegates to stage', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    sc.angle = 90;
    expect(sc.stage.angle).toBe(90);
    expect(sc.angle).toBe(90);
  });

  it('tint get/set delegates to stage', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    sc.tint = 0xff0000;
    expect(sc.stage.tint).toBe(0xff0000);
    expect(sc.tint).toBe(0xff0000);
  });

  it('eventMode get/set delegates to stage', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    sc.eventMode = 'static';
    expect(sc.stage.eventMode).toBe('static');
    expect(sc.eventMode).toBe('static');
  });

  it('label get/set delegates to stage', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    sc.label = 'my-canvas';
    expect(sc.stage.label).toBe('my-canvas');
    expect(sc.label).toBe('my-canvas');
  });

  it('x returns stage.x', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    sc.stage.x = 123;
    expect(sc.x).toBe(123);
  });

  it('y returns stage.y', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    sc.stage.y = 456;
    expect(sc.y).toBe(456);
  });

  it('subRegions returns children list', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    const child = sc.createRegion({ x: 10, y: 10, width: 100, height: 100 });
    expect(sc.subRegions).toHaveLength(1);
    expect(sc.subRegions[0]).toBe(child);
  });

  it('createSubRegion (deprecated) calls createRegion', () => {
    const app = mockApp();
    const sc = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 400, height: 300 } });
    const region = sc.createSubRegion({ x: 5, y: 5, width: 50, height: 50 });
    expect(region).toBeDefined();
    expect(region.bounds.x).toBe(5);
    expect(region.bounds.y).toBe(5);
    expect(sc.subRegions).toHaveLength(1);
  });
});
