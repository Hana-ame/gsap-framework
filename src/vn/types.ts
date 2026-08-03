/**
 * 剧本（VN script）类型定义 — 全新剧本驱动播放器。
 *
 * 剧本 = 纯数据（JSON 可序列化），资源 URL 直接内联在指令里。
 * 播放器按行推进，遇到 preload 时加载资源，wait 控制是否等待。
 */

/** 一条资源声明：key 是逻辑名，url 是完整地址（本地同源或外链均可）。 */
export interface VnAsset {
  key: string;
  url: string;
}

/** 预加载指令：声明本剧本需要的资源，wait=true 时加载完才继续。 */
export interface VnPreload {
  type: 'preload';
  assets: VnAsset[];
  /** true=等全部加载完成再继续；false/缺省=立即继续，资源后台加载。 */
  wait?: boolean;
}

/** 对话指令。speaker 为空串 = 旁白。 */
export interface VnSay {
  type: 'say';
  speaker: string;
  text: string;
  /** 可选：换背景（key 须在 preload 里声明过）。 */
  bg?: string;
  effect?: 'shake' | 'flash';
}

/** 背景指令：切到指定资源 key。 */
export interface VnBg {
  type: 'bg';
  key: string;
  /** 进入动画时长 ms，0=无动画。 */
  fadeMs?: number;
}

/** 选项指令。每个选项跳到 label 或行号。 */
export interface VnChoice {
  type: 'choice';
  options: Array<{ text: string; to: string; showWhen?: string }>;
}

/** 跳转指令：跳到 label。 */
export interface VnJump {
  type: 'jump';
  to: string;
}

/** 标签指令：跳转目标。 */
export interface VnLabel {
  type: 'label';
  name: string;
}

/** 结束指令。 */
export interface VnEnd {
  type: 'end';
}

export type VnLine = VnPreload | VnSay | VnBg | VnChoice | VnJump | VnLabel | VnEnd;

/** 剧本：meta（可选全局配置）+ lines。 */
export interface VnScript {
  meta?: {
    /** 加载完再继续 还是 不等也能继续。true=严格等待（默认）。 */
    strictLoad?: boolean;
    fontFamily?: string;
    textSize?: number;
    boxHeight?: number;
  };
  lines: VnLine[];
}
