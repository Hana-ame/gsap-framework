// Layer — 基于 zIndex 的分层系统。
// LayerManager 管理一组命名层，每个层是一个独立的 PIXI.Container，
// 通过 sortableChildren 实现层叠顺序。类比 DOM 的 z-index 层。

import * as PIXI from 'pixi.js';
import { DirtyPropagator } from './DirtyPropagator';

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
  readonly propagator = new DirtyPropagator();

  // 需要父容器启用 sortableChildren，否则 zIndex 不生效
  constructor(parent: PIXI.Container) {
    this._parent = parent;
    this._parent.sortableChildren = true;

    // 脏传播根节点 flush → 执行 renormalization
    this.propagator.onFlush = () => this._renormIfNeeded();
  }

  // 重名时销毁旧层再建（而非报错），适应 HMR 热替换场景
  add(name: string, zIndex: number): Layer {
    if (this._layers.has(name)) {
      console.warn(`[LayerManager] overwriting layer: "${name}"`);
      this._layers.get(name)!.destroy();
    }
    const layer = new LayerImpl(name, zIndex);
    layer.propagator.attach(this.propagator);
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
    layer.propagator.mark();
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
    layer.propagator.mark();
  }

  /** 执行所有待处理的脏节点 flush。建议在 ticker 尾部调用。 */
  flush(): void {
    this.propagator.clean();
  }

  private _renormIfNeeded(): void {
    if (this._parent.children.length < 2) return;
    const maxZ = Math.max(...this._parent.children.map(c => c.zIndex));
    if (maxZ < 1_000_000) return;
    this._parent.children.forEach((c, i) => { c.zIndex = i; });
  }

  // 防御性编程：destroyed 标志防止重复销毁
  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    for (const layer of this._layers.values()) layer.destroy();
    this._layers.clear();
    this.propagator.destroy();
  }

  get destroyed(): boolean {
    return this._destroyed;
  }

}

// LayerImpl 不对外暴露，强制通过 LayerManager 操作层，
// 避免外部直接 new 导致层脱离管理器管控
class LayerImpl implements Layer {
  readonly name: string;
  readonly container: PIXI.Container;
  readonly propagator = new DirtyPropagator();
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
