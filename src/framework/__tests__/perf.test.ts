import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('pixi.js', () => {
  function makeMockContainer() {
    return {
      children: [] as unknown[],
      addChild: vi.fn(function (this: Record<string, unknown>, child: unknown) {
        (this.children as unknown[]).push(child);
        return child;
      }),
      removeChild: vi.fn(function (this: Record<string, unknown>, child: unknown) {
        this.children = (this.children as unknown[]).filter((x) => x !== child);
        return child;
      }),
      removeChildren: vi.fn(function (this: Record<string, unknown>) {
        const c = [...this.children];
        this.children = [];
        return c;
      }),
      destroy: vi.fn(function (this: Record<string, unknown>, _opts?: unknown) {
        this.children = [];
      }),
      eventMode: null as string | null,
      x: 0, y: 0, alpha: 1, zIndex: 0,
      width: 800, height: 600,
      label: '',
      parent: null as Record<string, unknown> | null,
      visible: true,
    };
  }

  const Container = vi.fn(function () { return makeMockContainer(); } as unknown as new () => unknown);
  const Text = vi.fn(function () { return makeMockContainer(); } as unknown as new () => unknown);

  return { Container, Text };
});

import { PerfDisplay } from '../perf';

describe('PerfDisplay', () => {
  let ticker: { deltaMS: number; add: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };
  let stageContainer: ReturnType<typeof makeMockContainer>;
  let stageFn: () => typeof stageContainer;

  beforeEach(() => {
    ticker = {
      deltaMS: 16,
      add: vi.fn(),
      remove: vi.fn(),
    };
    stageContainer = makeMockContainer();
    stageFn = () => stageContainer;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeMockContainer() {
    return {
      children: [] as unknown[],
      addChild: vi.fn(),
      removeChild: vi.fn(),
      width: 800,
      height: 600,
    };
  }

  it('constructor registers ticker callback and creates text', () => {
    const pd = new PerfDisplay(ticker as never, stageFn);
    expect(ticker.add).toHaveBeenCalled();
    expect(pd.enabled).toBe(false);
    expect(pd.destroyed).toBe(false);
    pd.destroy();
  });

  it('enable adds container to stage', () => {
    const pd = new PerfDisplay(ticker as never, stageFn);
    pd.enable();
    expect(stageContainer.addChild).toHaveBeenCalledWith(pd.container);
    expect(pd.enabled).toBe(true);
    pd.destroy();
  });

  it('disable removes container from stage', () => {
    const pd = new PerfDisplay(ticker as never, stageFn);
    pd.enable();
    pd.disable();
    expect(pd.enabled).toBe(false);
    pd.destroy();
  });

  it('toggle flips enabled state', () => {
    const pd = new PerfDisplay(ticker as never, stageFn);
    expect(pd.enabled).toBe(false);
    pd.toggle();
    expect(pd.enabled).toBe(true);
    pd.toggle();
    expect(pd.enabled).toBe(false);
    pd.destroy();
  });

  it('enable is idempotent', () => {
    const pd = new PerfDisplay(ticker as never, stageFn);
    pd.enable();
    pd.enable();
    expect(stageContainer.addChild).toHaveBeenCalledTimes(1);
    pd.destroy();
  });

  it('disable on disabled does nothing', () => {
    const pd = new PerfDisplay(ticker as never, stageFn);
    expect(() => pd.disable()).not.toThrow();
    pd.destroy();
  });

  it('destroy cleans up ticker and container', () => {
    const pd = new PerfDisplay(ticker as never, stageFn);
    pd.enable();
    pd.destroy();
    expect(pd.destroyed).toBe(true);
    expect(ticker.remove).toHaveBeenCalled();
  });

  it('destroy is idempotent', () => {
    const pd = new PerfDisplay(ticker as never, stageFn);
    pd.destroy();
    expect(() => pd.destroy()).not.toThrow();
  });

  it('enable after destroy does nothing', () => {
    const pd = new PerfDisplay(ticker as never, stageFn);
    pd.destroy();
    pd.enable();
    expect(pd.enabled).toBe(false);
  });
});
