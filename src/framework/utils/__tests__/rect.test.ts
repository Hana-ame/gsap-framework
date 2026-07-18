import { describe, it, expect } from 'vitest';
import {
  rectContains,
  rectIntersects,
  rectCenter,
  rectExpand,
  rectShrink,
  rectFit,
  rectClamp,
  rectSnap,
} from '../rect';

describe('rectContains', () => {
  const r = { x: 10, y: 20, width: 100, height: 50 };
  it('returns true for point inside', () => {
    expect(rectContains(r, 50, 40)).toBe(true);
  });
  it('returns false for point outside (left)', () => {
    expect(rectContains(r, 5, 40)).toBe(false);
  });
  it('returns false for point outside (below)', () => {
    expect(rectContains(r, 50, 80)).toBe(false);
  });
  it('handles inclusive left edge', () => {
    expect(rectContains(r, 10, 20)).toBe(true);
  });
  it('handles exclusive right edge', () => {
    expect(rectContains(r, 110, 40)).toBe(false);
  });
});

describe('rectIntersects', () => {
  it('detects overlapping rects', () => {
    expect(
      rectIntersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 }),
    ).toBe(true);
  });
  it('detects non-overlapping rects', () => {
    expect(
      rectIntersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 10, height: 10 }),
    ).toBe(false);
  });
  it('detects touching edge as non-overlap', () => {
    expect(
      rectIntersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 }),
    ).toBe(false);
  });
});

describe('rectCenter', () => {
  it('returns center coordinates', () => {
    expect(rectCenter({ x: 10, y: 20, width: 100, height: 50 })).toEqual({ x: 60, y: 45 });
  });
});

describe('rectExpand', () => {
  it('expands equally on all sides', () => {
    expect(rectExpand({ x: 10, y: 20, width: 100, height: 50 }, 5)).toEqual({
      x: 5,
      y: 15,
      width: 110,
      height: 60,
    });
  });
});

describe('rectShrink', () => {
  it('shrinks equally on all sides', () => {
    expect(rectShrink({ x: 10, y: 20, width: 100, height: 50 }, 5)).toEqual({
      x: 15,
      y: 25,
      width: 90,
      height: 40,
    });
  });
  it('clamps to zero width/height', () => {
    const result = rectShrink({ x: 0, y: 0, width: 10, height: 10 }, 100);
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
  });
});

describe('rectFit', () => {
  it('fits 16:9 into 4:3 with black bars (contain)', () => {
    const outer = { x: 0, y: 0, width: 400, height: 300 };
    const result = rectFit(outer, 160, 90);
    expect(result.width).toBeCloseTo(400);
    expect(result.height).toBeCloseTo(225);
    expect(result.x).toBe(0);
    expect(result.y).toBeCloseTo(37.5);
  });
  it('covers 4:3 with 16:9 content (cover mode)', () => {
    const outer = { x: 0, y: 0, width: 400, height: 300 };
    const result = rectFit(outer, 160, 90, false);
    expect(result.width).toBeCloseTo(533.33, 1);
    expect(result.height).toBeCloseTo(300);
  });
});

describe('rectClamp', () => {
  it('keeps child within parent', () => {
    const parent = { x: 0, y: 0, width: 100, height: 100 };
    const child = { x: -20, y: 50, width: 50, height: 30 };
    const result = rectClamp(child, parent);
    expect(result.x).toBe(0);
    expect(result.y).toBe(50);
  });
  it('leaves child that fits', () => {
    const parent = { x: 0, y: 0, width: 100, height: 100 };
    const child = { x: 10, y: 10, width: 50, height: 50 };
    expect(rectClamp(child, parent)).toEqual(child);
  });
});

describe('rectSnap', () => {
  it('snaps to grid', () => {
    expect(rectSnap({ x: 17, y: 33, width: 104, height: 58 }, 10)).toEqual({
      x: 20,
      y: 30,
      width: 100,
      height: 60,
    });
  });
});
