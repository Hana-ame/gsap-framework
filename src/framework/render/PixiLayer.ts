import * as PIXI from 'pixi.js';
import type {
  IRenderLayer, IRenderContainer, IRenderGraphics,
  IRenderText, IRenderSprite,
} from './types';

export class PixiLayer implements IRenderLayer {
  readonly screenW: number;
  readonly screenH: number;
  readonly root: IRenderContainer;
  readonly emptyTexture: any = PIXI.Texture.EMPTY;

  protected _rootPixi: PIXI.Container;

  constructor(parent: PIXI.Container, _ticker: PIXI.Ticker, screenW: number, screenH: number) {
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

  destroy(): void {
    this._rootPixi.destroy({ children: true });
  }
}
