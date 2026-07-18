import { describe, it, expect } from 'vitest';

describe('component registry', () => {
  it('has registered expected types', async () => {
    await import('../../register-components');
    const { registeredTypes } = await import('../../component');
    const types = registeredTypes().sort();
    expect(types).toEqual(['confirm', 'scrollable', 'window']);
  });

  it('getComponentFactory returns factory for each type', async () => {
    await import('../../register-components');
    const { getComponentFactory } = await import('../../component');
    for (const type of ['window', 'confirm', 'scrollable']) {
      const factory = getComponentFactory(type);
      expect(factory).toBeDefined();
      expect(typeof factory).toBe('function');
    }
  });

  it('getComponentFactory returns undefined for unknown type', async () => {
    await import('../../register-components');
    const { getComponentFactory } = await import('../../component');
    expect(getComponentFactory('nonexistent')).toBeUndefined();
  });

  it('createComponent throws for unknown type', async () => {
    await import('../../register-components');
    const { createComponent } = await import('../../component');
    expect(() => createComponent('nonexistent', {} as never)).toThrow('unknown type');
  });
});
