import * as PIXI from 'pixi.js';
import type { SubCanvas } from './SubCanvas';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SubPointerType = 'pointerdown' | 'pointermove' | 'pointerup' | 'pointerleave' | 'tap';

export interface SubPointerEvent {
  type: SubPointerType;
  x: number;
  y: number;
  globalX: number;
  globalY: number;
  originalEvent: PointerEvent;
}

export type SubDragMode = 'title' | 'anywhere' | 'none';

export interface SubCanvasOptions {
  rootApp: PIXI.Application;
  bounds: Rect;
  parent?: SubCanvas | null;
  clipToBounds?: boolean;
  dragMode?: SubDragMode;
  dragBounds?: () => Rect | null;
  dragBringToFront?: boolean;
  tapThreshold?: number;
  onDragStart?: (e: { x: number; y: number }) => void;
  onDrag?: (e: { x: number; y: number }) => void;
  onDragEnd?: (e: { x: number; y: number }) => void;
  onDestroy?: () => void;
}

export interface DragHandlers {
  onStart?: (p: { x: number; y: number }) => void;
  onDrag?: (p: { x: number; y: number }) => void;
  onEnd?: (p: { x: number; y: number }) => void;
  getBounds?: () => Rect | null;
  bringToFront: boolean;
}
