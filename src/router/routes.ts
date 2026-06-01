import type { ComponentType } from 'react';
import { SingleDisplay } from '../displays/single/SingleDisplay';
import { MultipleDisplay } from '../displays/multiple/MultipleDisplay';
import { WindowDisplay } from '../displays/window/WindowDisplay';
import { ThreeDisplay } from '../three-displays/three/ThreeDisplay';
import { Two3DDisplay } from '../three-displays/two-3d/Two3DDisplay';
import { ThreeEulerDisplay } from '../three-displays/three-euler/ThreeEulerDisplay';
import { CameraEulerDisplay } from '../three-displays/camera-euler/CameraEulerDisplay';
import { ConfirmDisplay } from '../three-displays/confirm/ConfirmDisplay';
import { PixiConfirmDisplay } from '../three-displays/pixi-confirm/PixiConfirmDisplay';

export const ROUTES = [
  'single',
  'multiple',
  'window',
  'three',
  'two-3d',
  'three-euler',
  'camera-euler',
  'confirm',
  'pixi-confirm',
] as const;
export type Route = (typeof ROUTES)[number];
export const DEFAULT_ROUTE: Route = 'pixi-confirm';

export const isRoute = (r: string): r is Route =>
  (ROUTES as readonly string[]).includes(r);

export const routeMap: Record<Route, ComponentType> = {
  single: SingleDisplay,
  multiple: MultipleDisplay,
  window: WindowDisplay,
  three: ThreeDisplay,
  'two-3d': Two3DDisplay,
  'three-euler': ThreeEulerDisplay,
  'camera-euler': CameraEulerDisplay,
  confirm: ConfirmDisplay,
  'pixi-confirm': PixiConfirmDisplay,
};
