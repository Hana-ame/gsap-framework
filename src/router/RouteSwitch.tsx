import { routeMap, DEFAULT_ROUTE, type Route } from './routes';
import { useHashRoute } from './useHashRoute';
import { useHead } from '../head/useHead';
import type { HeadConfig } from '../head/types';

interface DisplayWithHead {
  head?: HeadConfig;
}

function BackButton() {
  return (
    <button
      onClick={() => {
        window.location.hash = '#launcher';
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
      ← sim
    </button>
  );
}

function HeadForRoute({ route }: { route: Route }) {
  const C = routeMap[route] as DisplayWithHead;
  useHead(C?.head);
  return null;
}

function renderRoute(route: Route) {
  switch (route) {
    case 'launcher': {
      const C = routeMap.launcher;
      return <C />;
    }
    case 'screen-size': {
      const C = routeMap['screen-size'];
      return <C />;
    }
    case 'single': {
      const C = routeMap.single;
      return <C />;
    }
    case 'multiple': {
      const C = routeMap.multiple;
      return <C />;
    }
    case 'window': {
      const C = routeMap.window;
      return <C />;
    }
    case 'window-mobile': {
      const C = routeMap['window-mobile'];
      return <C />;
    }
    case 'three': {
      const C = routeMap.three;
      return <C />;
    }
    case 'two-3d': {
      const C = routeMap['two-3d'];
      return <C />;
    }
    case 'three-euler': {
      const C = routeMap['three-euler'];
      return <C />;
    }
    case 'camera-euler': {
      const C = routeMap['camera-euler'];
      return <C />;
    }
    case 'confirm': {
      const C = routeMap.confirm;
      return <C />;
    }
    case 'pixi-confirm': {
      const C = routeMap['pixi-confirm'];
      return <C />;
    }
    default: {
      const C = routeMap[DEFAULT_ROUTE];
      return <C />;
    }
  }
}

export function RouteSwitch() {
  const route = useHashRoute();
  if (route === 'launcher') {
    return (
      <>
        <HeadForRoute route={route} />
        {renderRoute(route)}
      </>
    );
  }
  return (
    <>
      <HeadForRoute route={route} />
      <BackButton />
      {renderRoute(route)}
    </>
  );
}
