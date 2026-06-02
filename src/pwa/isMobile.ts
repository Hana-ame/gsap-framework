export type MobileEvidence = 'pointer-coarse' | 'hover-none' | 'small-viewport' | 'touch-points' | 'ua';

export interface MobileDetection {
  isMobile: boolean;
  evidence: MobileEvidence[];
}

const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i;

export function detectMobile(): MobileDetection {
  const evidence: MobileEvidence[] = [];
  if (typeof window === 'undefined') return { isMobile: false, evidence };

  if (window.matchMedia?.('(pointer: coarse)').matches) evidence.push('pointer-coarse');
  if (window.matchMedia?.('(hover: none)').matches) evidence.push('hover-none');
  if (window.matchMedia?.('(max-width: 768px)').matches) evidence.push('small-viewport');
  if (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) evidence.push('touch-points');
  if (MOBILE_UA.test(navigator.userAgent)) evidence.push('ua');

  return { isMobile: evidence.length >= 2, evidence };
}

export function isMobile(): boolean {
  return detectMobile().isMobile;
}
