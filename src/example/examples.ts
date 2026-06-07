import type { ComponentType } from 'react';
import { SingleDisplay } from './single/SingleDisplay';
import { MultipleDisplay } from './multiple/MultipleDisplay';
import { WindowDisplay } from './window/WindowDisplay';
import { WindowMobileDisplay } from './window-mobile/WindowMobileDisplay';
import { PixiConfirmDisplay } from './pixi-confirm/PixiConfirmDisplay';
import { ScreenSizeDisplay } from './screen-size/ScreenSizeDisplay';
import { ComponentWindowDisplay } from './component-window/ComponentWindowDisplay';
import { ComponentConfirmDisplay } from './component-confirm/ComponentConfirmDisplay';
import { ComponentImageDisplay } from './component-image/ComponentImageDisplay';
import { ComponentLoadingDisplay } from './component-loading/ComponentLoadingDisplay';
import { ComponentBusDisplay } from './component-bus/ComponentBusDisplay';
import { ComponentScrollableDisplay } from './component-scrollable/ComponentScrollableDisplay';
import { ComponentClickableImageDisplay } from './component-clickable-image/ComponentClickableImageDisplay';
import { ComponentScrollableImageDisplay } from './component-scrollable-image/ComponentScrollableImageDisplay';
import { ComponentPictureDragDisplay } from './component-picture-drag/ComponentPictureDragDisplay';
import { ComponentVideoPlayerDisplay } from './component-video-player/ComponentVideoPlayerDisplay';
import { ComponentVideoPlayerDomDisplay } from './component-video-player-dom/ComponentVideoPlayerDomDisplay';
import { ComponentCutsceneDisplay } from './component-cutscene/ComponentCutsceneDisplay';
import { ComponentCutsceneMinimalDisplay } from './component-cutscene-minimal/ComponentCutsceneMinimalDisplay';
import { Component2048Display } from './component-2048/Component2048Display';
import { ComponentConwayDisplay } from './component-conway/ComponentConwayDisplay';
import { ComponentLifeMapDisplay } from './component-life-map/ComponentLifeMapDisplay';

export const EXAMPLES = [
  'screen-size',
  'window-mobile',
  'single',
  'multiple',
  'window',
  'pixi-confirm',
  'component-window',
  'component-confirm',
  'component-image',
  'component-loading',
  'component-bus',
  'component-scrollable',
  'component-clickable-image',
  'component-scrollable-image',
  'component-picture-drag',
  'component-video-player',
  'component-video-player-dom',
  'component-cutscene',
  'component-cutscene-minimal',
  'component-2048',
  'component-conway',
  'component-life-map',
] as const;
export type Example = (typeof EXAMPLES)[number];
export const DEFAULT_EXAMPLE: Example = 'screen-size';

export const isExample = (s: string): s is Example =>
  (EXAMPLES as readonly string[]).includes(s);

export const exampleMap: Record<Example, ComponentType> = {
  'screen-size': ScreenSizeDisplay,
  'window-mobile': WindowMobileDisplay,
  single: SingleDisplay,
  multiple: MultipleDisplay,
  window: WindowDisplay,
  'pixi-confirm': PixiConfirmDisplay,
  'component-window': ComponentWindowDisplay,
  'component-confirm': ComponentConfirmDisplay,
  'component-image': ComponentImageDisplay,
  'component-loading': ComponentLoadingDisplay,
  'component-bus': ComponentBusDisplay,
  'component-scrollable': ComponentScrollableDisplay,
  'component-clickable-image': ComponentClickableImageDisplay,
  'component-scrollable-image': ComponentScrollableImageDisplay,
  'component-picture-drag': ComponentPictureDragDisplay,
  'component-video-player': ComponentVideoPlayerDisplay,
  'component-video-player-dom': ComponentVideoPlayerDomDisplay,
  'component-cutscene': ComponentCutsceneDisplay,
  'component-cutscene-minimal': ComponentCutsceneMinimalDisplay,
  'component-2048': Component2048Display,
  'component-conway': ComponentConwayDisplay,
  'component-life-map': ComponentLifeMapDisplay,
};
