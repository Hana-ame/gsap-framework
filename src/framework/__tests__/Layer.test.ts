import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('pixi.js', () => {
  let uidCounter = 0;

  function makeContainer() {
    const c = {
      uid: ++uidCounter,
      children: [] as unknown[],
      label: '',
      zIndex: 0,
      visible: true,
      alpha: 1,
      parent: null as (typeof c) | null,
      sortableChildren: false,
      addChild: vi.fn(function (this: typeof c, child: unknown) {
        (this.children as unknown[]).push(child);
        return child;
      }),
      removeChild: vi.fn(function (this: typeof c, child: unknown) {
        this.children = (this.children as unknown[]).filter((x) => x !== child);
        return child;
      }),
      removeChildren: vi.fn(function (this: typeof c) {
        const old = [...this.children];
        this.children = [];
        return old;
      }),
      destroy: vi.fn(function (this: typeof c, _opts?: unknown) {
        this.children = [];
        if (this.parent) {
          this.parent.removeChild(this);
        }
      }),
    };
    return c;
  }

  const Container = vi.fn(function () { return makeContainer(); } as unknown as new () => unknown);

  return { Container };
});

import { LayerManager } from '../Layer';

describe('LayerManager', () => {
  let parent: Record<string, unknown>;
  let lm: LayerManager;

  function makeParent() {
    return {
      children: [] as unknown[],
      sortableChildren: false,
      addChild: vi.fn(function (this: Record<string, unknown>, child: unknown) {
        (this.children as unknown[]).push(child);
        return child;
      }),
    };
  }

  beforeEach(() => {
    parent = makeParent();
    lm = new LayerManager(parent as never);
  });

  afterEach(() => {
    lm.destroy();
    vi.restoreAllMocks();
  });

  it('add creates a layer and adds container to parent', () => {
    const layer = lm.add('bg', 0);
    expect(layer.name).toBe('bg');
    expect(parent.addChild).toHaveBeenCalledWith(layer.container);
  });

  it('get retrieves a layer by name', () => {
    lm.add('bg', 0);
    const layer = lm.get('bg');
    expect(layer).toBeDefined();
    expect(layer!.name).toBe('bg');
  });

  it('get returns undefined for unknown name', () => {
    expect(lm.get('nonexistent')).toBeUndefined();
  });

  it('has returns true for existing layer', () => {
    lm.add('bg', 0);
    expect(lm.has('bg')).toBe(true);
  });

  it('has returns false for unknown layer', () => {
    expect(lm.has('nonexistent')).toBe(false);
  });

  it('names returns all layer names', () => {
    lm.add('bg', 0);
    lm.add('ui', 1);
    expect(lm.names()).toEqual(expect.arrayContaining(['bg', 'ui']));
  });

  it('remove destroys a layer and removes it', () => {
    lm.add('bg', 0);
    expect(lm.remove('bg')).toBe(true);
    expect(lm.has('bg')).toBe(false);
  });

  it('remove returns false for unknown layer', () => {
    expect(lm.remove('nonexistent')).toBe(false);
  });

  it('destroy cleans up all layers', () => {
    lm.add('a', 0);
    lm.add('b', 1);
    lm.destroy();
    expect(lm.destroyed).toBe(true);
    expect(lm.names()).toEqual([]);
  });

  it('destroy is idempotent', () => {
    lm.destroy();
    expect(() => lm.destroy()).not.toThrow();
  });

  it('add overwrites existing layer with warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    lm.add('dup', 0);
    lm.add('dup', 1);
    expect(warn).toHaveBeenCalledWith('[LayerManager] overwriting layer: "dup"');
    warn.mockRestore();
  });

  it('bringToFront increases zIndex above siblings', () => {
    lm.add('bottom', 0);
    lm.add('top', 1);
    const layer = lm.get('bottom')!;
    const oldZ = layer.container.zIndex;
    lm.bringToFront('bottom');
    expect(layer.container.zIndex).toBeGreaterThanOrEqual(oldZ + 1);
  });

  it('bringToFront on non-existent does not throw', () => {
    expect(() => lm.bringToFront('nonexistent')).not.toThrow();
  });

  it('sendToBack decreases zIndex below siblings', () => {
    lm.add('top', 10);
    lm.add('bottom', 5);
    const layer = lm.get('top')!;
    lm.sendToBack('top');
    expect(layer.container.zIndex).toBeLessThanOrEqual(4);
  });

  it('sendToBack on non-existent does not throw', () => {
    expect(() => lm.sendToBack('nonexistent')).not.toThrow();
  });

  it('parent getter returns parent container', () => {
    expect(lm.parent).toBe(parent);
  });

  describe('layer operations', () => {
    it('show sets visible to true', () => {
      const layer = lm.add('test', 0);
      layer.hide();
      layer.show();
      expect(layer.container.visible).toBe(true);
    });

    it('hide sets visible to false', () => {
      const layer = lm.add('test', 0);
      layer.hide();
      expect(layer.container.visible).toBe(false);
    });

    it('setAlpha changes container alpha', () => {
      const layer = lm.add('test', 0);
      layer.setAlpha(0.5);
      expect(layer.container.alpha).toBe(0.5);
    });

    it('alpha getter returns container alpha', () => {
      const layer = lm.add('test', 0);
      layer.container.alpha = 0.7;
      expect(layer.alpha).toBe(0.7);
    });

    it('addChild adds to layer container', () => {
      const layer = lm.add('test', 0);
      const child = { children: [] };
      layer.addChild(child as never);
      expect(layer.container.addChild).toHaveBeenCalledWith(child);
    });

    it('removeChild removes from layer container', () => {
      const layer = lm.add('test', 0);
      const child = { children: [] };
      layer.removeChild(child as never);
      expect(layer.container.removeChild).toHaveBeenCalledWith(child);
    });

    it('removeChildren delegates to container', () => {
      const layer = lm.add('test', 0);
      layer.removeChildren();
      expect(layer.container.removeChildren).toHaveBeenCalled();
    });

    it('destroy on layer is idempotent', () => {
      const layer = lm.add('test', 0);
      layer.destroy();
      expect(() => layer.destroy()).not.toThrow();
    });
  });
});
