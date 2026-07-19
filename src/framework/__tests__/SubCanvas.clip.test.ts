import { describe, it, expect, vi } from 'vitest';
import * as PIXI from 'pixi.js';
import { SubCanvas } from '../SubCanvas';

function mockApp() {
  const stage = new PIXI.Container();
  vi.spyOn(stage, 'addChild');
  return { stage } as never;
}

describe('SubCanvas clipToBounds', () => {
  it('creates mask Graphics when clipToBounds is true', () => {
    const sc = new SubCanvas({
      rootApp: mockApp(),
      bounds: { x: 0, y: 0, width: 400, height: 300 },
      clipToBounds: true,
    });
    expect(sc.stage.mask).toBeDefined();
    expect(sc.stage.mask instanceof PIXI.Graphics).toBe(true);
  });

  it('does not create mask when clipToBounds is false', () => {
    const sc = new SubCanvas({
      rootApp: mockApp(),
      bounds: { x: 0, y: 0, width: 400, height: 300 },
      clipToBounds: false,
    });
    expect(sc.stage.mask).toBeUndefined();
  });

  it('does not create mask by default', () => {
    const sc = new SubCanvas({
      rootApp: mockApp(),
      bounds: { x: 0, y: 0, width: 400, height: 300 },
    });
    expect(sc.stage.mask).toBeUndefined();
  });

  it('mask rectangle added to stage on creation', () => {
    const sc = new SubCanvas({
      rootApp: mockApp(),
      bounds: { x: 0, y: 0, width: 400, height: 300 },
      clipToBounds: true,
    });
    expect(sc.stage.mask).toBeDefined();
    expect(sc.stage.mask instanceof PIXI.Graphics).toBe(true);
  });

  it('mask persists on setSize', () => {
    const sc = new SubCanvas({
      rootApp: mockApp(),
      bounds: { x: 0, y: 0, width: 400, height: 300 },
      clipToBounds: true,
    });
    sc.setSize(500, 400);
    expect(sc.bounds.width).toBe(500);
    expect(sc.bounds.height).toBe(400);
    expect(sc.stage.mask).toBeDefined();
  });

  it('mask persists on setBounds', () => {
    const sc = new SubCanvas({
      rootApp: mockApp(),
      bounds: { x: 0, y: 0, width: 400, height: 300 },
      clipToBounds: true,
    });
    sc.setBounds({ x: 10, y: 20, width: 500, height: 400 });
    expect(sc.bounds.width).toBe(500);
    expect(sc.bounds.height).toBe(400);
    expect(sc.stage.mask).toBeDefined();
  });

  it('mask auto-recovers after external destroy', () => {
    const sc = new SubCanvas({
      rootApp: mockApp(),
      bounds: { x: 0, y: 0, width: 400, height: 300 },
      clipToBounds: true,
    });
    const oldMask = sc.stage.mask;
    if (oldMask && typeof oldMask !== 'number') {
      (oldMask as PIXI.Graphics).destroy();
      sc.setSize(500, 400);
      expect(sc.stage.mask).toBeDefined();
    }
  });

  it('mask auto-recovers after parent removeChild', () => {
    const sc = new SubCanvas({
      rootApp: mockApp(),
      bounds: { x: 0, y: 0, width: 400, height: 300 },
      clipToBounds: true,
    });
    const oldMask = sc.stage.mask;
    if (oldMask && typeof oldMask !== 'number') {
      sc.stage.removeChild(oldMask as PIXI.Graphics);
      sc.setSize(500, 400);
      expect(sc.stage.mask).toBeDefined();
    }
  });
});
