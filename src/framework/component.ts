// component — 组件工厂注册表模式。
// 外部通过 registerComponent 注册类型名到工厂函数，
// createComponent 按名查找并实例化。类似 DI 容器的最小版本。

import * as PIXI from 'pixi.js';
import type { SubCanvas } from './SubCanvas';

export interface ComponentOptions {
  parent: SubCanvas;
  x?: number;
  y?: number;
  width: number;
  height: number;
}

export interface Component<T extends ComponentOptions = ComponentOptions> {
  readonly type: string;
  readonly stage: PIXI.Container;
  destroy(): void;
  readonly destroyed: boolean;
}

export interface ComponentHandle {
  readonly stage: PIXI.Container;
  destroy(): void;
  readonly destroyed: boolean;
}

export type ComponentFactory<T extends ComponentOptions = ComponentOptions> = (opts: T) => Component<T>;

// 全局注册表，所有组件工厂共享此容器
const registry = new Map<string, ComponentFactory>();

// 注册全局可覆写，HMR 场景下可能重复注册，warn 而非 throw
export function registerComponent<T extends ComponentOptions>(
  type: string,
  factory: ComponentFactory<T>,
): void {
  if (registry.has(type)) {
    console.warn(`[component] overriding registered type: "${type}"`);
  }
  registry.set(type, factory);
}

// 从注册表按 type 查找工厂并创建组件，未注册时抛异常而非静默失败
export function createComponent<T extends ComponentOptions = ComponentOptions>(
  type: string,
  opts: T,
): Component<T> {
  const factory = registry.get(type);
  if (!factory) throw new Error(`[component] unknown type: "${type}"`);
  return factory(opts);
}

// 供测试/工具使用
/* @internal */
export function _registeredTypes(): string[] {
  return [...registry.keys()];
}

/* @internal */
export function _getComponentFactory<T extends ComponentOptions = ComponentOptions>(
  type: string,
): ComponentFactory<T> | undefined {
  return registry.get(type) as ComponentFactory<T> | undefined;
}
