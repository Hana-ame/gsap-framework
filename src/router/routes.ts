import type { ComponentType } from 'react';
import { SingleDisplay } from '../displays/single/SingleDisplay';
import { MultipleDisplay } from '../displays/multiple/MultipleDisplay';
import { WindowDisplay } from '../displays/window/WindowDisplay';
import { ThreeDisplay } from '../displays/three/ThreeDisplay';
import { Two3DDisplay } from '../displays/two-3d/Two3DDisplay';
import { ThreeEulerDisplay } from '../displays/three-euler/ThreeEulerDisplay';

export const ROUTES = ['single', 'multiple', 'window', 'three', 'two-3d', 'three-euler'] as const;
export type Route = (typeof ROUTES)[number];
export const DEFAULT_ROUTE: Route = 'three-euler';

export const isRoute = (r: string): r is Route =>
  (ROUTES as readonly string[]).includes(r);

export const routeMap: Record<Route, ComponentType> = {
  single: SingleDisplay,
  multiple: MultipleDisplay,
  window: WindowDisplay,
  three: ThreeDisplay,
  'two-3d': Two3DDisplay,
  'three-euler': ThreeEulerDisplay,
};
