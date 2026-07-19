import { describe, it, expect } from 'vitest';
import {
  clamp,
  lerp,
  invLerp,
  mapRange,
  degToRad,
  radToDeg,
  distance,
  distanceSq,
  normalizeAngle,
  snapToGrid,
  randomInt,
  randomFloat,
} from '../math';

describe('clamp', () => {
  it('clamps value below min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });
  it('clamps value above max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
  it('keeps value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it('handles edge values', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('lerp', () => {
  it('returns a at t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });
  it('returns b at t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });
  it('returns midpoint at t=0.5', () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
  });
  it('extrapolates beyond range', () => {
    expect(lerp(10, 20, 2)).toBe(30);
  });
});

describe('invLerp', () => {
  it('returns 0 for value equal to a', () => {
    expect(invLerp(10, 20, 10)).toBe(0);
  });
  it('returns 1 for value equal to b', () => {
    expect(invLerp(10, 20, 20)).toBe(1);
  });
  it('returns 0.5 for midpoint', () => {
    expect(invLerp(10, 20, 15)).toBe(0.5);
  });
  it('returns 0 when a equals b', () => {
    expect(invLerp(5, 5, 10)).toBe(0);
  });
});

describe('mapRange', () => {
  it('maps value from one range to another', () => {
    expect(mapRange(0.5, 0, 1, 0, 100)).toBe(50);
  });
  it('handles inverse ranges', () => {
    expect(mapRange(50, 0, 100, 100, 0)).toBe(50);
  });
  it('maps negative ranges', () => {
    expect(mapRange(0, -100, 100, 0, 100)).toBe(50);
  });
});

describe('degToRad / radToDeg', () => {
  it('converts 180 degrees to PI', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI);
  });
  it('converts PI to 180 degrees', () => {
    expect(radToDeg(Math.PI)).toBeCloseTo(180);
  });
  it('converts 0 degrees to 0', () => {
    expect(degToRad(0)).toBe(0);
  });
  it('converts 360 degrees to 2*PI', () => {
    expect(degToRad(360)).toBeCloseTo(Math.PI * 2);
  });
});

describe('distance / distanceSq', () => {
  it('calculates distance between two points', () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
  });
  it('returns 0 for same point', () => {
    expect(distance(5, 5, 5, 5)).toBe(0);
  });
  it('squared distance is always >= distance', () => {
    expect(distanceSq(0, 0, 3, 4)).toBe(25);
  });
});

describe('normalizeAngle', () => {
  it('keeps angles within [0, 2*PI)', () => {
    const result = normalizeAngle(Math.PI * 3);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(Math.PI * 2);
  });
  it('normalizes negative angles', () => {
    expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo((Math.PI * 3) / 2);
  });
});

describe('snapToGrid', () => {
  it('snaps to nearest grid point', () => {
    expect(snapToGrid(17, 10)).toBe(20);
  });
  it('handles exact grid points', () => {
    expect(snapToGrid(20, 10)).toBe(20);
  });
});

describe('randomInt', () => {
  it('returns values within range', () => {
    for (let i = 0; i < 100; i++) {
      const v = randomInt(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });
  it('handles single value range', () => {
    expect(randomInt(5, 5)).toBe(5);
  });
});

describe('randomFloat', () => {
  it('returns values within range', () => {
    for (let i = 0; i < 100; i++) {
      const v = randomFloat(1.5, 3.5);
      expect(v).toBeGreaterThanOrEqual(1.5);
      expect(v).toBeLessThanOrEqual(3.5);
    }
  });
  it('returns a float (not integer)', () => {
    const vals = Array.from({ length: 50 }, () => randomFloat(0, 1));
    const hasFractional = vals.some(v => v !== Math.floor(v) && v !== Math.ceil(v));
    expect(hasFractional).toBe(true);
  });
  it('handles min equal to max', () => {
    expect(randomFloat(5, 5)).toBe(5);
  });
  it('handles negative ranges', () => {
    const v = randomFloat(-10, -5);
    expect(v).toBeGreaterThanOrEqual(-10);
    expect(v).toBeLessThanOrEqual(-5);
  });
});
