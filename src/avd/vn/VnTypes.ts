/**
 * VnTypes — 通用视觉小说中间格式
 *
 * 设计目标：所有 VN 引擎（Kirikiri/KAG、ONS、Ren'Py、RMMZ 等）
 * 通过适配器转换为此格式，框架统一消费。
 *
 * 核心原则：
 *   1. 纯数据 — 可 JSON.stringify()，无函数/类实例
 *   2. 无歧义 — 每条 op 的语义在所有引擎中一致
 *   3. 完备性 — 覆盖 KAG/ONS/Ren'Py/RMMZ 的全部操作
 *   4. 可扩展 — 每个 op 保留 rawAttrs 兜底
 */

// ── 顶层 ──

export interface VnScriptJSON {
  version: number;
  meta?: VnMeta;
  resources?: VnResources;
  ops: VnOp[];
}

export interface VnMeta {
  title?: string;
  width?: number;
  height?: number;
  fontFamily?: string;
  typewriterSpeed?: number;
  textSpeed?: number;
  [key: string]: unknown;
}

export interface VnResources {
  images?: Record<string, string>;
  audio?: Record<string, string>;
  fonts?: string[];
  characters?: Record<string, VnCharacterDef>;
  [key: string]: unknown;
}

export interface VnCharacterDef {
  name: string;
  images?: Record<string, string>;
  defaultPosition?: string;
}

// ── 操作（op）联合类型 ──

export type VnOp =
  | VnOpDialog
  | VnOpBg
  | VnOpChar
  | VnOpVoice
  | VnOpBgm
  | VnOpSfx
  | VnOpWait
  | VnOpChoice
  | VnOpJump
  | VnOpCall
  | VnOpReturn
  | VnOpLabel
  | VnOpEnd
  | VnOpSetFlag
  | VnOpClearFlag
  | VnOpSetVar
  | VnOpIf
  | VnOpShake
  | VnOpFlash
  | VnOpFadeTo
  | VnOpFadeFrom
  | VnOpEval
  | VnOpComment
  | VnOpRaw
  | VnOpMacro
  | VnOpEndMacro
  | VnOpExpand
  | VnOpLayer
  | VnOpMoveLayer
  | VnOpHideLayer;

// ── 各操作定义 ──

export interface VnOpDialog {
  type: 'dialog';
  speaker?: string;
  text: string | VnTextSegment[];
  bg?: string;
  bgm?: string;
  sfx?: string;
  voice?: string;
  characters?: VnCharPlacement[];
  effects?: string[];
  transition?: VnTransition;
  wait?: number;
  label?: string;
  end?: boolean;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpBg {
  type: 'bg';
  image: string;
  transition?: string;
  duration?: number;
  layer?: number;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpChar {
  type: 'char';
  id: string;
  image?: string;
  position?: string;
  left?: number;
  top?: number;
  opacity?: number;
  transition?: string;
  duration?: number;
  layer?: number;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpVoice {
  type: 'voice';
  file: string;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpBgm {
  type: 'bgm';
  file: string;
  loop?: boolean;
  fadeIn?: number;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpSfx {
  type: 'sfx';
  file: string;
  loop?: boolean;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpWait {
  type: 'wait';
  duration: number;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpChoice {
  type: 'choice';
  text: string;
  jump?: string;
  call?: string;
  condition?: string;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpJump {
  type: 'jump';
  target: string;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpCall {
  type: 'call';
  target: string;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpReturn {
  type: 'return';
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpLabel {
  type: 'label';
  name: string;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpEnd {
  type: 'end';
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpSetFlag {
  type: 'setFlag';
  name: string;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpClearFlag {
  type: 'clearFlag';
  name: string;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpSetVar {
  type: 'setVar';
  name: string;
  value: number | string | boolean;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpIf {
  type: 'if';
  condition: string;
  then: VnOp[];
  elseIf?: Array<{ condition: string; body: VnOp[] }>;
  else?: VnOp[];
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpShake {
  type: 'shake';
  intensity?: number;
  duration?: number;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpFlash {
  type: 'flash';
  color?: string;
  duration?: number;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpFadeTo {
  type: 'fadeTo';
  color?: string;
  duration?: number;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpFadeFrom {
  type: 'fadeFrom';
  color?: string;
  duration?: number;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpEval {
  type: 'eval';
  expr: string;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpComment {
  type: 'comment';
  text: string;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpRaw {
  type: 'raw';
  content: string;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpMacro {
  type: 'macro';
  name: string;
  body: VnOp[];
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpEndMacro {
  type: 'endmacro';
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpExpand {
  type: 'expand';
  name: string;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpLayer {
  type: 'layer';
  action: 'show' | 'hide' | 'set';
  image: string;
  layer: number;
  left?: number;
  top?: number;
  opacity?: number;
  transition?: string;
  duration?: number;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpMoveLayer {
  type: 'moveLayer';
  layer: number;
  left?: number;
  top?: number;
  opacity?: number;
  scale?: number;
  duration?: number;
  rawAttrs?: Record<string, unknown>;
}

export interface VnOpHideLayer {
  type: 'hideLayer';
  layer: number;
  duration?: number;
  rawAttrs?: Record<string, unknown>;
}

// ── 辅助类型 ──

export interface VnTextSegment {
  kind: 'text' | 'image' | 'ruby' | 'font';
  text?: string;
  textureKey?: string;
  width?: number;
  height?: number;
  ruby?: string;
  color?: string;
  size?: number;
  bold?: boolean;
  italic?: boolean;
}

export interface VnCharPlacement {
  id: string;
  image?: string;
  position?: string;
  left?: number;
  top?: number;
  opacity?: number;
  expression?: string;
}

export interface VnTransition {
  type: string;
  duration: number;
  params?: Record<string, unknown>;
}
