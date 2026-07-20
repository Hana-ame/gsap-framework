// Root example app component that renders the selected example
import { useHashExample } from './useHashExample';
import { exampleMap, DEFAULT_EXAMPLE } from './examples';
import { LauncherDisplay } from './launcher/LauncherDisplay';

function BackButton() {
  return (
    <button
      onClick={() => {
        window.location.hash = '';
      }}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        left: 'calc(env(safe-area-inset-left, 0px) + 8px)',
        zIndex: 10000,
        padding: '6px 12px',
        background: 'rgba(10,10,20,0.85)',
        color: '#88aaff',
        border: '1px solid #2a2a3a',
        borderRadius: 6,
        fontSize: 13,
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        cursor: 'pointer',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        touchAction: 'manipulation',
      }}
    >
      ← home
    </button>
  );
}

export function ExampleApp() {
  const example = useHashExample();
  if (!example) {
    return <LauncherDisplay />;
  }
  const C = exampleMap[example];
  return (
    <>
      <BackButton />
      <C />
    </>
  );
}
