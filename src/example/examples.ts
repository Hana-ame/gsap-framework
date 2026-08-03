// Example registry mapping example IDs to their display components

import type { ComponentType } from 'react';
import { lazy } from 'react';

const SingleDisplay = lazy(() => import('./single/SingleDisplay').then(m => ({ default: m['SingleDisplay'] })));

const MultipleDisplay = lazy(() => import('./multiple/MultipleDisplay').then(m => ({ default: m['MultipleDisplay'] })));

const WindowDisplay = lazy(() => import('./window/WindowDisplay').then(m => ({ default: m['WindowDisplay'] })));

const WindowMobileDisplay = lazy(() => import('./window-mobile/WindowMobileDisplay').then(m => ({ default: m['WindowMobileDisplay'] })));

const PixiConfirmDisplay = lazy(() => import('./pixi-confirm/PixiConfirmDisplay').then(m => ({ default: m['PixiConfirmDisplay'] })));

const ScreenSizeDisplay = lazy(() => import('./screen-size/ScreenSizeDisplay').then(m => ({ default: m['ScreenSizeDisplay'] })));

const ComponentWindowDisplay = lazy(() => import('./component-window/ComponentWindowDisplay').then(m => ({ default: m['ComponentWindowDisplay'] })));

const ComponentConfirmDisplay = lazy(() => import('./component-confirm/ComponentConfirmDisplay').then(m => ({ default: m['ComponentConfirmDisplay'] })));

const ComponentImageDisplay = lazy(() => import('./component-image/ComponentImageDisplay').then(m => ({ default: m['ComponentImageDisplay'] })));

const ComponentLoadingDisplay = lazy(() => import('./component-loading/ComponentLoadingDisplay').then(m => ({ default: m['ComponentLoadingDisplay'] })));

const ComponentBusDisplay = lazy(() => import('./component-bus/ComponentBusDisplay').then(m => ({ default: m['ComponentBusDisplay'] })));

const ComponentScrollableDisplay = lazy(() => import('./component-scrollable/ComponentScrollableDisplay').then(m => ({ default: m['ComponentScrollableDisplay'] })));

const ComponentClickableImageDisplay = lazy(() => import('./component-clickable-image/ComponentClickableImageDisplay').then(m => ({ default: m['ComponentClickableImageDisplay'] })));

const ComponentScrollableImageDisplay = lazy(() => import('./component-scrollable-image/ComponentScrollableImageDisplay').then(m => ({ default: m['ComponentScrollableImageDisplay'] })));

const ComponentPictureDragDisplay = lazy(() => import('./component-picture-drag/ComponentPictureDragDisplay').then(m => ({ default: m['ComponentPictureDragDisplay'] })));

const ComponentVideoPlayerDisplay = lazy(() => import('./component-video-player/ComponentVideoPlayerDisplay').then(m => ({ default: m['ComponentVideoPlayerDisplay'] })));

const ComponentVideoPlayerDomDisplay = lazy(() => import('./component-video-player-dom/ComponentVideoPlayerDomDisplay').then(m => ({ default: m['ComponentVideoPlayerDomDisplay'] })));

const ComponentCutsceneDisplay = lazy(() => import('./component-cutscene/ComponentCutsceneDisplay').then(m => ({ default: m['ComponentCutsceneDisplay'] })));

const ComponentCutsceneMinimalDisplay = lazy(() => import('./component-cutscene-minimal/ComponentCutsceneMinimalDisplay').then(m => ({ default: m['ComponentCutsceneMinimalDisplay'] })));

const Component2048Display = lazy(() => import('./component-2048/Component2048Display').then(m => ({ default: m['Component2048Display'] })));

const ComponentConwayDisplay = lazy(() => import('./component-conway/ComponentConwayDisplay').then(m => ({ default: m['ComponentConwayDisplay'] })));

const ComponentAvdDisplay = lazy(() => import('./component-avd/ComponentAvdDisplay').then(m => ({ default: m['ComponentAvdDisplay'] })));

const ComponentAvdChoicesDisplay = lazy(() => import('./component-avd-choices/ComponentAvdChoicesDisplay').then(m => ({ default: m['ComponentAvdChoicesDisplay'] })));

const ComponentLifeMapDisplay = lazy(() => import('./component-life-map/ComponentLifeMapDisplay').then(m => ({ default: m['ComponentLifeMapDisplay'] })));

const ComponentColonyDisplay = lazy(() => import('./component-colony/ComponentColonyDisplay').then(m => ({ default: m['ComponentColonyDisplay'] })));

const ComponentGsapDisplay = lazy(() => import('./component-gsap/ComponentGsapDisplay').then(m => ({ default: m['ComponentGsapDisplay'] })));

const ComponentInfiniteDisplay = lazy(() => import('./component-infinite/ComponentInfiniteDisplay').then(m => ({ default: m['ComponentInfiniteDisplay'] })));

const ComponentRegistryDisplay = lazy(() => import('./component-registry/ComponentRegistryDisplay').then(m => ({ default: m['ComponentRegistryDisplay'] })));

const MultiWindowDisplay = lazy(() => import('./component-multi-window/MultiWindowDisplay').then(m => ({ default: m['MultiWindowDisplay'] })));

const WindowCanvasDisplay = lazy(() => import('./component-window-canvas/WindowCanvasDisplay').then(m => ({ default: m['WindowCanvasDisplay'] })));

const ComponentTutorialDisplay = lazy(() => import('./component-tutorial/ComponentTutorialDisplay').then(m => ({ default: m['ComponentTutorialDisplay'] })));

const ComponentSingleWindowDisplay = lazy(() => import('./component-single-window/ComponentSingleWindowDisplay').then(m => ({ default: m['ComponentSingleWindowDisplay'] })));

const BackendControlledDisplay = lazy(() => import('./component-backend-controlled/BackendControlledDisplay').then(m => ({ default: m['BackendControlledDisplay'] })));

const ComponentParticleRainDisplay = lazy(() => import('./component-particle-rain/ComponentParticleRainDisplay').then(m => ({ default: m['ComponentParticleRainDisplay'] })));

const ComponentFiltersDisplay = lazy(() => import('./component-filters/ComponentFiltersDisplay').then(m => ({ default: m['ComponentFiltersDisplay'] })));

const ComponentSnakeDisplay = lazy(() => import('./component-snake/ComponentSnakeDisplay').then(m => ({ default: m['ComponentSnakeDisplay'] })));

const ComponentDrawingDisplay = lazy(() => import('./component-drawing/ComponentDrawingDisplay').then(m => ({ default: m['ComponentDrawingDisplay'] })));

const ComponentAudioVizDisplay = lazy(() => import('./component-audio-viz/ComponentAudioVizDisplay').then(m => ({ default: m['ComponentAudioVizDisplay'] })));

const ComponentMinesweeperDisplay = lazy(() => import('./component-minesweeper/ComponentMinesweeperDisplay').then(m => ({ default: m['ComponentMinesweeperDisplay'] })));

const ComponentStarfieldDisplay = lazy(() => import('./component-starfield/ComponentStarfieldDisplay').then(m => ({ default: m['ComponentStarfieldDisplay'] })));

const ComponentClockDisplay = lazy(() => import('./component-clock/ComponentClockDisplay').then(m => ({ default: m['ComponentClockDisplay'] })));

const ComponentBreakoutDisplay = lazy(() => import('./component-breakout/ComponentBreakoutDisplay').then(m => ({ default: m['ComponentBreakoutDisplay'] })));

const ComponentTypingEffectDisplay = lazy(() => import('./component-typing-effect/ComponentTypingEffectDisplay').then(m => ({ default: m['ComponentTypingEffectDisplay'] })));

const ComponentTetrisDisplay = lazy(() => import('./component-tetris/ComponentTetrisDisplay').then(m => ({ default: m['ComponentTetrisDisplay'] })));

const ComponentWavesDisplay = lazy(() => import('./component-waves/ComponentWavesDisplay').then(m => ({ default: m['ComponentWavesDisplay'] })));

const ComponentFullscreenDisplay = lazy(() => import('./component-fullscreen/ComponentFullscreenDisplay').then(m => ({ default: m['ComponentFullscreenDisplay'] })));

const ComponentUiHelpersDisplay = lazy(() => import('./component-ui-helpers/ComponentUiHelpersDisplay').then(m => ({ default: m['ComponentUiHelpersDisplay'] })));

const ComponentTextInputDisplay = lazy(() => import('./component-text-input/ComponentTextInputDisplay').then(m => ({ default: m['ComponentTextInputDisplay'] })));

const ComponentLayersDisplay = lazy(() => import('./component-layers/ComponentLayersDisplay').then(m => ({ default: m['ComponentLayersDisplay'] })));

const ComponentTutorialIcBrDisplay = lazy(() => import('./component-tutorial-ic-br/ComponentTutorialIcBrDisplay').then(m => ({ default: m['ComponentTutorialIcBrDisplay'] })));

const ComponentTutorialGsapIcDisplay = lazy(() => import('./component-tutorial-gsap-ic/ComponentTutorialGsapIcDisplay').then(m => ({ default: m['ComponentTutorialGsapIcDisplay'] })));

const ComponentIcChunksDisplay = lazy(() => import('./component-ic-chunks/ComponentIcChunksDisplay').then(m => ({ default: m['ComponentIcChunksDisplay'] })));

const ComponentDemoDisplay = lazy(() => import('./component-demo/ComponentDemoDisplay').then(m => ({ default: m['ComponentDemoDisplay'] })));

const ComponentDemoAnywhereDisplay = lazy(() => import('./component-demo-anywhere/ComponentDemoAnywhereDisplay').then(m => ({ default: m['ComponentDemoAnywhereDisplay'] })));

const WmAdapterDisplay = lazy(() => import('./component-wm-adapter/WmAdapterDisplay').then(m => ({ default: m['WmAdapterDisplay'] })));

const StreamAdapterDisplay = lazy(() => import('./component-stream-adapter/StreamAdapterDisplay').then(m => ({ default: m['StreamAdapterDisplay'] })));

const WmMultiDisplay = lazy(() => import('./component-wm-multi/WmMultiDisplay').then(m => ({ default: m['WmMultiDisplay'] })));

const WmCanvasDisplay = lazy(() => import('./component-wm-canvas/WmCanvasDisplay').then(m => ({ default: m['WmCanvasDisplay'] })));

const ComponentEcosystemDisplay = lazy(() => import('./component-ecosystem/ComponentEcosystemDisplay').then(m => ({ default: m['ComponentEcosystemDisplay'] })));

const ComponentEcosystemPyDisplay = lazy(() => import('./component-ecosystem-py/ComponentEcosystemPyDisplay').then(m => ({ default: m['ComponentEcosystemPyDisplay'] })));

const ComponentFrameworkTestDisplay = lazy(() => import('./component-framework-test/ComponentFrameworkTestDisplay').then(m => ({ default: m['ComponentFrameworkTestDisplay'] })));

const ComponentWindowRefDisplay = lazy(() => import('./component-window-ref/ComponentWindowRefDisplay').then(m => ({ default: m['ComponentWindowRefDisplay'] })));

const ComponentRtsDisplay = lazy(() => import('./component-rts/ComponentRtsDisplay').then(m => ({ default: m['ComponentRtsDisplay'] })));

const ComponentAvdDomMinimalDisplay = lazy(() => import('./component-avd-dom-minimal/ComponentAvdDomMinimalDisplay').then(m => ({ default: m['ComponentAvdDomMinimalDisplay'] })));

const ComponentAvdVnDisplay = lazy(() => import('./component-avd-vn/ComponentAvdVnDisplay').then(m => ({ default: m['ComponentAvdVnDisplay'] })));

const StepHd201SpriteDisplay = lazy(() => import('./step-hd2-01-sprite/StepHd201SpriteDisplay').then(m => ({ default: m['StepHd201SpriteDisplay'] })));

const StepHd202SubcanvasDisplay = lazy(() => import('./step-hd2-02-subcanvas/StepHd202SubcanvasDisplay').then(m => ({ default: m['StepHd202SubcanvasDisplay'] })));

const StepHd203AvdBareDisplay = lazy(() => import('./step-hd2-03-avd-bare/StepHd203AvdBareDisplay').then(m => ({ default: m['StepHd203AvdBareDisplay'] })));

const StepHd204AvdFullDisplay = lazy(() => import('./step-hd2-04-avd-full/StepHd204AvdFullDisplay').then(m => ({ default: m['StepHd204AvdFullDisplay'] })));

const StepMc01SpriteDisplay = lazy(() => import('./step-mc-01-sprite/StepMc01SpriteDisplay').then(m => ({ default: m['StepMc01SpriteDisplay'] })));

const StepMc02SubcanvasDisplay = lazy(() => import('./step-mc-02-subcanvas/StepMc02SubcanvasDisplay').then(m => ({ default: m['StepMc02SubcanvasDisplay'] })));

const StepMc03AvdBareDisplay = lazy(() => import('./step-mc-03-avd-bare/StepMc03AvdBareDisplay').then(m => ({ default: m['StepMc03AvdBareDisplay'] })));

const StepMc04AvdFullDisplay = lazy(() => import('./step-mc-04-avd-full/StepMc04AvdFullDisplay').then(m => ({ default: m['StepMc04AvdFullDisplay'] })));

const StepMc05DomDisplay = lazy(() => import('./step-mc-05-dom/StepMc05DomDisplay').then(m => ({ default: m['StepMc05DomDisplay'] })));

const StepMc06Canvas2dDisplay = lazy(() => import('./step-mc-06-canvas2d/StepMc06Canvas2dDisplay').then(m => ({ default: m['StepMc06Canvas2dDisplay'] })));

const StepMc07FetchBlobDisplay = lazy(() => import('./step-mc-07-fetch-blob/StepMc07FetchBlobDisplay').then(m => ({ default: m['StepMc07FetchBlobDisplay'] })));

const StepMc08AssetsDisplay = lazy(() => import('./step-mc-08-assets/StepMc08AssetsDisplay').then(m => ({ default: m['StepMc08AssetsDisplay'] })));

const StepMc09DomAvdDisplay = lazy(() => import('./step-mc-09-dom-avd/StepMc09DomAvdDisplay').then(m => ({ default: m['StepMc09DomAvdDisplay'] })));

const StepMc10DomAvdDisplay = lazy(() => import('./step-mc-10-dom-avd/StepMc10DomAvdDisplay').then(m => ({ default: m['StepMc10DomAvdDisplay'] })));

const Step06MixedLayerDisplay = lazy(() => import('./step-06-mixed-layer/Step06MixedLayerDisplay').then(m => ({ default: m['Step06MixedLayerDisplay'] })));

const ComponentAvdHa1DomDisplay = lazy(() => import('./component-avd-ha1-dom/ComponentAvdHa1DomDisplay').then(m => ({ default: m['ComponentAvdHa1DomDisplay'] })));

const ComponentAvdHa2DomDisplay = lazy(() => import('./component-avd-ha2-dom/ComponentAvdHa2DomDisplay').then(m => ({ default: m['ComponentAvdHa2DomDisplay'] })));

const ComponentAvdHa3DomDisplay = lazy(() => import('./component-avd-ha3-dom/ComponentAvdHa3DomDisplay').then(m => ({ default: m['ComponentAvdHa3DomDisplay'] })));

const ComponentAvdHbstartDomDisplay = lazy(() => import('./component-avd-hbstart-dom/ComponentAvdHbstartDomDisplay').then(m => ({ default: m['ComponentAvdHbstartDomDisplay'] })));

const ComponentAvdHb1DomDisplay = lazy(() => import('./component-avd-hb1-dom/ComponentAvdHb1DomDisplay').then(m => ({ default: m['ComponentAvdHb1DomDisplay'] })));

const ComponentAvdHb2DomDisplay = lazy(() => import('./component-avd-hb2-dom/ComponentAvdHb2DomDisplay').then(m => ({ default: m['ComponentAvdHb2DomDisplay'] })));

const ComponentAvdT21DomDisplay = lazy(() => import('./component-avd-t21-dom/ComponentAvdT21DomDisplay').then(m => ({ default: m['ComponentAvdT21DomDisplay'] })));

const ComponentAvdT22DomDisplay = lazy(() => import('./component-avd-t22-dom/ComponentAvdT22DomDisplay').then(m => ({ default: m['ComponentAvdT22DomDisplay'] })));

const ComponentAvdT22InranDomDisplay = lazy(() => import('./component-avd-t22inran-dom/ComponentAvdT22InranDomDisplay').then(m => ({ default: m['ComponentAvdT22InranDomDisplay'] })));

const ComponentAvdHc1DomDisplay = lazy(() => import('./component-avd-hc1-dom/ComponentAvdHc1DomDisplay').then(m => ({ default: m['ComponentAvdHc1DomDisplay'] })));

const ComponentAvdHc3DomDisplay = lazy(() => import('./component-avd-hc3-dom/ComponentAvdHc3DomDisplay').then(m => ({ default: m['ComponentAvdHc3DomDisplay'] })));

const ComponentAvdT3DomDisplay = lazy(() => import('./component-avd-t3-dom/ComponentAvdT3DomDisplay').then(m => ({ default: m['ComponentAvdT3DomDisplay'] })));

const ComponentAvdHd1DomDisplay = lazy(() => import('./component-avd-hd1-dom/ComponentAvdHd1DomDisplay').then(m => ({ default: m['ComponentAvdHd1DomDisplay'] })));

const ComponentAvdHd2DomDisplay = lazy(() => import('./component-avd-hd2-dom/ComponentAvdHd2DomDisplay').then(m => ({ default: m['ComponentAvdHd2DomDisplay'] })));

const ComponentAvdHd3DomDisplay = lazy(() => import('./component-avd-hd3-dom/ComponentAvdHd3DomDisplay').then(m => ({ default: m['ComponentAvdHd3DomDisplay'] })));

const ComponentAvdHe1DomDisplay = lazy(() => import('./component-avd-he1-dom/ComponentAvdHe1DomDisplay').then(m => ({ default: m['ComponentAvdHe1DomDisplay'] })));

const ComponentAvdHe2DomDisplay = lazy(() => import('./component-avd-he2-dom/ComponentAvdHe2DomDisplay').then(m => ({ default: m['ComponentAvdHe2DomDisplay'] })));

const ComponentAvdHf1DomDisplay = lazy(() => import('./component-avd-hf1-dom/ComponentAvdHf1DomDisplay').then(m => ({ default: m['ComponentAvdHf1DomDisplay'] })));

const ComponentAvdHg1DomDisplay = lazy(() => import('./component-avd-hg1-dom/ComponentAvdHg1DomDisplay').then(m => ({ default: m['ComponentAvdHg1DomDisplay'] })));

const ComponentAvdT1DomDisplay = lazy(() => import('./component-avd-t1-dom/ComponentAvdT1DomDisplay').then(m => ({ default: m['ComponentAvdT1DomDisplay'] })));

const ComponentAvdHd2Display = lazy(() => import('./component-avd-hd2/ComponentAvdHd2Display').then(m => ({ default: m['ComponentAvdHd2Display'] })));

const ComponentAvdHe1Display = lazy(() => import('./component-avd-he1/ComponentAvdHe1Display').then(m => ({ default: m['ComponentAvdHe1Display'] })));

const ComponentAvdHe2Display = lazy(() => import('./component-avd-he2/ComponentAvdHe2Display').then(m => ({ default: m['ComponentAvdHe2Display'] })));

const ComponentAvdHf1Display = lazy(() => import('./component-avd-hf1/ComponentAvdHf1Display').then(m => ({ default: m['ComponentAvdHf1Display'] })));

const ComponentAvdHg1Display = lazy(() => import('./component-avd-hg1/ComponentAvdHg1Display').then(m => ({ default: m['ComponentAvdHg1Display'] })));

const ComponentAvdT1Display = lazy(() => import('./component-avd-t1/ComponentAvdT1Display').then(m => ({ default: m['ComponentAvdT1Display'] })));

const ComponentAvdT21Display = lazy(() => import('./component-avd-t21/ComponentAvdT21Display').then(m => ({ default: m['ComponentAvdT21Display'] })));

const ComponentAvdT22Display = lazy(() => import('./component-avd-t22/ComponentAvdT22Display').then(m => ({ default: m['ComponentAvdT22Display'] })));

const ComponentAvdT22InranDisplay = lazy(() => import('./component-avd-t22inran/ComponentAvdT22InranDisplay').then(m => ({ default: m['ComponentAvdT22InranDisplay'] })));

const ComponentAvdT3Display = lazy(() => import('./component-avd-t3/ComponentAvdT3Display').then(m => ({ default: m['ComponentAvdT3Display'] })));

const ComponentAvdHa1Display = lazy(() => import('./component-avd-ha1/ComponentAvdHa1Display').then(m => ({ default: m['ComponentAvdHa1Display'] })));

const ComponentAvdHa2Display = lazy(() => import('./component-avd-ha2/ComponentAvdHa2Display').then(m => ({ default: m['ComponentAvdHa2Display'] })));

const ComponentAvdHa3Display = lazy(() => import('./component-avd-ha3/ComponentAvdHa3Display').then(m => ({ default: m['ComponentAvdHa3Display'] })));

const ComponentAvdHb1Display = lazy(() => import('./component-avd-hb1/ComponentAvdHb1Display').then(m => ({ default: m['ComponentAvdHb1Display'] })));

const ComponentAvdHb2Display = lazy(() => import('./component-avd-hb2/ComponentAvdHb2Display').then(m => ({ default: m['ComponentAvdHb2Display'] })));

const ComponentAvdHbstartDisplay = lazy(() => import('./component-avd-hbstart/ComponentAvdHbstartDisplay').then(m => ({ default: m['ComponentAvdHbstartDisplay'] })));

const ComponentAvdHc1Display = lazy(() => import('./component-avd-hc1/ComponentAvdHc1Display').then(m => ({ default: m['ComponentAvdHc1Display'] })));

const ComponentAvdHc3Display = lazy(() => import('./component-avd-hc3/ComponentAvdHc3Display').then(m => ({ default: m['ComponentAvdHc3Display'] })));

const ComponentAvdHd1Display = lazy(() => import('./component-avd-hd1/ComponentAvdHd1Display').then(m => ({ default: m['ComponentAvdHd1Display'] })));

const ComponentAvdHd3Display = lazy(() => import('./component-avd-hd3/ComponentAvdHd3Display').then(m => ({ default: m['ComponentAvdHd3Display'] })));

const Img00NativeDisplay = lazy(() => import('./img-00-native/Img00NativeDisplay').then(m => ({ default: m['Img00NativeDisplay'] })));

const Img01Canvas2dDisplay = lazy(() => import('./img-01-canvas2d/Img01Canvas2dDisplay').then(m => ({ default: m['Img01Canvas2dDisplay'] })));

const Img02ImageElementDisplay = lazy(() => import('./img-02-image-element/Img02ImageElementDisplay').then(m => ({ default: m['Img02ImageElementDisplay'] })));

const Img03ImageBitmapDisplay = lazy(() => import('./img-03-image-bitmap/Img03ImageBitmapDisplay').then(m => ({ default: m['Img03ImageBitmapDisplay'] })));

const Img04AssetsLoadDisplay = lazy(() => import('./img-04-assets-load/Img04AssetsLoadDisplay').then(m => ({ default: m['Img04AssetsLoadDisplay'] })));

const Img05AssetsInitDisplay = lazy(() => import('./img-05-assets-init/Img05AssetsInitDisplay').then(m => ({ default: m['Img05AssetsInitDisplay'] })));

const Img06TextureFromCachedDisplay = lazy(() => import('./img-06-texture-from-cached/Img06TextureFromCachedDisplay').then(m => ({ default: m['Img06TextureFromCachedDisplay'] })));

const Img07SpriteFromDisplay = lazy(() => import('./img-07-sprite-from/Img07SpriteFromDisplay').then(m => ({ default: m['Img07SpriteFromDisplay'] })));

const Img08TextureFromRawDisplay = lazy(() => import('./img-08-texture-from-raw/Img08TextureFromRawDisplay').then(m => ({ default: m['Img08TextureFromRawDisplay'] })));

const Img09AssetsPreloadDisplay = lazy(() => import('./img-09-assets-preload/Img09AssetsPreloadDisplay').then(m => ({ default: m['Img09AssetsPreloadDisplay'] })));

const Step01DomTextDisplay = lazy(() => import('./step-01-dom-text/Step01DomTextDisplay').then(m => ({ default: m['Step01DomTextDisplay'] })));

const Step02DomDialogueDisplay = lazy(() => import('./step-02-dom-dialogue/Step02DomDialogueDisplay').then(m => ({ default: m['Step02DomDialogueDisplay'] })));

const Step03DomTypingDisplay = lazy(() => import('./step-03-dom-typing/Step03DomTypingDisplay').then(m => ({ default: m['Step03DomTypingDisplay'] })));

const Step04DomLayerDisplay = lazy(() => import('./step-04-dom-layer/Step04DomLayerDisplay').then(m => ({ default: m['Step04DomLayerDisplay'] })));

const Step05DomAvdDisplay = lazy(() => import('./step-05-dom-avd/Step05DomAvdDisplay').then(m => ({ default: m['Step05DomAvdDisplay'] })));

const ComponentExHA11DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-ha11-dom/ComponentExHA11DomDisplay').then(m => ({ default: m['ComponentExHA11DomDisplay'] })));

const ComponentExHA12DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-ha12-dom/ComponentExHA12DomDisplay').then(m => ({ default: m['ComponentExHA12DomDisplay'] })));

const ComponentExHB11DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-hb11-dom/ComponentExHB11DomDisplay').then(m => ({ default: m['ComponentExHB11DomDisplay'] })));

const ComponentExHB12DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-hb12-dom/ComponentExHB12DomDisplay').then(m => ({ default: m['ComponentExHB12DomDisplay'] })));

const ComponentExT1DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-t1-dom/ComponentExT1DomDisplay').then(m => ({ default: m['ComponentExT1DomDisplay'] })));

const ComponentExT2DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-t2-dom/ComponentExT2DomDisplay').then(m => ({ default: m['ComponentExT2DomDisplay'] })));

const ComponentExHA21DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-ha21-dom/ComponentExHA21DomDisplay').then(m => ({ default: m['ComponentExHA21DomDisplay'] })));

const ComponentExHA22DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-ha22-dom/ComponentExHA22DomDisplay').then(m => ({ default: m['ComponentExHA22DomDisplay'] })));

const ComponentExHA23DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-ha23-dom/ComponentExHA23DomDisplay').then(m => ({ default: m['ComponentExHA23DomDisplay'] })));

const ComponentExHA24DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-ha24-dom/ComponentExHA24DomDisplay').then(m => ({ default: m['ComponentExHA24DomDisplay'] })));

const ComponentExHA25DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-ha25-dom/ComponentExHA25DomDisplay').then(m => ({ default: m['ComponentExHA25DomDisplay'] })));

const ComponentExHA26DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-ha26-dom/ComponentExHA26DomDisplay').then(m => ({ default: m['ComponentExHA26DomDisplay'] })));

const ComponentExHB21DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-hb21-dom/ComponentExHB21DomDisplay').then(m => ({ default: m['ComponentExHB21DomDisplay'] })));

const ComponentExHB22DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-hb22-dom/ComponentExHB22DomDisplay').then(m => ({ default: m['ComponentExHB22DomDisplay'] })));

const ComponentExHB23DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-hb23-dom/ComponentExHB23DomDisplay').then(m => ({ default: m['ComponentExHB23DomDisplay'] })));

const ComponentExHB24DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-hb24-dom/ComponentExHB24DomDisplay').then(m => ({ default: m['ComponentExHB24DomDisplay'] })));

const ComponentExT21DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-t21-dom/ComponentExT21DomDisplay').then(m => ({ default: m['ComponentExT21DomDisplay'] })));

const ComponentExT22DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-t22-dom/ComponentExT22DomDisplay').then(m => ({ default: m['ComponentExT22DomDisplay'] })));

const ComponentExHC1DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-hc1-dom/ComponentExHC1DomDisplay').then(m => ({ default: m['ComponentExHC1DomDisplay'] })));

const ComponentExHC2DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-hc2-dom/ComponentExHC2DomDisplay').then(m => ({ default: m['ComponentExHC2DomDisplay'] })));

const ComponentExT3DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-t3-dom/ComponentExT3DomDisplay').then(m => ({ default: m['ComponentExT3DomDisplay'] })));

const ComponentExHD1DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-hd1-dom/ComponentExHD1DomDisplay').then(m => ({ default: m['ComponentExHD1DomDisplay'] })));

const ComponentExHD2DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-hd2-dom/ComponentExHD2DomDisplay').then(m => ({ default: m['ComponentExHD2DomDisplay'] })));

const ComponentExHD3DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-hd3-dom/ComponentExHD3DomDisplay').then(m => ({ default: m['ComponentExHD3DomDisplay'] })));

const ComponentExHE1DomDisplay = lazy(() => import('./h-scenes/rj01222693/components/component-ex-he1-dom/ComponentExHE1DomDisplay').then(m => ({ default: m['ComponentExHE1DomDisplay'] })));

const Cg01HtmlImgDisplay = lazy(() => import('./cg-01-html-img/Cg01HtmlImgDisplay').then(m => ({ default: m['Cg01HtmlImgDisplay'] })));

const Cg02PixiSpriteDisplay = lazy(() => import('./cg-02-pixi-sprite/Cg02PixiSpriteDisplay').then(m => ({ default: m['Cg02PixiSpriteDisplay'] })));

const Cg03PixiCycleDisplay = lazy(() => import('./cg-03-pixi-cycle/Cg03PixiCycleDisplay').then(m => ({ default: m['Cg03PixiCycleDisplay'] })));

const Cg04BgLayerDisplay = lazy(() => import('./cg-04-bg-layer/Cg04BgLayerDisplay').then(m => ({ default: m['Cg04BgLayerDisplay'] })));

const Cg05BgLayerMultiDisplay = lazy(() => import('./cg-05-bg-layer-multi/Cg05BgLayerMultiDisplay').then(m => ({ default: m['Cg05BgLayerMultiDisplay'] })));

const Cg06AvdNoscriptDisplay = lazy(() => import('./cg-06-avd-noscript/Cg06AvdNoscriptDisplay').then(m => ({ default: m['Cg06AvdNoscriptDisplay'] })));

const Cg07AvdScriptDisplay = lazy(() => import('./cg-07-avd-script/Cg07AvdScriptDisplay').then(m => ({ default: m['Cg07AvdScriptDisplay'] })));



































































































































// import { ComponentAvdHe1Display } from './component-avd-he1/ComponentAvdHe1Display';
// import { ComponentAvdHe2Display } from './component-avd-he2/ComponentAvdHe2Display';
// import { ComponentAvdHf1Display } from './component-avd-hf1/ComponentAvdHf1Display';
// import { ComponentAvdHg1Display } from './component-avd-hg1/ComponentAvdHg1Display';






































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
  'component-ex-ha11-dom',
  'component-ex-ha12-dom',
  'component-ex-hb11-dom',
  'component-ex-hb12-dom',
  'component-ex-t1-dom',
  'component-ex-t2-dom',
  'component-ex-ha21-dom',
  'component-ex-ha22-dom',
  'component-ex-ha23-dom',
  'component-ex-ha24-dom',
  'component-ex-ha25-dom',
  'component-ex-ha26-dom',
  'component-ex-hb21-dom',
  'component-ex-hb22-dom',
  'component-ex-hb23-dom',
  'component-ex-hb24-dom',
  'component-ex-t21-dom',
  'component-ex-t22-dom',
  'component-ex-hc1-dom',
  'component-ex-hc2-dom',
  'component-ex-t3-dom',
  'component-ex-hd1-dom',
  'component-ex-hd2-dom',
  'component-ex-hd3-dom',
  'component-ex-he1-dom',
  'cg-01-html-img',
  'cg-02-pixi-sprite',
  'cg-03-pixi-cycle',
  'cg-04-bg-layer',
  'cg-05-bg-layer-multi',
  'cg-06-avd-noscript',
  'cg-07-avd-script',
  'component-vn',
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
  'component-ex-ha11-dom': ComponentExHA11DomDisplay,
  'component-ex-ha12-dom': ComponentExHA12DomDisplay,
  'component-ex-hb11-dom': ComponentExHB11DomDisplay,
  'component-ex-hb12-dom': ComponentExHB12DomDisplay,
  'component-ex-t1-dom': ComponentExT1DomDisplay,
  'component-ex-t2-dom': ComponentExT2DomDisplay,
  'component-ex-ha21-dom': ComponentExHA21DomDisplay,
  'component-ex-ha22-dom': ComponentExHA22DomDisplay,
  'component-ex-ha23-dom': ComponentExHA23DomDisplay,
  'component-ex-ha24-dom': ComponentExHA24DomDisplay,
  'component-ex-ha25-dom': ComponentExHA25DomDisplay,
  'component-ex-ha26-dom': ComponentExHA26DomDisplay,
  'component-ex-hb21-dom': ComponentExHB21DomDisplay,
  'component-ex-hb22-dom': ComponentExHB22DomDisplay,
  'component-ex-hb23-dom': ComponentExHB23DomDisplay,
  'component-ex-hb24-dom': ComponentExHB24DomDisplay,
  'component-ex-t21-dom': ComponentExT21DomDisplay,
  'component-ex-t22-dom': ComponentExT22DomDisplay,
  'component-ex-hc1-dom': ComponentExHC1DomDisplay,
  'component-ex-hc2-dom': ComponentExHC2DomDisplay,
  'component-ex-t3-dom': ComponentExT3DomDisplay,
  'component-ex-hd1-dom': ComponentExHD1DomDisplay,
  'component-ex-hd2-dom': ComponentExHD2DomDisplay,
  'component-ex-hd3-dom': ComponentExHD3DomDisplay,
  'component-ex-he1-dom': ComponentExHE1DomDisplay,
  'cg-01-html-img': Cg01HtmlImgDisplay,
  'cg-02-pixi-sprite': Cg02PixiSpriteDisplay,
  'cg-03-pixi-cycle': Cg03PixiCycleDisplay,
  'cg-04-bg-layer': Cg04BgLayerDisplay,
  'cg-05-bg-layer-multi': Cg05BgLayerMultiDisplay,
  'cg-06-avd-noscript': Cg06AvdNoscriptDisplay,
  'cg-07-avd-script': Cg07AvdScriptDisplay,
  'component-vn': lazy(() =>
    import('./component-vn/ComponentVnDisplay').then((m) => ({ default: m.ComponentVnDisplay })),
  ),
};
