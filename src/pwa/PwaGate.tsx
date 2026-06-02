import { useEffect, useState, type ReactNode } from 'react';
import { isStandalone, onStandaloneChange } from './standalone';
import { detectMobile } from './isMobile';
import { InstallPrompt } from './InstallPrompt';

export type StandaloneRequirement = 'never' | 'mobile-only' | 'always';

export interface PwaGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireStandalone?: StandaloneRequirement;
  enabled?: boolean;
  bypassStorageKey?: string | null;
  onBypassChange?: (bypassed: boolean) => void;
}

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

function readBypass(key: string | null | undefined): boolean {
  if (!key || typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function PwaGate({
  children,
  fallback,
  requireStandalone = 'mobile-only',
  enabled = true,
  bypassStorageKey = null,
  onBypassChange,
}: PwaGateProps) {
  const [granted, setGranted] = useState(false);
  const [bypassed, setBypassed] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [isMobileDevice, setIsMobile] = useState(false);

  useEffect(() => {
    const m = detectMobile();
    const sa = isStandalone();
    const bp = readBypass(bypassStorageKey);
    setIsMobile(m.isMobile);
    setStandalone(sa);
    setBypassed(bp);
    setGranted(isAccessGranted(requireStandalone, m.isMobile, sa, bp, enabled));
  }, [enabled, requireStandalone, bypassStorageKey]);

  useEffect(() => {
    const off = onStandaloneChange((s) => {
      setStandalone(s);
      setGranted(isAccessGranted(requireStandalone, isMobileDevice, s, bypassed, enabled));
    });
    return off;
  }, [requireStandalone, isMobileDevice, bypassed, enabled]);

  useEffect(() => {
    onBypassChange?.(bypassed);
  }, [bypassed, onBypassChange]);

  if (granted) return <>{children}</>;
  if (fallback !== undefined) return <>{fallback}</>;
  return (
    <InstallPrompt
      isMobile={isMobileDevice}
      onContinue={
        bypassStorageKey
          ? () => {
              setBypass(bypassStorageKey, true);
              setBypassed(true);
              setGranted(true);
            }
          : null
      }
    />
  );
}
