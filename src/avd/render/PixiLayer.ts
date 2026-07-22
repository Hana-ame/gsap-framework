import * as PIXI from 'pixi.js';
import { DialogueBox } from '../DialogueBox';
import { PortraitLayer } from '../PortraitLayer';
import { BackgroundLayer } from '../BackgroundLayer';
import { ScreenEffects } from '../ScreenEffects';
import { TypingEngine } from '../TypingEngine';
import type {
  IRenderLayer, IRenderContainer, IRenderGraphics,
  IRenderText, IRenderSprite,
  IDialogueBoxHandle, IPortraitLayerHandle,
  IBackgroundLayerHandle, IScreenEffectsHandle, ITypingEngineHandle,
} from './types';

export class PixiLayer implements IRenderLayer {
  readonly screenW: number;
  readonly screenH: number;
  readonly root: IRenderContainer;
  readonly emptyTexture: any = PIXI.Texture.EMPTY;

  private _rootPixi: PIXI.Container;
  private _parent: PIXI.Container;

  constructor(parent: PIXI.Container, ticker: PIXI.Ticker, screenW: number, screenH: number) {
    this._parent = parent;
    this.screenW = screenW;
    this.screenH = screenH;
    this._rootPixi = new PIXI.Container();
    parent.addChild(this._rootPixi);
    this.root = this._rootPixi as unknown as IRenderContainer;
  }

  createContainer(): IRenderContainer {
    return new PIXI.Container() as unknown as IRenderContainer;
  }

  createLayer(zIndex: number): IRenderContainer {
    const c = new PIXI.Container();
    (this._rootPixi as any).sortableChildren = true;
    c.zIndex = zIndex;
    this._rootPixi.addChild(c);
    return c as unknown as IRenderContainer;
  }

  createGraphics(): IRenderGraphics {
    return new PIXI.Graphics() as unknown as IRenderGraphics;
  }

  createText(opts?: { text?: string; style?: any }): IRenderText {
    return new PIXI.Text({
      text: opts?.text ?? '',
      style: opts?.style,
    }) as unknown as IRenderText;
  }

  createSprite(texture?: any): IRenderSprite {
    return new PIXI.Sprite(texture ?? PIXI.Texture.EMPTY) as unknown as IRenderSprite;
  }

  createDialogueBox(parent: IRenderContainer, opts: any): IDialogueBoxHandle {
    return new DialogueBox(parent as unknown as PIXI.Container, opts) as unknown as IDialogueBoxHandle;
  }

  createPortraitLayer(parent: IRenderContainer, opts: any): IPortraitLayerHandle {
    return new PortraitLayer(parent as unknown as PIXI.Container, opts) as unknown as IPortraitLayerHandle;
  }

  createBackgroundLayer(parent: IRenderContainer, opts: any): IBackgroundLayerHandle {
    return new BackgroundLayer(parent as unknown as PIXI.Container, opts) as unknown as IBackgroundLayerHandle;
  }

  createScreenEffects(parent: IRenderContainer): IScreenEffectsHandle {
    return new ScreenEffects(parent as unknown as PIXI.Container) as unknown as IScreenEffectsHandle;
  }

  createTypingEngine(): ITypingEngineHandle {
    return new TypingEngine() as unknown as ITypingEngineHandle;
  }

  destroy(): void {
    this._rootPixi.destroy({ children: true });
  }
}
