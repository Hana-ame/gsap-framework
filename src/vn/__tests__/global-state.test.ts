import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getGlobalVars, setGlobalVars, markSceneSeen, isSceneSeen, resetGlobalVars, subscribeGlobalVars, getGlobalVersion,
} from '../global-state';

describe('global-state (跨场景持久化变量)', () => {
  beforeEach(() => {
    resetGlobalVars();
    localStorage.clear();
  });

  it('starts empty', () => {
    expect(getGlobalVars()).toEqual({});
  });

  it('setGlobalVars merges and persists across reads', () => {
    setGlobalVars({ seen_azusa_HA1_21: true });
    setGlobalVars({ stars: 5 });
    expect(getGlobalVars()).toEqual({ seen_azusa_HA1_21: true, stars: 5 });
  });

  it('markSceneSeen / isSceneSeen roundtrip', () => {
    expect(isSceneSeen('iru_HA1_25')).toBe(false);
    markSceneSeen('iru_HA1_25');
    expect(isSceneSeen('iru_HA1_25')).toBe(true);
  });

  it('persists to localStorage under hana-vn:global-state', () => {
    markSceneSeen('isekai_HA11_13');
    const raw = localStorage.getItem('hana-vn:global-state');
    expect(raw).toContain('seen_isekai_HA11_13');
  });

  it('resetGlobalVars clears', () => {
    setGlobalVars({ a: 1 });
    resetGlobalVars();
    expect(getGlobalVars()).toEqual({});
  });

  it('notifies subscribers on write', () => {
    const spy = vi.fn();
    const unsub = subscribeGlobalVars(spy);
    setGlobalVars({ x: 1 });
    expect(spy).toHaveBeenCalledTimes(1);
    unsub();
    setGlobalVars({ x: 2 });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('bumps version per write', () => {
    const v0 = getGlobalVersion();
    setGlobalVars({ y: 1 });
    expect(getGlobalVersion()).toBeGreaterThan(v0);
  });
});
