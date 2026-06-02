import { useEffect, useState, type ReactNode } from 'react';
import { onStandaloneChange, isStandalone } from './standalone';
import { detectMobile } from './isMobile';
import { isAccessGranted, setBypass, readBypass, type StandaloneRequirement } from './access';
import { InstallPrompt } from './InstallPrompt';

export type { StandaloneRequirement };

export interface PwaGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireStandalone?: StandaloneRequirement;
  enabled?: boolean;
  bypassStorageKey?: string | null;
  rememberBypass?: boolean;
  showContinue?: boolean;
  onBypassChange?: (bypassed: boolean) => void;
}

export function PwaGate({
  children,
  fallback,
  requireStandalone = 'mobile-only',
  enabled = true,
  bypassStorageKey = null,
  rememberBypass = true,
  showContinue = true,
  onBypassChange,
}: PwaGateProps) {
  const [isMobileDevice] = useState(() => detectMobile().isMobile);
  const [bypassed, setBypassed] = useState(() => readBypass(bypassStorageKey));
  const [granted, setGranted] = useState(() => {
    const m = detectMobile();
    return isAccessGranted(requireStandalone, m.isMobile, isStandalone(), readBypass(bypassStorageKey), enabled);
  });

  useEffect(() => {
    setBypassed(readBypass(bypassStorageKey));
  }, [bypassStorageKey]);

  useEffect(() => {
    const off = onStandaloneChange((s) => {
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
        showContinue
          ? () => {
              if (rememberBypass) setBypass(bypassStorageKey, true);
              setBypassed(true);
              setGranted(true);
            }
          : null
      }
    />
  );
}
