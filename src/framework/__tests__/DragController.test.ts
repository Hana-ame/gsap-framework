import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DragController, DRAG_HANDLE_LABEL } from '../DragController';
import type { IRenderContainer } from '@framework/render/types';
import type { DragContext, DragOptions } from '../DragController';

function mockHandle(): IRenderContainer & { on: ReturnType<typeof vi.fn>; off: ReturnType<typeof vi.fn> } {
  return {
    label: DRAG_HANDLE_LABEL, zIndex: 0, alpha: 1, x: 0, y: 0, visible: true,
    eventMode: 'static', cursor: 'default',
    width: 50, height: 30,
    parent: null, children: [],
    addChild(c: any) { return c; },
    removeChild(c: any) { return c; },
    removeChildren() { return []; },
    getChildAt() { return null; },
    getChildByLabel() { return null; },
    destroy() {},
    on: vi.fn(() => {}),
    off: vi.fn(() => {}),
  };
}

function mockRoot(): IRenderContainer & { on: ReturnType<typeof vi.fn>; off: ReturnType<typeof vi.fn> } {
  return {
    label: 'root', zIndex: 0, alpha: 1, x: 0, y: 0, visible: true,
    eventMode: 'static', cursor: 'default',
    width: 800, height: 600,
    parent: null, children: [],
    addChild(c: any) { return c; },
    removeChild(c: any) { return c; },
    removeChildren() { return []; },
    getChildAt() { return null; },
    getChildByLabel() { return null; },
    destroy() {},
    on: vi.fn(() => {}),
    off: vi.fn(() => {}),
  };
}

function makeDragContext(overrides?: Partial<DragContext>): DragContext {
  return {
    getBounds: () => ({ x: 100, y: 100, width: 200, height: 150 }),
    globalBounds: () => ({ x: 100, y: 100, width: 200, height: 150 }),
    setPosition: vi.fn(),
    bringToFront: vi.fn(),
    rootStage: mockRoot(),
    stage: mockHandle(),
    ...overrides,
  } as DragContext;
}

function pointerEvent(clientX: number, clientY: number): PointerEvent {
  return { clientX, clientY, button: 0 } as PointerEvent;
}

describe('DragController', () => {
  let opts: DragOptions;
  let ctx: DragContext;

  beforeEach(() => {
    opts = {
      mode: 'title',
      tapThreshold: 4,
      dragBounds: undefined,
      bringToFront: true,
      onStart: vi.fn(),
      onDrag: vi.fn(),
      onEnd: vi.fn(),
    };
    ctx = makeDragContext();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('installHandle (IRenderContainer)', () => {
    it('installs event listeners on handle via duck-typing on/off', () => {
      const dc = new DragController(opts, ctx);
      const handle = mockHandle();

      dc.installHandle(handle);

      expect(handle.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      expect(handle.on).toHaveBeenCalledWith('removed', expect.any(Function));
      expect(ctx.rootStage.on).toHaveBeenCalledWith('pointermove', expect.any(Function));
      expect(ctx.rootStage.on).toHaveBeenCalledWith('pointerup', expect.any(Function));
      expect(dc.hasHandle(handle)).toBe(true);
    });

    it('does nothing when mode is not title', () => {
      opts.mode = 'none';
      const dc = new DragController(opts, ctx);
      const handle = mockHandle();

      dc.installHandle(handle);

      expect(handle.on).not.toHaveBeenCalled();
      expect(dc.hasHandle(handle)).toBe(false);
    });

    it('does nothing for duplicate install', () => {
      const dc = new DragController(opts, ctx);
      const handle = mockHandle();

      dc.installHandle(handle);
      dc.installHandle(handle);

      expect(handle.on).toHaveBeenCalledTimes(2);
    });

    it('uninstallHandle removes event listeners', () => {
      const dc = new DragController(opts, ctx);
      const handle = mockHandle();

      dc.installHandle(handle);
      dc.uninstallHandle(handle);

      expect(handle.off).toHaveBeenCalled();
      expect(dc.hasHandle(handle)).toBe(false);
    });

    it('uninstallHandle does nothing for non-installed handle', () => {
      const dc = new DragController(opts, ctx);
      const handle = mockHandle();

      expect(() => dc.uninstallHandle(handle)).not.toThrow();
    });
  });

  describe('interceptPointer (anywhere mode)', () => {
    beforeEach(() => {
      opts.mode = 'anywhere';
    });

    it('pointerdown starts tracking', () => {
      const dc = new DragController(opts, ctx);
      const result = dc.interceptPointer('pointerdown', pointerEvent(200, 150));

      expect(result).toBe(false);
      expect(dc.isDragging).toBe(false);
    });

    it('pointermove starts drag after threshold', () => {
      const dc = new DragController(opts, ctx);
      dc.interceptPointer('pointerdown', pointerEvent(100, 100));

      const result = dc.interceptPointer('pointermove', pointerEvent(110, 100));

      expect(result).toBe(true);
      expect(dc.isDragging).toBe(true);
      expect(opts.onStart).toHaveBeenCalled();
    });

    it('pointermove before threshold does not start drag', () => {
      const dc = new DragController(opts, ctx);
      dc.interceptPointer('pointerdown', pointerEvent(100, 100));

      const result = dc.interceptPointer('pointermove', pointerEvent(101, 100));

      expect(result).toBe(false);
      expect(dc.isDragging).toBe(false);
    });

    it('pointerup ends drag and calls onEnd', () => {
      const dc = new DragController(opts, ctx);
      dc.interceptPointer('pointerdown', pointerEvent(100, 100));
      dc.interceptPointer('pointermove', pointerEvent(120, 100));

      const result = dc.interceptPointer('pointerup', pointerEvent(120, 100));

      expect(result).toBe(false);
      expect(dc.isDragging).toBe(false);
    });

    it('returns false for unknown pointer types', () => {
      const dc = new DragController(opts, ctx);
      const result = dc.interceptPointer('tap' as any, pointerEvent(0, 0));

      expect(result).toBe(false);
    });
  });

  describe('destroy', () => {
    it('destroys window listeners and handle listeners', () => {
      const dc = new DragController(opts, ctx);
      const handle = mockHandle();
      dc.installHandle(handle);

      dc.destroy();

      expect(dc.isDragging).toBe(false);
      expect(dc.hasHandle(handle)).toBe(false);
    });
  });
});
