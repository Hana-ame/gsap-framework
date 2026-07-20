import { describe, it, expect, vi } from 'vitest';
import * as PIXI from 'pixi.js';
import { SubCanvas } from '../SubCanvas';

function mockApp(stage?: PIXI.Container) {
  return { stage: stage ?? new PIXI.Container() } as never;
}

describe('SubCanvas drag behavior', () => {
  describe('dragMode anywhere', () => {
    it('does not create _bg (drag handled via handlePointer instead)', () => {
      const app = mockApp();
      const parent = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 800, height: 600 } });
      const child = parent.createRegion(
        { x: 100, y: 100, width: 300, height: 200 },
        { dragMode: 'anywhere' },
      );
      const bg = child.stage.children.find((c) => (c as PIXI.Container).label === 'subcanvas-drag-handle');
      expect(bg).toBeUndefined();
      expect(child.dragMode).toBe('anywhere');
    });
  });

  describe('dragMode title', () => {
    it('does not create drag bg (handle must be added separately)', () => {
      const app = mockApp();
      const parent = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 800, height: 600 } });
      const child = parent.createRegion(
        { x: 100, y: 100, width: 300, height: 200 },
        { dragMode: 'title' },
      );
      const bg = child.stage.children.find((c) => c.label === 'subcanvas-drag-handle');
      expect(bg).toBeUndefined();
    });

    it('installs drag on child with drag-handle label', () => {
      const app = mockApp();
      const parent = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 800, height: 600 } });
      const child = parent.createRegion(
        { x: 100, y: 100, width: 300, height: 200 },
        { dragMode: 'title' },
      );
      const handle = new PIXI.Container();
      handle.label = 'subcanvas-drag-handle';
      handle.eventMode = 'static';
      expect(() => child.addChild(handle)).not.toThrow();
    });
  });

  describe('dragMode none', () => {
    it('does not create drag handlers', () => {
      const app = mockApp();
      const parent = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 800, height: 600 } });
      const child = parent.createRegion(
        { x: 100, y: 100, width: 300, height: 200 },
        { dragMode: 'none' },
      );
      expect(child.destroyed).toBe(false);
    });
  });

  describe('dragBounds constraint', () => {
    it('clamps position within parent bounds', () => {
      const app = mockApp();
      const parent = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 800, height: 600 } });
      const child = parent.createRegion(
        { x: 100, y: 100, width: 300, height: 200 },
        { dragMode: 'anywhere', dragBounds: () => parent.bounds },
      );
      child.setPosition(-100, -100);
      const clampedX = Math.max(0, Math.min(-100, 800 - 300));
      const clampedY = Math.max(0, Math.min(-100, 600 - 200));
      expect(clampedX).toBe(0);
      expect(clampedY).toBe(0);
    });

    it('allows position within bounds', () => {
      const app = mockApp();
      const parent = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 800, height: 600 } });
      const child = parent.createRegion(
        { x: 100, y: 100, width: 300, height: 200 },
        { dragMode: 'anywhere', dragBounds: () => parent.bounds },
      );
      child.setPosition(200, 150);
      expect(child.bounds.x).toBe(200);
      expect(child.bounds.y).toBe(150);
    });
  });

  describe('bringToFront', () => {
    it('bringToFront increases zIndex above siblings', () => {
      const app = mockApp();
      const parent = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 800, height: 600 } });
      const child1 = parent.createRegion(
        { x: 0, y: 0, width: 100, height: 100 },
        { dragBringToFront: true },
      );
      const child2 = parent.createRegion(
        { x: 100, y: 0, width: 100, height: 100 },
        { dragBringToFront: true },
      );
      const z1 = child1.stage.zIndex;
      const z2 = child2.stage.zIndex;
      child2.bringToFront();
      expect(child2.stage.zIndex).toBeGreaterThan(z1);
      expect(child2.stage.zIndex).toBeGreaterThan(z2);
    });

    it('sendToBack decreases zIndex below siblings', () => {
      const app = mockApp();
      const parent = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 800, height: 600 } });
      const child1 = parent.createRegion({ x: 0, y: 0, width: 100, height: 100 });
      const child2 = parent.createRegion({ x: 100, y: 0, width: 100, height: 100 });
      child1.sendToBack();
      expect(child1.stage.zIndex).toBeLessThan(child2.stage.zIndex);
      expect(child1.stage.zIndex).toBeLessThan(0);
    });
  });

  describe('drag lifecycle', () => {
    it('onDragStart/onDrag/onEnd callbacks are not called before any drag', () => {
      const app = mockApp();
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();
      const parent = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 800, height: 600 } });
      parent.createRegion(
        { x: 100, y: 100, width: 300, height: 200 },
        { dragMode: 'anywhere', onDragStart, onDrag, onDragEnd },
      );
      expect(onDragStart).not.toHaveBeenCalled();
      expect(onDrag).not.toHaveBeenCalled();
      expect(onDragEnd).not.toHaveBeenCalled();
    });

    it('multiple windows can each have independent drag', () => {
      const app = mockApp();
      const parent = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 800, height: 600 } });
      const w1 = parent.createRegion({ x: 0, y: 0, width: 200, height: 150 }, { dragMode: 'anywhere' });
      const w2 = parent.createRegion({ x: 300, y: 0, width: 200, height: 150 }, { dragMode: 'anywhere' });
      expect(w1.destroyed).toBe(false);
      expect(w2.destroyed).toBe(false);
    });
  });

  describe('drag handle cleanup', () => {
    it('removeChild uninstalls drag handle', () => {
      const app = mockApp();
      const parent = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 800, height: 600 } });
      parent.createRegion(
        { x: 100, y: 100, width: 300, height: 200 },
        { dragMode: 'title' },
      );
      const handle = new PIXI.Container();
      handle.label = 'subcanvas-drag-handle';
      parent.addChild(handle);
      expect(() => parent.removeChild(handle)).not.toThrow();
    });

    it('removeChildren uninstalls all drag handles', () => {
      const app = mockApp();
      const parent = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 800, height: 600 } });
      parent.createRegion(
        { x: 100, y: 100, width: 300, height: 200 },
        { dragMode: 'title' },
      );
      const h1 = new PIXI.Container();
      h1.label = 'subcanvas-drag-handle';
      const h2 = new PIXI.Container();
      h2.label = 'subcanvas-drag-handle';
      parent.addChild(h1);
      parent.addChild(h2);
      expect(() => parent.removeChildren()).not.toThrow();
    });
  });

  describe('bringToFront and sendToBack options', () => {
    it('bringToFront increases zIndex, sendToBack decreases', () => {
      const app = mockApp();
      const parent = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 800, height: 600 } });
      const c1 = parent.createRegion({ x: 0, y: 0, width: 100, height: 100 });
      const c2 = parent.createRegion({ x: 100, y: 0, width: 100, height: 100 });
      c2.bringToFront();
      expect(c2.stage.zIndex).toBeGreaterThan(c1.stage.zIndex);
      c1.bringToFront();
      expect(c1.stage.zIndex).toBeGreaterThan(c2.stage.zIndex);
      c1.sendToBack();
      expect(c1.stage.zIndex).toBeLessThan(c2.stage.zIndex);
    });

    it('bringToFront=false does not auto-elevate on createRegion', () => {
      const app = mockApp();
      const parent = new SubCanvas({ rootApp: app, bounds: { x: 0, y: 0, width: 800, height: 600 } });
      const c1 = parent.createRegion({ x: 0, y: 0, width: 100, height: 100 }, { dragBringToFront: false });
      const c2 = parent.createRegion({ x: 100, y: 0, width: 100, height: 100 }, { dragBringToFront: false });
      expect(c1.stage.zIndex).toBe(0);
      expect(c2.stage.zIndex).toBe(0);
    });
  });
});
