/**
 * RenderLayer — 抽象渲染层，让 AvdController 在不同渲染后端（Pixi / DOM）间复用。
 *
 * 分层设计：
 *   IRenderLayer    → 渲染层接口（工厂方法 + 动画 + 纹理）
 *   IRender*        → 显示对象接口（Container / Graphics / Text / Sprite）
 *   I*Handle        → 子组件接口（DialogueBox / PortraitLayer / 等）
 *
 * 层实现：
 *   PixiLayer  → 使用 PIXI 组件
 *   DomLayer   → 使用 Dom* 组件
 */
import type { AvdChoice, AvdState, SpeakerStyle } from '../types';
import type { TextEffect } from '../dom/DomTypingEngine';

// ── 基础显示对象接口 ──

export interface IRenderContainer {
  alpha: number; x: number; y: number; visible: boolean;
  eventMode: string; cursor: string;
  width: number; height: number;
  addChild(child: any): void;
  removeChild(child: any): void;
  removeChildren(): any[];
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
  effect: TextEffect;
  start(
    text: any,
    speed: number,
    style: any,
    maxWidth: number,
    lineHeight: number,
    onComplete?: () => void,
  ): IRenderContainer;
  update(deltaMS: number): void;
  setEffect(effect: TextEffect): void;
  complete(): void;
  destroy(): void;
}

// ── 渲染层接口 ──

export interface IRenderLayer {
  readonly screenW: number;
  readonly screenH: number;
  readonly root: IRenderContainer;
  readonly emptyTexture: any;

  createContainer(): IRenderContainer;
  createGraphics(): IRenderGraphics;
  createText(opts?: { text?: string; style?: any }): IRenderText;
  createSprite(texture?: any): IRenderSprite;

  createDialogueBox(parent: IRenderContainer, opts: any): IDialogueBoxHandle;
  createPortraitLayer(parent: IRenderContainer, opts: any): IPortraitLayerHandle;
  createBackgroundLayer(parent: IRenderContainer, opts: any): IBackgroundLayerHandle;
  createScreenEffects(parent: IRenderContainer): IScreenEffectsHandle;
  createTypingEngine(): ITypingEngineHandle;

  destroy(): void;
}
