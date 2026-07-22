import { DomContainer, DomGraphics, DomText, DomSprite, DomTexture } from '../dom/DomNode';
import { DomDialogueBox } from '../dom/DomDialogueBox';
import { DomPortraitLayer } from '../dom/DomPortraitLayer';
import { DomBackgroundLayer } from '../dom/DomBackgroundLayer';
import { DomScreenEffects } from '../dom/DomScreenEffects';
import { DomTypingEngine } from '../dom/DomTypingEngine';
import type {
  IRenderLayer, IRenderContainer, IRenderGraphics,
  IRenderText, IRenderSprite,
  IDialogueBoxHandle, IPortraitLayerHandle,
  IBackgroundLayerHandle, IScreenEffectsHandle, ITypingEngineHandle,
} from './types';

export class DomLayer implements IRenderLayer {
  readonly screenW: number;
  readonly screenH: number;
  readonly root: DomContainer;
  readonly emptyTexture: any = DomTexture.EMPTY;

  private _rootDom: DomContainer;
  private _parentEl: HTMLElement;

  constructor(parentEl: HTMLElement, screenW: number, screenH: number) {
    this._parentEl = parentEl;
    this.screenW = screenW;
    this.screenH = screenH;

    this._rootDom = new DomContainer();
    this._rootDom.el.style.position = 'relative';
    this._rootDom.el.style.width = '100%';
    this._rootDom.el.style.height = '100%';
    this._rootDom.el.style.overflow = 'hidden';
    parentEl.appendChild(this._rootDom.el);
    this.root = this._rootDom;
  }

  createContainer(): IRenderContainer {
    return new DomContainer();
  }

  createLayer(zIndex: number): IRenderContainer {
    const c = new DomContainer();
    c.zIndex = zIndex;
    this._rootDom.addChild(c);
    return c;
  }

  createGraphics(): IRenderGraphics {
    return new DomGraphics();
  }

  createText(opts?: { text?: string; style?: any }): IRenderText {
    return new DomText(opts);
  }

  createSprite(texture?: any): IRenderSprite {
    return new DomSprite(texture);
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

  destroy(): void {
    this._rootDom.destroy({ children: true });
    if (this._rootDom.el.parentNode) {
      this._rootDom.el.parentNode.removeChild(this._rootDom.el);
    }
  }
}
