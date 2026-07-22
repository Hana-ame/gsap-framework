// Example registry mapping example IDs to their display components
// IMPORTANT: adding a new example? Also add a tile entry to LauncherDisplay.tsx APPS[]
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
import { StepHd201SpriteDisplay } from './step-hd2-01-sprite/StepHd201SpriteDisplay';
import { StepHd202SubcanvasDisplay } from './step-hd2-02-subcanvas/StepHd202SubcanvasDisplay';
import { StepHd203AvdBareDisplay } from './step-hd2-03-avd-bare/StepHd203AvdBareDisplay';
import { StepHd204AvdFullDisplay } from './step-hd2-04-avd-full/StepHd204AvdFullDisplay';
import { StepMc01SpriteDisplay } from './step-mc-01-sprite/StepMc01SpriteDisplay';
import { StepMc02SubcanvasDisplay } from './step-mc-02-subcanvas/StepMc02SubcanvasDisplay';
import { StepMc03AvdBareDisplay } from './step-mc-03-avd-bare/StepMc03AvdBareDisplay';
import { StepMc04AvdFullDisplay } from './step-mc-04-avd-full/StepMc04AvdFullDisplay';
import { StepMc05DomDisplay } from './step-mc-05-dom/StepMc05DomDisplay';
import { StepMc06Canvas2dDisplay } from './step-mc-06-canvas2d/StepMc06Canvas2dDisplay';
import { StepMc07FetchBlobDisplay } from './step-mc-07-fetch-blob/StepMc07FetchBlobDisplay';
import { StepMc08AssetsDisplay } from './step-mc-08-assets/StepMc08AssetsDisplay';
import { StepMc09DomAvdDisplay } from './step-mc-09-dom-avd/StepMc09DomAvdDisplay';
import { StepMc10DomAvdDisplay } from './step-mc-10-dom-avd/StepMc10DomAvdDisplay';
import { Step06MixedLayerDisplay } from './step-06-mixed-layer/Step06MixedLayerDisplay';
import { ComponentAvdHa1DomDisplay } from './component-avd-ha1-dom/ComponentAvdHa1DomDisplay';
import { ComponentAvdHa2DomDisplay } from './component-avd-ha2-dom/ComponentAvdHa2DomDisplay';
import { ComponentAvdHa3DomDisplay } from './component-avd-ha3-dom/ComponentAvdHa3DomDisplay';
import { ComponentAvdHbstartDomDisplay } from './component-avd-hbstart-dom/ComponentAvdHbstartDomDisplay';
import { ComponentAvdHb1DomDisplay } from './component-avd-hb1-dom/ComponentAvdHb1DomDisplay';
import { ComponentAvdHb2DomDisplay } from './component-avd-hb2-dom/ComponentAvdHb2DomDisplay';
import { ComponentAvdT21DomDisplay } from './component-avd-t21-dom/ComponentAvdT21DomDisplay';
import { ComponentAvdT22DomDisplay } from './component-avd-t22-dom/ComponentAvdT22DomDisplay';
import { ComponentAvdT22InranDomDisplay } from './component-avd-t22inran-dom/ComponentAvdT22InranDomDisplay';
import { ComponentAvdHc1DomDisplay } from './component-avd-hc1-dom/ComponentAvdHc1DomDisplay';
import { ComponentAvdHc3DomDisplay } from './component-avd-hc3-dom/ComponentAvdHc3DomDisplay';
import { ComponentAvdT3DomDisplay } from './component-avd-t3-dom/ComponentAvdT3DomDisplay';
import { ComponentAvdHd1DomDisplay } from './component-avd-hd1-dom/ComponentAvdHd1DomDisplay';
import { ComponentAvdHd2DomDisplay } from './component-avd-hd2-dom/ComponentAvdHd2DomDisplay';
import { ComponentAvdHd3DomDisplay } from './component-avd-hd3-dom/ComponentAvdHd3DomDisplay';
import { ComponentAvdHe1DomDisplay } from './component-avd-he1-dom/ComponentAvdHe1DomDisplay';
import { ComponentAvdHe2DomDisplay } from './component-avd-he2-dom/ComponentAvdHe2DomDisplay';
import { ComponentAvdHf1DomDisplay } from './component-avd-hf1-dom/ComponentAvdHf1DomDisplay';
import { ComponentAvdHg1DomDisplay } from './component-avd-hg1-dom/ComponentAvdHg1DomDisplay';
import { ComponentAvdT1DomDisplay } from './component-avd-t1-dom/ComponentAvdT1DomDisplay';
import { ComponentAvdHd2Display } from './component-avd-hd2/ComponentAvdHd2Display';
import { ComponentAvdHe1Display } from './component-avd-he1/ComponentAvdHe1Display';
import { ComponentAvdHe2Display } from './component-avd-he2/ComponentAvdHe2Display';
import { ComponentAvdHf1Display } from './component-avd-hf1/ComponentAvdHf1Display';
import { ComponentAvdHg1Display } from './component-avd-hg1/ComponentAvdHg1Display';
import { ComponentAvdT1Display } from './component-avd-t1/ComponentAvdT1Display';
import { ComponentAvdT21Display } from './component-avd-t21/ComponentAvdT21Display';
import { ComponentAvdT22Display } from './component-avd-t22/ComponentAvdT22Display';
import { ComponentAvdT22InranDisplay } from './component-avd-t22inran/ComponentAvdT22InranDisplay';
import { ComponentAvdT3Display } from './component-avd-t3/ComponentAvdT3Display';
import { ComponentAvdHa1Display } from './component-avd-ha1/ComponentAvdHa1Display';
import { ComponentAvdHa2Display } from './component-avd-ha2/ComponentAvdHa2Display';
import { ComponentAvdHa3Display } from './component-avd-ha3/ComponentAvdHa3Display';
import { ComponentAvdHb1Display } from './component-avd-hb1/ComponentAvdHb1Display';
import { ComponentAvdHb2Display } from './component-avd-hb2/ComponentAvdHb2Display';
import { ComponentAvdHbstartDisplay } from './component-avd-hbstart/ComponentAvdHbstartDisplay';
import { ComponentAvdHc1Display } from './component-avd-hc1/ComponentAvdHc1Display';
import { ComponentAvdHc3Display } from './component-avd-hc3/ComponentAvdHc3Display';
import { ComponentAvdHd1Display } from './component-avd-hd1/ComponentAvdHd1Display';
import { ComponentAvdHd3Display } from './component-avd-hd3/ComponentAvdHd3Display';
import { Img00NativeDisplay } from './img-00-native/Img00NativeDisplay';
import { Img01Canvas2dDisplay } from './img-01-canvas2d/Img01Canvas2dDisplay';
import { Img02ImageElementDisplay } from './img-02-image-element/Img02ImageElementDisplay';
import { Img03ImageBitmapDisplay } from './img-03-image-bitmap/Img03ImageBitmapDisplay';
import { Img04AssetsLoadDisplay } from './img-04-assets-load/Img04AssetsLoadDisplay';
import { Img05AssetsInitDisplay } from './img-05-assets-init/Img05AssetsInitDisplay';
import { Img06TextureFromCachedDisplay } from './img-06-texture-from-cached/Img06TextureFromCachedDisplay';
import { Img07SpriteFromDisplay } from './img-07-sprite-from/Img07SpriteFromDisplay';
import { Img08TextureFromRawDisplay } from './img-08-texture-from-raw/Img08TextureFromRawDisplay';
import { Img09AssetsPreloadDisplay } from './img-09-assets-preload/Img09AssetsPreloadDisplay';
// import { ComponentAvdHe1Display } from './component-avd-he1/ComponentAvdHe1Display';
// import { ComponentAvdHe2Display } from './component-avd-he2/ComponentAvdHe2Display';
// import { ComponentAvdHf1Display } from './component-avd-hf1/ComponentAvdHf1Display';
// import { ComponentAvdHg1Display } from './component-avd-hg1/ComponentAvdHg1Display';
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
  'img-00-native',
  'img-01-canvas2d',
  'img-02-image-element',
  'img-03-image-bitmap',
  'img-04-assets-load',
  'img-05-assets-init',
  'img-06-texture-from-cached',
  'img-07-sprite-from',
  'img-08-texture-from-raw',
  'img-09-assets-preload',
  'component-avd-dom-minimal',
  'component-avd-vn',
  'step-hd2-01-sprite',
  'step-hd2-02-subcanvas',
  'step-hd2-03-avd-bare',
  'step-hd2-04-avd-full',
  'step-mc-01-sprite',
  'step-mc-02-subcanvas',
  'step-mc-03-avd-bare',
  'step-mc-04-avd-full',
  'step-mc-05-dom',
  'step-mc-06-canvas2d',
  'step-mc-07-fetch-blob',
  'step-mc-08-assets',
  'step-mc-09-dom-avd',
  'step-mc-10-dom-avd',
  'step-06-mixed-layer',
  'component-avd-ha1-dom',
  'component-avd-ha2-dom',
  'component-avd-ha3-dom',
  'component-avd-hbstart-dom',
  'component-avd-hb1-dom',
  'component-avd-hb2-dom',
  'component-avd-t21-dom',
  'component-avd-t22-dom',
  'component-avd-t22inran-dom',
  'component-avd-hc1-dom',
  'component-avd-hc3-dom',
  'component-avd-t3-dom',
  'component-avd-hd1-dom',
  'component-avd-hd2-dom',
  'component-avd-hd3-dom',
  'component-avd-he1-dom',
  'component-avd-he2-dom',
  'component-avd-hf1-dom',
  'component-avd-hg1-dom',
  'component-avd-t1-dom',
  'component-avd-hd2',
  'component-avd-he1',
  'component-avd-he2',
  'component-avd-hf1',
  'component-avd-hg1',
  'step-01-dom-text',
  'step-02-dom-dialogue',
  'step-03-dom-typing',
  'step-04-dom-layer',
  'step-05-dom-avd',
  'component-avd-t1',
  'component-avd-t21',
  'component-avd-t22',
  'component-avd-t22inran',
  'component-avd-t3',
  'component-avd-ha1',
  'component-avd-ha2',
  'component-avd-ha3',
  'component-avd-hb1',
  'component-avd-hb2',
  'component-avd-hbstart',
  'component-avd-hc1',
  'component-avd-hc3',
  'component-avd-hd1',
  'component-avd-hd3',
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
  'img-00-native': Img00NativeDisplay,
  'img-01-canvas2d': Img01Canvas2dDisplay,
  'img-02-image-element': Img02ImageElementDisplay,
  'img-03-image-bitmap': Img03ImageBitmapDisplay,
  'img-04-assets-load': Img04AssetsLoadDisplay,
  'img-05-assets-init': Img05AssetsInitDisplay,
  'img-06-texture-from-cached': Img06TextureFromCachedDisplay,
  'img-07-sprite-from': Img07SpriteFromDisplay,
  'img-08-texture-from-raw': Img08TextureFromRawDisplay,
  'img-09-assets-preload': Img09AssetsPreloadDisplay,
  'step-hd2-01-sprite': StepHd201SpriteDisplay,
  'step-hd2-02-subcanvas': StepHd202SubcanvasDisplay,
  'step-hd2-03-avd-bare': StepHd203AvdBareDisplay,
  'step-hd2-04-avd-full': StepHd204AvdFullDisplay,
  'step-mc-01-sprite': StepMc01SpriteDisplay,
  'step-mc-02-subcanvas': StepMc02SubcanvasDisplay,
  'step-mc-03-avd-bare': StepMc03AvdBareDisplay,
  'step-mc-04-avd-full': StepMc04AvdFullDisplay,
  'step-mc-05-dom': StepMc05DomDisplay,
  'step-mc-06-canvas2d': StepMc06Canvas2dDisplay,
  'step-mc-07-fetch-blob': StepMc07FetchBlobDisplay,
  'step-mc-08-assets': StepMc08AssetsDisplay,
  'step-mc-09-dom-avd': StepMc09DomAvdDisplay,
  'step-mc-10-dom-avd': StepMc10DomAvdDisplay,
  'step-06-mixed-layer': Step06MixedLayerDisplay,
  'component-avd-ha1-dom': ComponentAvdHa1DomDisplay,
  'component-avd-ha2-dom': ComponentAvdHa2DomDisplay,
  'component-avd-ha3-dom': ComponentAvdHa3DomDisplay,
  'component-avd-hbstart-dom': ComponentAvdHbstartDomDisplay,
  'component-avd-hb1-dom': ComponentAvdHb1DomDisplay,
  'component-avd-hb2-dom': ComponentAvdHb2DomDisplay,
  'component-avd-t21-dom': ComponentAvdT21DomDisplay,
  'component-avd-t22-dom': ComponentAvdT22DomDisplay,
  'component-avd-t22inran-dom': ComponentAvdT22InranDomDisplay,
  'component-avd-hc1-dom': ComponentAvdHc1DomDisplay,
  'component-avd-hc3-dom': ComponentAvdHc3DomDisplay,
  'component-avd-t3-dom': ComponentAvdT3DomDisplay,
  'component-avd-hd1-dom': ComponentAvdHd1DomDisplay,
  'component-avd-hd2-dom': ComponentAvdHd2DomDisplay,
  'component-avd-hd3-dom': ComponentAvdHd3DomDisplay,
  'component-avd-he1-dom': ComponentAvdHe1DomDisplay,
  'component-avd-he2-dom': ComponentAvdHe2DomDisplay,
  'component-avd-hf1-dom': ComponentAvdHf1DomDisplay,
  'component-avd-hg1-dom': ComponentAvdHg1DomDisplay,
  'component-avd-t1-dom': ComponentAvdT1DomDisplay,
  'component-avd-hd2': ComponentAvdHd2Display,
  'component-avd-he1': ComponentAvdHe1Display,
  'component-avd-he2': ComponentAvdHe2Display,
  'component-avd-hf1': ComponentAvdHf1Display,
  'component-avd-hg1': ComponentAvdHg1Display,
  'step-01-dom-text': Step01DomTextDisplay,
  'step-02-dom-dialogue': Step02DomDialogueDisplay,
  'step-03-dom-typing': Step03DomTypingDisplay,
  'step-04-dom-layer': Step04DomLayerDisplay,
  'step-05-dom-avd': Step05DomAvdDisplay,
  'component-avd-t1': ComponentAvdT1Display,
  'component-avd-t21': ComponentAvdT21Display,
  'component-avd-t22': ComponentAvdT22Display,
  'component-avd-t22inran': ComponentAvdT22InranDisplay,
  'component-avd-t3': ComponentAvdT3Display,
  'component-avd-ha1': ComponentAvdHa1Display,
  'component-avd-ha2': ComponentAvdHa2Display,
  'component-avd-ha3': ComponentAvdHa3Display,
  'component-avd-hb1': ComponentAvdHb1Display,
  'component-avd-hb2': ComponentAvdHb2Display,
  'component-avd-hbstart': ComponentAvdHbstartDisplay,
  'component-avd-hc1': ComponentAvdHc1Display,
  'component-avd-hc3': ComponentAvdHc3Display,
  'component-avd-hd1': ComponentAvdHd1Display,
  'component-avd-hd3': ComponentAvdHd3Display,
};
// 需要同步添加到 launchdisplay
