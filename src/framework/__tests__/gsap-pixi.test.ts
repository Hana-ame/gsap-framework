import { describe, it, expect, vi } from 'vitest';

var mockRegisterPlugin: any;
var mockRegisterPIXI: any;
var pixiNs: any;

vi.hoisted(() => {
  mockRegisterPlugin = vi.fn();
  mockRegisterPIXI = vi.fn();
  pixiNs = { Container: class {} };
});

vi.mock('gsap', () => ({ default: { registerPlugin: mockRegisterPlugin } }));
vi.mock('gsap/PixiPlugin', () => ({ PixiPlugin: { registerPIXI: mockRegisterPIXI } }));
vi.mock('pixi.js', () => pixiNs);

import { gsap, PixiPlugin } from '../gsap-pixi';

describe('gsap-pixi', () => {
  it('registers PixiPlugin with gsap', () => {
    expect(mockRegisterPlugin).toHaveBeenCalledWith(PixiPlugin);
  });

  it('registers PIXI namespace with PixiPlugin', () => {
    expect(mockRegisterPIXI).toHaveBeenCalledWith(pixiNs);
  });

  it('exports gsap', () => {
    expect(gsap).toBeDefined();
    expect(typeof gsap.registerPlugin).toBe('function');
  });

  it('exports PixiPlugin', () => {
    expect(PixiPlugin).toBeDefined();
    expect(typeof PixiPlugin.registerPIXI).toBe('function');
  });
});
