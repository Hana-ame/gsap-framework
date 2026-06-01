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
    default: {
      const C = routeMap[DEFAULT_ROUTE];
      return <C />;
    }
  }
}
