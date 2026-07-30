export type {
  IRenderContainer, IRenderGraphics, IRenderText, IRenderSprite, IRenderLayer,
} from '@framework/render/types';

import type { AvdChoice, AvdState, SpeakerStyle } from '../types';

// ── 子组件接口 ──

export interface IDialogueBoxHandle {
  container: IRenderContainer;
  setSpeaker(name: string | null, style?: SpeakerStyle): void;
  setTextContainer(container: IRenderContainer): void;
  setAlpha(a: number): void;
  setOffsetY(y: number): void;
  updateArrow(state: AvdState, phase: number): void;
  applyOptions(partial: any): void;
  destroy(): void;
}

export interface IPortraitLayerHandle {
  container: IRenderContainer;
  setTarget(pos: string | null, texture: any, l2dView?: any): void;
  setAll(entries: Array<{ pos: string; texture: any; alpha: number }>): void;
  updateL2D(deltaMS: number): void;
  applyOptions(partial: any): void;
  destroy(): void;
}

export interface IBackgroundLayerHandle {
  container: IRenderContainer;
  setBackground(texture: any): void;
  applyOptions(partial: any): void;
  destroy(): void;
}

export interface IScreenEffectsHandle {
  container: IRenderContainer;
  setTarget(target: IRenderContainer): void;
  shake(intensity?: number, duration?: number): void;
  flash(color?: number, duration?: number): void;
  fadeOut(duration?: number, onComplete?: () => void): void;
  fadeIn(duration?: number, onComplete?: () => void): void;
  resize(w: number, h: number): void;
  destroy(): void;
}

export interface ITypingEngineHandle {
  active: boolean;
  totalUnits: number;
  container: IRenderContainer | null;
  effect: string;
  start(
    text: any,
    speed: number,
    style: any,
    maxWidth: number,
    lineHeight: number,
    onComplete?: () => void,
  ): IRenderContainer;
  update(deltaMS: number): void;
  setEffect(effect: string): void;
  complete(): void;
  destroy(): void;
}

// ── AVD 扩展渲染层接口 ──

export interface IAvdRenderLayer extends IRenderLayer {
  createDialogueBox(parent: IRenderContainer, opts: any): IDialogueBoxHandle;
  createPortraitLayer(parent: IRenderContainer, opts: any): IPortraitLayerHandle;
  createBackgroundLayer(parent: IRenderContainer, opts: any): IBackgroundLayerHandle;
  createScreenEffects(parent: IRenderContainer): IScreenEffectsHandle;
  createTypingEngine(): ITypingEngineHandle;
}
