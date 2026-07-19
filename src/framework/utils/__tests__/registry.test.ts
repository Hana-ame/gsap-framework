import { describe, it, expect } from 'vitest';

describe('component registry', () => {
  it('has registered expected types', async () => {
    await import('../../register-components');
    const { _registeredTypes } = await import('../../component');
    const types = _registeredTypes().sort();
    expect(types).toEqual(['confirm', 'scrollable', 'window']);
  });

  it('_getComponentFactory returns factory for each type', async () => {
    await import('../../register-components');
    const { _getComponentFactory } = await import('../../component');
    for (const type of ['window', 'confirm', 'scrollable']) {
      const factory = _getComponentFactory(type);
      expect(factory).toBeDefined();
      expect(typeof factory).toBe('function');
    }
  });

  it('_getComponentFactory returns undefined for unknown type', async () => {
    await import('../../register-components');
    const { _getComponentFactory } = await import('../../component');
    expect(_getComponentFactory('nonexistent')).toBeUndefined();
  });

  it('createComponent throws for unknown type', async () => {
    await import('../../register-components');
    const { createComponent } = await import('../../component');
    expect(() => createComponent('nonexistent', {} as never)).toThrow('unknown type');
  });
});
