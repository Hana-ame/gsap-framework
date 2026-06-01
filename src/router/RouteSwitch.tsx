import { routeMap, DEFAULT_ROUTE } from './routes';
import { useHashRoute } from './useHashRoute';

export function RouteSwitch() {
  const route = useHashRoute();
  switch (route) {
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
