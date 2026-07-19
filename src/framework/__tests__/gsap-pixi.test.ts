import { describe, it, expect, vi } from 'vitest';

const { mockRegisterPlugin, mockRegisterPIXI, pixiNs } = vi.hoisted(() => ({
  mockRegisterPlugin: vi.fn(),
  mockRegisterPIXI: vi.fn(),
  pixiNs: { Container: class {} },
}));

vi.mock('gsap', () => ({ default: { registerPlugin: mockRegisterPlugin } }));
vi.mock('gsap/PixiPlugin', () => ({ PixiPlugin: { registerPIXI: mockRegisterPIXI } }));
vi.mock('pixi.js', () => pixiNs);

import '../gsap-pixi';

describe('gsap-pixi', () => {
  it('registers PixiPlugin with gsap', () => {
    expect(mockRegisterPlugin).toHaveBeenCalled();
  });

  it('registers PIXI namespace with PixiPlugin', () => {
    expect(mockRegisterPIXI).toHaveBeenCalledWith(pixiNs);
  });
});
