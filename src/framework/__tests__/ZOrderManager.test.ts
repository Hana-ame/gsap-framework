import { describe, it, expect, vi } from 'vitest';
import { bringToFront, sendToBack, renormZIndices } from '../ZOrderManager';
import type { IRenderContainer } from '@framework/render/types';

function makeContainer(overrides?: Partial<IRenderContainer>): IRenderContainer {
  const children: IRenderContainer[] = [];
  const self: IRenderContainer = {
    alpha: 1, x: 0, y: 0, visible: true,
    eventMode: 'none', cursor: 'default',
    width: 100, height: 100, zIndex: 0, label: '',
    parent: null,
    children,
    addChild(c: any) { children.push(c); return c; },
    removeChild(c: any) { const i = children.indexOf(c); if (i >= 0) children.splice(i, 1); return c; },
    removeChildren() { const all = [...children]; children.length = 0; return all; },
    getChildAt(i: number) { return children[i] ?? null; },
    getChildByLabel(l: string) { return children.find(c => c.label === l) ?? null; },
    destroy() {},
    ...overrides,
  };
  children.forEach(c => { (c as any).parent = self; });
  return self;
}

describe('ZOrderManager', () => {
  describe('bringToFront', () => {
    it('assigns highest zIndex + 1', () => {
      const parent = makeContainer();
      const a = makeContainer({ parent, zIndex: 10 });
      const b = makeContainer({ parent, zIndex: 20 });
      parent.children.push(a, b);

      bringToFront(a);
      expect(a.zIndex).toBeGreaterThan(b.zIndex);
      expect(a.zIndex).toBe(21);
    });

    it('sets sortableChildren on parent via duck-typing', () => {
      const parent = makeContainer() as any;
      const child = makeContainer({ parent });
      parent.children.push(child);

      bringToFront(child);
      expect(parent.sortableChildren).toBe(true);
    });

    it('does nothing when stage has no parent', () => {
      const orphan = makeContainer();
      expect(() => bringToFront(orphan)).not.toThrow();
    });
  });

  describe('sendToBack', () => {
    it('assigns lowest zIndex - 1', () => {
      const parent = makeContainer();
      const a = makeContainer({ parent, zIndex: 10 });
      const b = makeContainer({ parent, zIndex: 20 });
      parent.children.push(a, b);

      sendToBack(b);
      expect(b.zIndex).toBeLessThan(a.zIndex);
      expect(b.zIndex).toBe(9);
    });

    it('does nothing when stage has no parent', () => {
      const orphan = makeContainer();
      expect(() => sendToBack(orphan)).not.toThrow();
    });
  });

  describe('renormZIndices', () => {
    it('does nothing for fewer than 2 children', () => {
      const parent = makeContainer();
      const a = makeContainer({ parent, zIndex: 999999 });
      parent.children.push(a);

      renormZIndices(parent);
      expect(a.zIndex).toBe(999999);
    });

    it('renormalizes when max zIndex >= threshold', () => {
      const parent = makeContainer();
      const a = makeContainer({ parent, zIndex: 0 });
      const b = makeContainer({ parent, zIndex: 1_000_000 });
      parent.children.push(a, b);

      renormZIndices(parent);
      expect(a.zIndex).toBe(0);
      expect(b.zIndex).toBe(1);
    });

    it('does nothing when max zIndex < threshold', () => {
      const parent = makeContainer();
      const a = makeContainer({ parent, zIndex: 5 });
      const b = makeContainer({ parent, zIndex: 999999 });
      parent.children.push(a, b);

      renormZIndices(parent);
      expect(a.zIndex).toBe(5);
      expect(b.zIndex).toBe(999999);
    });
  });
});
