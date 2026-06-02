import { useMemo } from 'react';
import { detectInstallPlatform } from './detectInstallPlatform';
import type { InstallPlatform } from './detectInstallPlatform';

export type { InstallPlatform };

export interface InstallPromptProps {
  isMobile: boolean;
  onContinue: (() => void) | null;
  appName?: string;
  className?: string;
}

export function InstallPrompt({
  isMobile,
  onContinue,
  appName = 'this app',
  className,
}: InstallPromptProps) {
  const platform = useMemo(() => detectInstallPlatform(), []);

  if (!isMobile) {
    return (
      <div className={className} style={styles.shell}>
        <h1 style={styles.title}>{appName} requires a mobile device</h1>
        <p style={styles.body}>Please open this URL on your phone.</p>
      </div>
    );
  }

  return (
    <div className={className} style={styles.shell}>
      <h1 style={styles.title}>Install {appName}</h1>
      <p style={styles.body}>
        {appName} only works when installed. Open it from your home screen for the full experience.
      </p>

      {platform === 'ios' && <IOSSteps />}
      {platform === 'android' && <AndroidSteps />}
      {platform === 'other' && <OtherSteps appName={appName} />}

      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          style={styles.continueBtn}
          data-testid="pwa-gate-continue"
        >
          Continue in browser
        </button>
      )}
    </div>
  );
}

function NumberedSteps({ steps }: { steps: string[] }) {
  return (
    <ol style={styles.steps}>
      {steps.map((text, i) => (
        <li key={i} style={styles.step}>
          <span style={styles.stepNum}>{i + 1}</span>
          <span dangerouslySetInnerHTML={{ __html: text }} />
        </li>
      ))}
    </ol>
  );
}

function IOSSteps() {
  return (
    <NumberedSteps
      steps={[
        'Tap the <strong>Share</strong> button in Safari.',
        'Scroll down and tap <strong>Add to Home Screen</strong>.',
        'Tap <strong>Add</strong>.',
      ]}
    />
  );
}

function AndroidSteps() {
  return (
    <NumberedSteps
      steps={[
        'Tap the browser menu <strong>⋮</strong> in the top right.',
        'Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.',
        'Tap <strong>Install</strong>.',
      ]}
    />
  );
}

function OtherSteps({ appName }: { appName: string }) {
  return (
    <p style={styles.body}>
      Use your browser menu to install {appName} or add it to your home screen, then reopen from there.
    </p>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'calc(env(safe-area-inset-top, 0px) + 24px) 24px calc(env(safe-area-inset-bottom, 0px) + 24px)',
    background: 'var(--pwa-gate-bg, #0a0a14)',
    color: 'var(--pwa-gate-fg, #e6e6f0)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    zIndex: 2147483647,
    textAlign: 'center',
    overflowY: 'auto',
  },
  title: {
    fontSize: '1.5rem',
    margin: '0 0 12px',
    fontWeight: 600,
  },
  body: {
    fontSize: '1rem',
    lineHeight: 1.5,
    margin: '0 0 24px',
    maxWidth: 360,
    opacity: 0.85,
  },
  steps: {
    textAlign: 'left',
    maxWidth: 360,
    padding: 0,
    margin: '0 0 24px',
    listStyle: 'none',
    counterReset: 'pwa-step',
  },
  step: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    padding: '8px 0',
    lineHeight: 1.5,
    fontSize: '0.95rem',
  },
  stepNum: {
    flex: '0 0 24px',
    height: 24,
    width: 24,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.1)',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  continueBtn: {
    background: 'transparent',
    color: 'inherit',
    border: '1px solid currentColor',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: '0.95rem',
    cursor: 'pointer',
    opacity: 0.7,
  },
};
