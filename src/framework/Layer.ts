import * as PIXI from 'pixi.js';

export interface Layer {
  readonly name: string;
  readonly container: PIXI.Container;
  show(): void;
  hide(): void;
  setAlpha(alpha: number): void;
  get alpha(): number;
  addChild<T extends PIXI.Container>(child: T): T;
  removeChild<T extends PIXI.Container>(child: T): T;
  removeChildren(): PIXI.Container[];
  destroy(): void;
}

export class LayerManager {
  private _parent: PIXI.Container;
  private _layers: Map<string, LayerImpl> = new Map();
  private _destroyed = false;

  constructor(parent: PIXI.Container) {
    this._parent = parent;
    this._parent.sortableChildren = true;
  }

  add(name: string, zIndex: number): Layer {
    if (this._layers.has(name)) {
      console.warn(`[LayerManager] overwriting layer: "${name}"`);
      this._layers.get(name)!.destroy();
    }
    const layer = new LayerImpl(name, zIndex);
    this._layers.set(name, layer);
    this._parent.addChild(layer.container);
    return layer;
  }

  get(name: string): Layer | undefined {
    return this._layers.get(name);
  }

  remove(name: string): boolean {
    const layer = this._layers.get(name);
    if (!layer) return false;
    layer.destroy();
    this._layers.delete(name);
    return true;
  }

  has(name: string): boolean {
    return this._layers.has(name);
  }

  names(): string[] {
    return [...this._layers.keys()];
  }

  bringToFront(name: string): void {
    const layer = this._layers.get(name);
    if (!layer) return;
    let max = layer.container.zIndex;
    for (const child of this._parent.children) {
      if (child === layer.container) continue;
      if (child.zIndex > max) max = child.zIndex;
    }
    layer.container.zIndex = max + 1;
  }

  sendToBack(name: string): void {
    const layer = this._layers.get(name);
    if (!layer) return;
    let min = layer.container.zIndex;
    for (const child of this._parent.children) {
      if (child === layer.container) continue;
      if (child.zIndex < min) min = child.zIndex;
    }
    layer.container.zIndex = min - 1;
  }

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    for (const layer of this._layers.values()) layer.destroy();
    this._layers.clear();
  }

  get destroyed(): boolean {
    return this._destroyed;
  }

  get parent(): PIXI.Container {
    return this._parent;
  }
}

class LayerImpl implements Layer {
  readonly name: string;
  readonly container: PIXI.Container;
  private _destroyed = false;

  constructor(name: string, zIndex: number) {
    this.name = name;
    this.container = new PIXI.Container();
    this.container.label = `layer:${name}`;
    this.container.zIndex = zIndex;
    this.container.sortableChildren = true;
  }

  show(): void {
    this.container.visible = true;
  }

  hide(): void {
    this.container.visible = false;
  }

  setAlpha(alpha: number): void {
    this.container.alpha = alpha;
  }

  get alpha(): number {
    return this.container.alpha;
  }

  addChild<T extends PIXI.Container>(child: T): T {
    return this.container.addChild(child) as T;
  }

  removeChild<T extends PIXI.Container>(child: T): T {
    return this.container.removeChild(child) as T;
  }

  removeChildren(): PIXI.Container[] {
    return this.container.removeChildren();
  }

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    if (this.container.parent) this.container.parent.removeChild(this.container);
    this.container.destroy({ children: true });
  }

  get destroyed(): boolean {
    return this._destroyed;
  }
}
