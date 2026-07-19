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

const registry = new Map<string, ComponentFactory>();

export function registerComponent<T extends ComponentOptions>(
  type: string,
  factory: ComponentFactory<T>,
): void {
  if (registry.has(type)) {
    console.warn(`[component] overriding registered type: "${type}"`);
  }
  registry.set(type, factory);
}

export function registeredTypes(): string[] {
  return [...registry.keys()];
}

export function getComponentFactory<T extends ComponentOptions = ComponentOptions>(
  type: string,
): ComponentFactory<T> | undefined {
  return registry.get(type) as ComponentFactory<T> | undefined;
}

export function createComponent<T extends ComponentOptions = ComponentOptions>(
  type: string,
  opts: T,
): Component<T> {
  const factory = registry.get(type);
  if (!factory) throw new Error(`[component] unknown type: "${type}"`);
  return factory(opts);
}

export function createComponentFromMap<T extends ComponentOptions = ComponentOptions>(
  opts: { type: string } & T,
): Component<T> {
  return createComponent(opts.type, opts);
}
