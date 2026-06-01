import type { Route } from './router';

interface NavProps {
  route: Route;
}

const navStyle: React.CSSProperties = {
  position: 'fixed',
  top: 8,
  right: 8,
  zIndex: 1000,
  display: 'flex',
  gap: 4,
  fontFamily: 'monospace',
  fontSize: 13,
};

const linkBase: React.CSSProperties = {
  color: '#0f0',
  background: 'rgba(0, 0, 0, 0.65)',
  padding: '4px 10px',
  textDecoration: 'none',
  borderRadius: 2,
  border: '1px solid rgba(0, 255, 0, 0.3)',
};

const linkActive: React.CSSProperties = {
  ...linkBase,
  background: 'rgba(0, 255, 0, 0.18)',
  borderColor: 'rgba(0, 255, 0, 0.8)',
};

export function Nav({ route }: NavProps) {
  return (
    <nav style={navStyle}>
      <a href="#single" style={route === 'single' ? linkActive : linkBase}>single</a>
      <a href="#multiple" style={route === 'multiple' ? linkActive : linkBase}>multiple</a>
    </nav>
  );
}
