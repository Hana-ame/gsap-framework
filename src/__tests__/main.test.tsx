import { describe, it, expect, vi } from 'vitest';

vi.mock('../framework/gsap-pixi', () => ({
  gsap: { to: vi.fn(() => ({ kill: vi.fn() })), killTweensOf: vi.fn(), registerPlugin: vi.fn() },
  PixiPlugin: { registerPIXI: vi.fn() },
}));

vi.mock('../framework', async () => {
  const actual = await vi.importActual('../framework');
  return {
    ...actual as object,
    startPixiApp: vi.fn(() => vi.fn()),
  };
});

vi.mock('../components', async () => {
  const actual = await vi.importActual('../components');
  return {
    ...actual as object,
    createWindow: vi.fn(() => ({
      stage: { addChild: vi.fn(), removeChild: vi.fn() },
      destroy: vi.fn(),
      content: { addChild: vi.fn(), removeChild: vi.fn(), createRegion: vi.fn(), bounds: {} },
    })),
    createConfirm: vi.fn(() => ({
      stage: { addChild: vi.fn(), removeChild: vi.fn() },
      destroy: vi.fn(),
    })),
    createScrollable: vi.fn(() => ({
      stage: { addChild: vi.fn(), removeChild: vi.fn() },
      recalc: vi.fn(),
      destroy: vi.fn(),
    })),
  };
});

describe('main entry point', () => {
  it('importing main does not throw', { timeout: 15000 }, async () => {
    // main.tsx calls createRoot(document.getElementById('root')!) at module level
    // which would fail without a #root element. We mock it.
    document.body.innerHTML = '<div id="root"></div>';
    const mod = await import('../main');
    expect(mod).toBeDefined();
  });
});
