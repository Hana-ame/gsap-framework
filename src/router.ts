import { useEffect, useState, useCallback } from 'react';

export const ROUTES = ['single', 'multiple'] as const;
export type Route = (typeof ROUTES)[number];
export const DEFAULT_ROUTE: Route = 'multiple';

const isRoute = (r: string): r is Route => (ROUTES as readonly string[]).includes(r);

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

export function navigate(route: Route): void {
  if (window.location.hash !== `#${route}`) {
    window.location.hash = route;
  }
}
