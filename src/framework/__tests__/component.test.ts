import { describe, it, expect, vi } from 'vitest';
import {
  registerComponent,
  createComponent,
  _getComponentFactory,
  _registeredTypes,
} from '../component';

function dummy(opts: any = {}) {
  return {
    type: opts.type ?? 'dummy',
    stage: {} as any,
    destroy() {},
    get destroyed() { return false; },
  };
}

describe('component registry', () => {
  it('_registeredTypes starts empty', () => {
    expect(_registeredTypes()).toEqual([]);
  });

  it('registerComponent adds a type', () => {
    registerComponent('a', dummy);
    expect(_registeredTypes()).toContain('a');
  });

  it('_getComponentFactory returns the factory', () => {
    const factory = () => dummy({ type: 'b' });
    registerComponent('b', factory);
    expect(_getComponentFactory('b')).toBe(factory);
  });

  it('_getComponentFactory returns undefined for unknown type', () => {
    expect(_getComponentFactory('nonexistent')).toBeUndefined();
  });

  it('createComponent calls the factory and returns the component', () => {
    registerComponent('c', () => dummy({ type: 'c' }));
    const result = createComponent('c', { parent: {} as any, width: 100, height: 100 });
    expect(result.type).toBe('c');
  });

  it('createComponent throws for unknown type', () => {
    expect(() => createComponent('unknown', {} as any)).toThrow('unknown');
  });

  it('registerComponent warns on override', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerComponent('dup', () => dummy({ type: 'x' }));
    registerComponent('dup', () => dummy({ type: 'y' }));
    expect(warn).toHaveBeenCalledWith('[component] overriding registered type: "dup"');
    warn.mockRestore();
  });

  it('passes opts to factory', () => {
    const factory = vi.fn(() => dummy({ type: 'e' }));
    registerComponent('e', factory);
    const opts = { parent: {} as any, width: 300, height: 200, x: 10, y: 20 };
    createComponent('e', opts);
    expect(factory).toHaveBeenCalledWith(opts);
  });
});
