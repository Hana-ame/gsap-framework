/** framework — 统一导出入口，汇集子画布、事件总线、分层、infinite-canvas 等核心模块。 */
export { SubCanvas } from './SubCanvas';
export type { Rect, SubPointerType, SubPointerEvent, SubDragMode, SubCanvasOptions } from './SubCanvasTypes';
export { SubCanvasProxy } from './SubCanvasProxy';
export type { SubCanvasProxyOptions } from './SubCanvasProxy';
export { EventBus } from './EventBus';
export { startPixiApp } from './PixiApp';
export { enablePerfMeasure, disablePerfMeasure } from './perf';
export { InfiniteCanvas } from './InfiniteCanvas';
export type { InfiniteCanvasOptions, Chunk, InfiniteCanvasPlugin } from './InfiniteCanvasTypes';

export { LayerManager } from './Layer';
export type { Layer } from './Layer';
export { runTextEffect, text } from './text-effects';
export type { TextEffectType, TextEffectHandle, TextSegment } from './text-effects';
export { DragController } from './DragController';
export type { DragMode, DragOptions, DragContext } from './DragController';
export { bringToFront, sendToBack } from './ZOrderManager';
import './gsap-pixi';
