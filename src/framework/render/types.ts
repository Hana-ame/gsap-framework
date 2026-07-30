export interface IRenderContainer {
  alpha: number; x: number; y: number; visible: boolean;
  eventMode: string; cursor: string;
  width: number; height: number; zIndex: number; label: string;
  parent: IRenderContainer | null;
  readonly children: readonly IRenderContainer[];
  addChild(child: any): any;
  removeChild(child: any): any;
  removeChildren(): any[];
  getChildAt(index: number): IRenderContainer | null;
  getChildByLabel(label: string): IRenderContainer | null;
  destroy(opts?: { children?: boolean }): void;
}

export interface IRenderGraphics extends IRenderContainer {
  clear(): this;
  rect(x: number, y: number, w: number, h: number): this;
  roundRect(x: number, y: number, w: number, h: number, r: number): this;
  circle(x: number, y: number, r: number): this;
  moveTo(x: number, y: number): this;
  lineTo(x: number, y: number): this;
  fill(opts: { color: number; alpha?: number }): this;
  stroke(opts: { color: number; width?: number; alpha?: number }): this;
}

export interface IRenderText extends IRenderContainer {
  text: string;
  style: any;
}

export interface IRenderSprite extends IRenderContainer {
  texture: any;
  anchor: { x: number; y: number; set(x: number, y?: number): void };
  tint: number;
}

/** Visual effects applied to typing text in dialogue boxes. */
export type TextEffect = 'none' | 'wave' | 'shake' | 'rainbow';

export interface IRenderLayer {
  readonly screenW: number;
  readonly screenH: number;
  readonly root: IRenderContainer;
  readonly emptyTexture: any;

  createContainer(): IRenderContainer;
  createGraphics(): IRenderGraphics;
  createText(opts?: { text?: string; style?: any }): IRenderText;
  createSprite(texture?: any): IRenderSprite;
  createLayer(zIndex: number): IRenderContainer;

  destroy(): void;
}
