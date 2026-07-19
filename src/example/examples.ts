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
import { ComponentAvdDisplay } from './component-avd/ComponentAvdDisplay';
import { ComponentLifeMapDisplay } from './component-life-map/ComponentLifeMapDisplay';
import { ComponentColonyDisplay } from './component-colony/ComponentColonyDisplay';
import { ComponentGsapDisplay } from './component-gsap/ComponentGsapDisplay';
import { ComponentInfiniteDisplay } from './component-infinite/ComponentInfiniteDisplay';
import { ComponentRegistryDisplay } from './component-registry/ComponentRegistryDisplay';
import { MultiWindowDisplay } from './component-multi-window/MultiWindowDisplay';
import { WindowCanvasDisplay } from './component-window-canvas/WindowCanvasDisplay';
import { ComponentTutorialDisplay } from './component-tutorial/ComponentTutorialDisplay';
import { ComponentSingleWindowDisplay } from './component-single-window/ComponentSingleWindowDisplay';
import { BackendControlledDisplay } from './component-backend-controlled/BackendControlledDisplay';
import { ComponentParticleRainDisplay } from './component-particle-rain/ComponentParticleRainDisplay';
import { ComponentFiltersDisplay } from './component-filters/ComponentFiltersDisplay';
import { ComponentSnakeDisplay } from './component-snake/ComponentSnakeDisplay';
import { ComponentDrawingDisplay } from './component-drawing/ComponentDrawingDisplay';
import { ComponentAudioVizDisplay } from './component-audio-viz/ComponentAudioVizDisplay';
import { ComponentMinesweeperDisplay } from './component-minesweeper/ComponentMinesweeperDisplay';
import { ComponentStarfieldDisplay } from './component-starfield/ComponentStarfieldDisplay';
import { ComponentClockDisplay } from './component-clock/ComponentClockDisplay';
import { ComponentBreakoutDisplay } from './component-breakout/ComponentBreakoutDisplay';
import { ComponentTypingEffectDisplay } from './component-typing-effect/ComponentTypingEffectDisplay';
import { ComponentTetrisDisplay } from './component-tetris/ComponentTetrisDisplay';
import { ComponentWavesDisplay } from './component-waves/ComponentWavesDisplay';

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
  'component-waves',
  'component-cutscene',
  'component-cutscene-minimal',
  'component-drawing',
  'component-filters',
  'component-particle-rain',
  'component-2048',
  'component-conway',
  'component-life-map',
  'component-audio-viz',
  'component-avd',
  'component-breakout',
  'component-clock',
  'component-colony',
  'component-gsap',
  'component-infinite',
  'component-registry',
  'component-minesweeper',
  'component-multi-window',
  'component-window-canvas',
  'component-tutorial',
  'component-single-window',
  'component-snake',
  'component-starfield',
  'component-tetris',
  'component-typing-effect',
  'component-backend-controlled',
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
  'component-waves': ComponentWavesDisplay,
  'component-cutscene': ComponentCutsceneDisplay,
  'component-cutscene-minimal': ComponentCutsceneMinimalDisplay,
  'component-drawing': ComponentDrawingDisplay,
  'component-filters': ComponentFiltersDisplay,
  'component-particle-rain': ComponentParticleRainDisplay,
  'component-2048': Component2048Display,
  'component-conway': ComponentConwayDisplay,
  'component-life-map': ComponentLifeMapDisplay,
  'component-audio-viz': ComponentAudioVizDisplay,
  'component-avd': ComponentAvdDisplay,
  'component-breakout': ComponentBreakoutDisplay,
  'component-clock': ComponentClockDisplay,
  'component-colony': ComponentColonyDisplay,
  'component-gsap': ComponentGsapDisplay,
  'component-infinite': ComponentInfiniteDisplay,
  'component-registry': ComponentRegistryDisplay,
  'component-minesweeper': ComponentMinesweeperDisplay,
  'component-multi-window': MultiWindowDisplay,
  'component-window-canvas': WindowCanvasDisplay,
  'component-tutorial': ComponentTutorialDisplay,
  'component-single-window': ComponentSingleWindowDisplay,
  'component-snake': ComponentSnakeDisplay,
  'component-starfield': ComponentStarfieldDisplay,
  'component-tetris': ComponentTetrisDisplay,
  'component-typing-effect': ComponentTypingEffectDisplay,
  'component-backend-controlled': BackendControlledDisplay,
};
