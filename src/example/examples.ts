// Example registry mapping example IDs to their display components
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
import { ComponentAvdChoicesDisplay } from './component-avd-choices/ComponentAvdChoicesDisplay';
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
import { ComponentFullscreenDisplay } from './component-fullscreen/ComponentFullscreenDisplay';
import { ComponentUiHelpersDisplay } from './component-ui-helpers/ComponentUiHelpersDisplay';
import { ComponentTextInputDisplay } from './component-text-input/ComponentTextInputDisplay';
import { ComponentLayersDisplay } from './component-layers/ComponentLayersDisplay';
import { ComponentTutorialIcBrDisplay } from './component-tutorial-ic-br/ComponentTutorialIcBrDisplay';
import { ComponentTutorialGsapIcDisplay } from './component-tutorial-gsap-ic/ComponentTutorialGsapIcDisplay';
import { ComponentIcChunksDisplay } from './component-ic-chunks/ComponentIcChunksDisplay';
import { ComponentDemoDisplay } from './component-demo/ComponentDemoDisplay';
import { ComponentDemoAnywhereDisplay } from './component-demo-anywhere/ComponentDemoAnywhereDisplay';
import { WmAdapterDisplay } from './component-wm-adapter/WmAdapterDisplay';
import { StreamAdapterDisplay } from './component-stream-adapter/StreamAdapterDisplay';
import { WmMultiDisplay } from './component-wm-multi/WmMultiDisplay';
import { WmCanvasDisplay } from './component-wm-canvas/WmCanvasDisplay';
import { ComponentEcosystemDisplay } from './component-ecosystem/ComponentEcosystemDisplay';
import { ComponentEcosystemPyDisplay } from './component-ecosystem-py/ComponentEcosystemPyDisplay';
import { ComponentFrameworkTestDisplay } from './component-framework-test/ComponentFrameworkTestDisplay';
import { ComponentWindowRefDisplay } from './component-window-ref/ComponentWindowRefDisplay';
import { ComponentRtsDisplay } from './component-rts/ComponentRtsDisplay';
import { ComponentAvdDomMinimalDisplay } from './component-avd-dom-minimal/ComponentAvdDomMinimalDisplay';
import { ComponentAvdVnDisplay } from './component-avd-vn/ComponentAvdVnDisplay';
import { Step01DomTextDisplay } from './step-01-dom-text/Step01DomTextDisplay';
import { Step02DomDialogueDisplay } from './step-02-dom-dialogue/Step02DomDialogueDisplay';
import { Step03DomTypingDisplay } from './step-03-dom-typing/Step03DomTypingDisplay';
import { Step04DomLayerDisplay } from './step-04-dom-layer/Step04DomLayerDisplay';
import { Step05DomAvdDisplay } from './step-05-dom-avd/Step05DomAvdDisplay';

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
  'component-avd-choices',
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
  'component-fullscreen',
  'component-ui-helpers',
  'component-text-input',
  'component-layers',
  'component-tutorial-ic-br',
  'component-tutorial-gsap-ic',
  'component-ic-chunks',
  'component-demo',
  'component-demo-anywhere',
  'component-wm-adapter',
  'component-stream-adapter',
  'component-wm-multi',
  'component-wm-canvas',
  'component-ecosystem',
  'component-ecosystem-py',
  'component-framework-test',
  'component-window-ref',
  'component-rts',
  'component-avd-dom-minimal',
  'component-avd-vn',
  'step-01-dom-text',
  'step-02-dom-dialogue',
  'step-03-dom-typing',
  'step-04-dom-layer',
  'step-05-dom-avd',
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
  'component-avd-choices': ComponentAvdChoicesDisplay,
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
  'component-fullscreen': ComponentFullscreenDisplay,
  'component-ui-helpers': ComponentUiHelpersDisplay,
  'component-text-input': ComponentTextInputDisplay,
  'component-layers': ComponentLayersDisplay,
  'component-tutorial-ic-br': ComponentTutorialIcBrDisplay,
  'component-tutorial-gsap-ic': ComponentTutorialGsapIcDisplay,
  'component-ic-chunks': ComponentIcChunksDisplay,
  'component-demo': ComponentDemoDisplay,
  'component-demo-anywhere': ComponentDemoAnywhereDisplay,
  'component-wm-adapter': WmAdapterDisplay,
  'component-stream-adapter': StreamAdapterDisplay,
  'component-wm-multi': WmMultiDisplay,
  'component-wm-canvas': WmCanvasDisplay,
  'component-ecosystem': ComponentEcosystemDisplay,
  'component-ecosystem-py': ComponentEcosystemPyDisplay,
  'component-framework-test': ComponentFrameworkTestDisplay,
  'component-window-ref': ComponentWindowRefDisplay,
  'component-rts': ComponentRtsDisplay,
  'component-avd-dom-minimal': ComponentAvdDomMinimalDisplay,
  'component-avd-vn': ComponentAvdVnDisplay,
  'step-01-dom-text': Step01DomTextDisplay,
  'step-02-dom-dialogue': Step02DomDialogueDisplay,
  'step-03-dom-typing': Step03DomTypingDisplay,
  'step-04-dom-layer': Step04DomLayerDisplay,
  'step-05-dom-avd': Step05DomAvdDisplay,
};
