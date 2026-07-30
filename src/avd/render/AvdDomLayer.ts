import { DomLayer } from '@framework/render/DomLayer';
import { DomContainer } from '@framework/render/dom/DomNode';
import { DomDialogueBox } from '../dom/DomDialogueBox';
import { DomPortraitLayer } from '../dom/DomPortraitLayer';
import { DomBackgroundLayer } from '../dom/DomBackgroundLayer';
import { DomScreenEffects } from '../dom/DomScreenEffects';
import { DomTypingEngine } from '../dom/DomTypingEngine';
import type { IRenderContainer } from '@framework/render/types';
import type {
  IAvdRenderLayer,
  IDialogueBoxHandle, IPortraitLayerHandle,
  IBackgroundLayerHandle, IScreenEffectsHandle, ITypingEngineHandle,
} from './types';

export class AvdDomLayer extends DomLayer implements IAvdRenderLayer {
  constructor(parentEl: HTMLElement, screenW: number, screenH: number) {
    super(parentEl, screenW, screenH);
  }

  createDialogueBox(parent: IRenderContainer, opts: any): IDialogueBoxHandle {
    return new DomDialogueBox(parent as DomContainer, opts);
  }

  createPortraitLayer(parent: IRenderContainer, opts: any): IPortraitLayerHandle {
    return new DomPortraitLayer(parent as DomContainer, opts);
  }

  createBackgroundLayer(parent: IRenderContainer, opts: any): IBackgroundLayerHandle {
    return new DomBackgroundLayer(parent as DomContainer, opts);
  }

  createScreenEffects(parent: IRenderContainer): IScreenEffectsHandle {
    return new DomScreenEffects(parent as DomContainer);
  }

  createTypingEngine(): ITypingEngineHandle {
    return new DomTypingEngine();
  }
}
