import { describe, it, expect } from 'vitest';
import { EXAMPLES, isExample, exampleMap, DEFAULT_EXAMPLE } from '../examples';
import type { ComponentType } from 'react';

describe('examples registry', () => {
  it('has a default example', () => {
    expect(DEFAULT_EXAMPLE).toBeDefined();
    expect(isExample(DEFAULT_EXAMPLE)).toBe(true);
  });

  it('all EXAMPLES entries map to valid components', () => {
    for (const ex of EXAMPLES) {
      const comp = exampleMap[ex];
      expect(comp).toBeDefined();
      // 组件现已 React.lazy（LazyExoticComponent，对象形态，含 lazy 标记）
      const lazy = comp as { $$typeof?: symbol };
      expect(!!lazy.$$typeof).toBe(true);
    }
  });

  it('exampleMap contains only registered EXAMPLES keys', () => {
    const mapKeys = Object.keys(exampleMap).sort();
    const exampleKeys = [...EXAMPLES].sort();
    expect(mapKeys).toEqual(exampleKeys);
  });

  it('component-vn is registered', () => {
    expect(EXAMPLES).toContain('component-vn');
    expect(exampleMap['component-vn']).toBeDefined();
  });

  it('has correct head metadata', async () => {
    const mod = await import('../component-vn/ComponentVnDisplay');
    expect(mod.ComponentVnDisplay.head).toBeDefined();
    expect(mod.ComponentVnDisplay.head.title).toContain('VN');
    expect(mod.ComponentVnDisplay.head.description).toContain('ex.moonchan');
  });

  it('isExample returns true for valid examples', () => {
    expect(isExample('component-vn')).toBe(true);
    const anyH = EXAMPLES.find((e) => e.startsWith('hscene-'));
    expect(anyH).toBeDefined();
    expect(isExample(anyH!)).toBe(true);
  });

  it('isExample returns false for invalid examples', () => {
    expect(isExample('invalid-route')).toBe(false);
    expect(isExample('')).toBe(false);
    expect(isExample('nonexistent')).toBe(false);
  });

  it('DEFAULT_EXAMPLE resolves in exampleMap', () => {
    expect(exampleMap[DEFAULT_EXAMPLE]).toBeDefined();
  });
});

describe('examples count consistency', () => {
  it('EXAMPLES array and exampleMap have same length', () => {
    expect(EXAMPLES.length).toBe(Object.keys(exampleMap).length);
  });

  it('every example has a unique route', () => {
    const unique = new Set(EXAMPLES);
    expect(unique.size).toBe(EXAMPLES.length);
  });
});
