import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../components/PixiWindow', () => ({
  createWindow: vi.fn(() => {
    let destroyed = false;
    return {
      stage: { isStage: true },
      destroy: vi.fn(() => { destroyed = true; }),
      get destroyed() { return destroyed; },
      content: { bounds: {}, addChild: vi.fn(), removeChildren: vi.fn(), createRegion: vi.fn() },
    };
  }),
}));

vi.mock('../../components/PixiConfirm', () => ({
  createConfirm: vi.fn(() => {
    let destroyed = false;
    return {
      stage: { isStage: true },
      destroy: vi.fn(() => { destroyed = true; }),
      get destroyed() { return destroyed; },
    };
  }),
}));

vi.mock('../../components/Scrollable', () => ({
  createScrollable: vi.fn(() => {
    let destroyed = false;
    const content = { bounds: {}, addChild: vi.fn(), removeChildren: vi.fn() };
    return {
      content,
      destroy: vi.fn(() => { destroyed = true; }),
      recalc: vi.fn(),
      get destroyed() { return destroyed; },
    };
  }),
}));

import { createComponent, _getComponentFactory, _registeredTypes } from '../component';
import '../register-components';

describe('register-components adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers window, confirm, scrollable', () => {
    const types = _registeredTypes();
    expect(types).toContain('window');
    expect(types).toContain('confirm');
    expect(types).toContain('scrollable');
  });

  it('_getComponentFactory returns factory for each type', () => {
    expect(_getComponentFactory('window')).toBeDefined();
    expect(_getComponentFactory('confirm')).toBeDefined();
    expect(_getComponentFactory('scrollable')).toBeDefined();
  });

  it('createComponent("window") returns a Component', () => {
    const mockParent = { stage: {} };
    const comp = createComponent('window', {
      parent: mockParent as never,
      title: 'Test',
      width: 400,
      height: 300,
    });
    expect(comp.type).toBe('window');
    expect(comp.stage).toBeDefined();
    expect(typeof comp.destroy).toBe('function');
  });

  it('createComponent("confirm") returns a Component', () => {
    const mockParent = { stage: {} };
    const comp = createComponent('confirm', {
      parent: mockParent as never,
      title: 'Confirm?',
      width: 300,
      height: 200,
    });
    expect(comp.type).toBe('confirm');
    expect(comp.stage).toBeDefined();
  });

  it('createComponent("scrollable") returns a Component', () => {
    const mockParent = { stage: {} };
    const comp = createComponent('scrollable', {
      parent: mockParent as never,
      width: 200,
      height: 400,
    });
    expect(comp.type).toBe('scrollable');
    expect(comp.stage).toBeDefined();
  });

  it('Component.destroy is callable and toggles destroyed', () => {
    const mockParent = { stage: {} };
    const comp = createComponent('window', {
      parent: mockParent as never,
      title: 'T',
      width: 200,
      height: 150,
    });
    expect(comp.destroyed).toBe(false);
    comp.destroy();
    expect(comp.destroyed).toBe(true);
  });
});
