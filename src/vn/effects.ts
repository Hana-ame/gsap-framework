/**
 * 演出效果 → CSS keyframe 名映射（stand 立绘进出场 / transition 全屏转场）。
 */

/** 立绘进出场效果 → keyframe 名。 */
const STAND_KEYFRAMES: Record<string, string> = {
  fade: 'vn-fade-in',
  'slide-up': 'vn-stand-slide-up',
  'slide-down': 'vn-stand-slide-down',
  'slide-left': 'vn-stand-slide-left',
  'slide-right': 'vn-stand-slide-right',
  zoom: 'vn-stand-zoom',
};

export function standKeyframe(effect: string): string {
  return STAND_KEYFRAMES[effect] ?? 'vn-fade-in';
}

/** 全屏转场效果 → keyframe 名。 */
const TRANSITION_KEYFRAMES: Record<string, string> = {
  fade: 'vn-fade-in',
  'wipe-left': 'vn-trans-wipe-left',
  'wipe-right': 'vn-trans-wipe-right',
  'wipe-up': 'vn-trans-wipe-up',
  'wipe-down': 'vn-trans-wipe-down',
  circle: 'vn-trans-circle',
  'slide-left': 'vn-trans-slide-left',
  'slide-right': 'vn-trans-slide-right',
  'slide-up': 'vn-trans-slide-up',
  'slide-down': 'vn-trans-slide-down',
  zoom: 'vn-trans-zoom',
};

export function transitionKeyframe(effect: string): string {
  return TRANSITION_KEYFRAMES[effect] ?? 'vn-fade-in';
}
