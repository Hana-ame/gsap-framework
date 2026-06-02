import type { ComponentType } from 'react';
import { SingleDisplay } from '../displays/single/SingleDisplay';
import { MultipleDisplay } from '../displays/multiple/MultipleDisplay';
import { WindowDisplay } from '../displays/window/WindowDisplay';
import { WindowMobileDisplay } from '../displays/window-mobile/WindowMobileDisplay';
import { PixiConfirmDisplay } from '../displays/pixi-confirm/PixiConfirmDisplay';
import { ThreeDisplay } from '../three-displays/three/ThreeDisplay';
import { Two3DDisplay } from '../three-displays/two-3d/Two3DDisplay';
import { ThreeEulerDisplay } from '../three-displays/three-euler/ThreeEulerDisplay';
import { CameraEulerDisplay } from '../three-displays/camera-euler/CameraEulerDisplay';
import { ConfirmDisplay } from '../html-displays/confirm/ConfirmDisplay';
import { LauncherDisplay } from '../displays/launcher/LauncherDisplay';
import { ScreenSizeDisplay } from '../displays/screen-size/ScreenSizeDisplay';

export const ROUTES = [
  'launcher',
  'screen-size',
  'single',
  'multiple',
  'window',
  'window-mobile',
  'three',
  'two-3d',
  'three-euler',
  'camera-euler',
  'confirm',
  'pixi-confirm',
] as const;
export type Route = (typeof ROUTES)[number];
export const DEFAULT_ROUTE: Route = 'launcher';

export const isRoute = (r: string): r is Route =>
  (ROUTES as readonly string[]).includes(r);

export const routeMap: Record<Route, ComponentType> = {
  launcher: LauncherDisplay,
  'screen-size': ScreenSizeDisplay,
  single: SingleDisplay,
  multiple: MultipleDisplay,
  window: WindowDisplay,
  'window-mobile': WindowMobileDisplay,
  three: ThreeDisplay,
  'two-3d': Two3DDisplay,
  'three-euler': ThreeEulerDisplay,
  'camera-euler': CameraEulerDisplay,
  confirm: ConfirmDisplay,
  'pixi-confirm': PixiConfirmDisplay,
};
