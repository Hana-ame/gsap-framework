import { isStandalone } from './standalone';
import { detectMobile } from './isMobile';

export type StandaloneRequirement = 'never' | 'mobile-only' | 'always';

export function isAccessGranted(
  requireStandalone: StandaloneRequirement,
  isMobileDevice: boolean,
  standalone: boolean,
  bypassed: boolean,
  enabled: boolean,
): boolean {
  if (!enabled) return true;
  if (bypassed) return true;
  if (requireStandalone === 'never') return true;
  if (requireStandalone === 'always') return standalone;
  return standalone || !isMobileDevice;
}

export function setBypass(bypassStorageKey: string | null | undefined, value: boolean): void {
  if (!bypassStorageKey || typeof localStorage === 'undefined') return;
  try {
    if (value) localStorage.setItem(bypassStorageKey, '1');
    else localStorage.removeItem(bypassStorageKey);
  } catch {
    // ignore
  }
}

export function readBypass(bypassStorageKey: string | null | undefined): boolean {
  if (!bypassStorageKey || typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(bypassStorageKey) === '1';
  } catch {
    return false;
  }
}

export { isStandalone, detectMobile };
