import * as PIXI from 'pixi.js';
import { PixiLayer } from '@framework/render/PixiLayer';
import { DialogueBox } from '../DialogueBox';
import { PortraitLayer } from '../PortraitLayer';
import { BackgroundLayer } from '../BackgroundLayer';
import { ScreenEffects } from '../ScreenEffects';
import { TypingEngine } from '../TypingEngine';
import type { IRenderContainer } from '@framework/render/types';
import type {
  IAvdRenderLayer,
  IDialogueBoxHandle, IPortraitLayerHandle,
  IBackgroundLayerHandle, IScreenEffectsHandle, ITypingEngineHandle,
} from './types';

/** Runtime-safe cast: IRenderContainer → PIXI.Container (known to be same object in Pixi mode) */
function toPixiContainer(c: IRenderContainer): PIXI.Container {
  return c as unknown as PIXI.Container;
}

/** Runtime-safe cast: AVD handle → IDialogueBoxHandle (structural match in Pixi mode) */
function toHandle<T>(h: T): T {
  return h;
}

export class AvdPixiLayer extends PixiLayer implements IAvdRenderLayer {
  constructor(parent: PIXI.Container, ticker: PIXI.Ticker, screenW: number, screenH: number) {
    super(parent, ticker, screenW, screenH);
  }

  createDialogueBox(parent: IRenderContainer, opts: any): IDialogueBoxHandle {
    return toHandle(new DialogueBox(toPixiContainer(parent), opts));
  }

  createPortraitLayer(parent: IRenderContainer, opts: any): IPortraitLayerHandle {
    return toHandle(new PortraitLayer(toPixiContainer(parent), opts));
  }

  createBackgroundLayer(parent: IRenderContainer, opts: any): IBackgroundLayerHandle {
    return toHandle(new BackgroundLayer(toPixiContainer(parent), opts));
  }

  createScreenEffects(parent: IRenderContainer): IScreenEffectsHandle {
    return toHandle(new ScreenEffects(toPixiContainer(parent)));
  }

  createTypingEngine(): ITypingEngineHandle {
    return toHandle(new TypingEngine());
  }
}
