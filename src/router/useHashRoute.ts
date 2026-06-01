import { useEffect, useState, useCallback } from 'react';
import { DEFAULT_ROUTE, isRoute, type Route } from './routes';

export function useHashRoute(): Route {
  const compute = useCallback((): Route => {
    const h = window.location.hash.slice(1);
    return isRoute(h) ? h : DEFAULT_ROUTE;
  }, []);

  const [route, setRoute] = useState<Route>(compute);

  useEffect(() => {
    if (!isRoute(window.location.hash.slice(1))) {
      window.location.replace(`#${DEFAULT_ROUTE}`);
    }
    const onChange = () => setRoute(compute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, [compute]);

  return route;
}
