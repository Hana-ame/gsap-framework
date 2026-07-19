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
      expect(typeof comp).toBe('function');
      expect((comp as ComponentType & { head?: unknown }).head).toBeDefined();
    }
  });

  it('exampleMap contains only registered EXAMPLES keys', () => {
    const mapKeys = Object.keys(exampleMap).sort();
    const exampleKeys = [...EXAMPLES].sort();
    expect(mapKeys).toEqual(exampleKeys);
  });

  it('component-single-window is registered', () => {
    expect(EXAMPLES).toContain('component-single-window');
    expect(exampleMap['component-single-window']).toBeDefined();
  });

  it('has correct head metadata', async () => {
    const mod = await import('../component-single-window/ComponentSingleWindowDisplay');
    expect(mod.ComponentSingleWindowDisplay.head).toBeDefined();
    expect(mod.ComponentSingleWindowDisplay.head.title).toContain('Single Window');
    expect(mod.ComponentSingleWindowDisplay.head.description).toContain('draggable');
  });

  it('isExample returns true for valid examples', () => {
    expect(isExample('single')).toBe(true);
    expect(isExample('component-single-window')).toBe(true);
    expect(isExample('multiple')).toBe(true);
    expect(isExample('window')).toBe(true);
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
