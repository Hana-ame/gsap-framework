import { useEffect, useState } from 'react';

interface AppEntry {
  route: string;
  label: string;
  hint: string;
  glyph: string;
  accent: string;
}

const APPS: AppEntry[] = [
  { route: 'screen-size', label: 'Screen Size', hint: 'viewport + device info', glyph: '\u29D6', accent: '#4a6a6a' },
  { route: 'window-mobile', label: 'Window Mobile', hint: 'adaptive stack + confirms', glyph: '\u25EB', accent: '#3a4a6a' },
  { route: 'single', label: 'Single', hint: 'full viewport canvas', glyph: '\u25A3', accent: '#5a3a6a' },
  { route: 'multiple', label: 'Multiple', hint: '2x2 quadrant grid', glyph: '\u229E', accent: '#3a6a5a' },
  { route: 'window', label: 'Window', hint: 'draggable windows + chat', glyph: '\u25A2', accent: '#6a5a3a' },
  { route: 'three', label: 'Three', hint: 'PIXI 3D scene', glyph: '\u25C7', accent: '#3a5a6a' },
  { route: 'two-3d', label: 'Two 3D', hint: 'two synced 3D views', glyph: '\u25C8', accent: '#5a3a5a' },
  { route: 'three-euler', label: 'Three Euler', hint: 'euler angle demo', glyph: '\u25CA', accent: '#3a6a3a' },
  { route: 'camera-euler', label: 'Camera Euler', hint: 'camera rotation demo', glyph: '\u25C6', accent: '#6a3a3a' },
  { route: 'confirm', label: 'Confirm', hint: 'html dialog playground', glyph: '?', accent: '#4a4a6a' },
  { route: 'pixi-confirm', label: 'Pixi Confirm', hint: 'pixi confirm with buttons', glyph: '!', accent: '#4a6a4a' },
];

function accentToText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.5 ? '#0a0a14' : '#e6e6f0';
}

export function LauncherDisplay() {
  const [filter, setFilter] = useState('');
  const [now, setNow] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  const q = filter.trim().toLowerCase();
  const visible = q
    ? APPS.filter(
        (a) => a.label.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q) || a.route.includes(q),
      )
    : APPS;

  return (
    <div className="launcher-root">
      <style>{launcherCss}</style>
      <header className="launcher-header">
        <div className="launcher-title-row">
          <h1 className="launcher-title">sim</h1>
          <span className="launcher-clock">{now}</span>
        </div>
        <div className="launcher-filter-row">
          <input
            type="search"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={`filter ${APPS.length} routes\u2026`}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="launcher-filter"
            aria-label="Filter routes"
          />
          <span className="launcher-count">{visible.length}/{APPS.length}</span>
        </div>
      </header>

      <main className="launcher-grid" role="list">
        {visible.map((app) => (
          <button
            key={app.route}
            type="button"
            role="listitem"
            onClick={() => {
              window.location.hash = `#${app.route}`;
            }}
            className="launcher-tile"
            style={{
              background: `linear-gradient(160deg, ${app.accent} 0%, #0a0a14 130%)`,
              borderColor: app.accent,
              color: accentToText(app.accent),
            }}
          >
            <span className="launcher-glyph" aria-hidden>
              {app.glyph}
            </span>
            <span className="launcher-label">{app.label}</span>
            <span className="launcher-hint">{app.hint}</span>
            <span className="launcher-route" aria-hidden>
              #{app.route}
            </span>
          </button>
        ))}
        {visible.length === 0 && (
          <div className="launcher-empty">no routes match &ldquo;{filter}&rdquo;</div>
        )}
      </main>

      <footer className="launcher-footer">
        {q ? `filter: ${filter}` : 'tap a tile to launch'}
      </footer>
    </div>
  );
}

const launcherCss = `
.launcher-root {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #0a0a14;
  color: #e6e6f0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  padding-top: var(--safe-top, 0px);
  padding-bottom: var(--safe-bottom, 0px);
  padding-left: var(--safe-left, 0px);
  padding-right: var(--safe-right, 0px);
  overflow: hidden;
}
.launcher-header {
  flex: 0 0 auto;
  padding: 16px;
  border-bottom: 1px solid #1a1a2a;
}
.launcher-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}
.launcher-title {
  font-size: 1.6rem;
  margin: 0;
  color: #88aaff;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.launcher-clock {
  font-size: 0.75rem;
  opacity: 0.55;
}
.launcher-filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.launcher-filter {
  flex: 1;
  background: #14141f;
  border: 1px solid #2a2a3a;
  color: #e6e6f0;
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
  font-size: 0.9rem;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}
.launcher-filter:focus {
  border-color: #4a6a9a;
  background: #18182a;
}
.launcher-count {
  font-size: 0.8rem;
  opacity: 0.6;
  min-width: 4ch;
  text-align: right;
}
.launcher-grid {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.launcher-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 4px;
  padding: 14px;
  min-height: 110px;
  border: 1px solid;
  border-radius: 10px;
  font: inherit;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: transform 80ms ease, box-shadow 120ms ease;
}
.launcher-tile:active {
  transform: scale(0.97);
}
.launcher-tile:focus-visible {
  outline: 2px solid #88aaff;
  outline-offset: 2px;
}
.launcher-glyph {
  font-size: 1.4rem;
  line-height: 1;
  margin-bottom: 6px;
  opacity: 0.9;
}
.launcher-label {
  font-size: 0.95rem;
  font-weight: 600;
}
.launcher-hint {
  font-size: 0.75rem;
  opacity: 0.75;
  line-height: 1.3;
}
.launcher-route {
  position: absolute;
  bottom: 6px;
  right: 8px;
  font-size: 0.65rem;
  opacity: 0.45;
}
.launcher-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 32px 12px;
  opacity: 0.6;
  font-size: 0.9rem;
}
.launcher-footer {
  flex: 0 0 auto;
  padding: 8px 16px;
  font-size: 0.7rem;
  text-align: center;
  opacity: 0.55;
  border-top: 1px solid #1a1a2a;
}
`;
