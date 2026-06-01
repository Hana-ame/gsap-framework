import type { ComponentType } from 'react';
import { SingleDisplay } from '../displays/single/SingleDisplay';
import { MultipleDisplay } from '../displays/multiple/MultipleDisplay';
import { WindowDisplay } from '../displays/window/WindowDisplay';
import { ThreeDisplay } from '../displays/three/ThreeDisplay';
import { Two3DDisplay } from '../displays/two-3d/Two3DDisplay';

export const ROUTES = ['single', 'multiple', 'window', 'three', 'two-3d'] as const;
export type Route = (typeof ROUTES)[number];
export const DEFAULT_ROUTE: Route = 'three';

export const isRoute = (r: string): r is Route =>
  (ROUTES as readonly string[]).includes(r);

export const routeMap: Record<Route, ComponentType> = {
  single: SingleDisplay,
  multiple: MultipleDisplay,
  window: WindowDisplay,
  three: ThreeDisplay,
  'two-3d': Two3DDisplay,
};
