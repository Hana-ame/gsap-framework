import type { ComponentType } from 'react';
import { SingleDisplay } from '../displays/single/SingleDisplay';
import { MultipleDisplay } from '../displays/multiple/MultipleDisplay';
import { WindowDisplay } from '../displays/window/WindowDisplay';

export const ROUTES = ['single', 'multiple', 'window'] as const;
export type Route = (typeof ROUTES)[number];
export const DEFAULT_ROUTE: Route = 'multiple';

export const isRoute = (r: string): r is Route =>
  (ROUTES as readonly string[]).includes(r);

export const routeMap: Record<Route, ComponentType> = {
  single: SingleDisplay,
  multiple: MultipleDisplay,
  window: WindowDisplay,
};
