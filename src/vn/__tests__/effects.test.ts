import { describe, it, expect } from 'vitest';
import { standKeyframe, transitionKeyframe } from '../effects';

describe('演出 keyframe 映射', () => {
  it('maps stand effects to keyframe names', () => {
    expect(standKeyframe('fade')).toBe('vn-fade-in');
    expect(standKeyframe('slide-up')).toBe('vn-stand-slide-up');
    expect(standKeyframe('slide-down')).toBe('vn-stand-slide-down');
    expect(standKeyframe('slide-left')).toBe('vn-stand-slide-left');
    expect(standKeyframe('slide-right')).toBe('vn-stand-slide-right');
    expect(standKeyframe('zoom')).toBe('vn-stand-zoom');
  });

  it('falls back to fade for unknown stand effects', () => {
    expect(standKeyframe('bounce')).toBe('vn-fade-in');
    expect(standKeyframe('')).toBe('vn-fade-in');
  });

  it('maps transition effects to keyframe names', () => {
    expect(transitionKeyframe('fade')).toBe('vn-fade-in');
    expect(transitionKeyframe('wipe-left')).toBe('vn-trans-wipe-left');
    expect(transitionKeyframe('wipe-right')).toBe('vn-trans-wipe-right');
    expect(transitionKeyframe('wipe-up')).toBe('vn-trans-wipe-up');
    expect(transitionKeyframe('wipe-down')).toBe('vn-trans-wipe-down');
    expect(transitionKeyframe('circle')).toBe('vn-trans-circle');
    expect(transitionKeyframe('slide-left')).toBe('vn-trans-slide-left');
    expect(transitionKeyframe('slide-right')).toBe('vn-trans-slide-right');
    expect(transitionKeyframe('slide-up')).toBe('vn-trans-slide-up');
    expect(transitionKeyframe('slide-down')).toBe('vn-trans-slide-down');
    expect(transitionKeyframe('zoom')).toBe('vn-trans-zoom');
  });

  it('falls back to fade for unknown transition effects', () => {
    expect(transitionKeyframe('explode')).toBe('vn-fade-in');
  });
});
