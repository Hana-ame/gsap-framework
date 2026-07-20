/** InfiniteCanvasTypes — InfiniteCanvas 体系共享的类型定义（块、插件、选项）。 */
import * as PIXI from 'pixi.js';
import type { SubCanvas } from './SubCanvas';
import type { SubPointerEvent, Rect } from './SubCanvasTypes';
import type { InfiniteCanvas } from './InfiniteCanvas';

export interface Chunk {
  readonly cx: number;
  readonly cy: number;
  readonly container: PIXI.Container;
  readonly bounds: Rect;
}

export interface InfiniteCanvasPlugin {
  readonly name: string;
  priority: number;
  parent: InfiniteCanvas;
  onDown?(e: SubPointerEvent): void;
  onMove?(e: SubPointerEvent): void;
  onUp?(e: SubPointerEvent): void;
  onTap?(worldX: number, worldY: number): void;
  onUpdate?(elapsed: number): void;
  onResize?(): void;
  onDestroy?(): void;
}

export interface InfiniteCanvasOptions {
  parent: SubCanvas;
  viewport: Rect;
  chunkSize: number;
  preloadMargin?: number;
  chunkCreate: (chunk: Chunk) => void;
  chunkDestroy: (chunk: Chunk) => void;
  onDrag?: (worldX: number, worldY: number) => void;
  onTap?: (worldX: number, worldY: number) => void;
  decelerate?: boolean;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
}
