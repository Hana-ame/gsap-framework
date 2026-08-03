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

/** 变量值：choice.set 写入 / 条件表达式引用的值。 */
export type VnValue = string | number | boolean;

/** 对话指令。speaker 为空串 = 旁白。 */
export interface VnSay {
  type: 'say';
  speaker: string;
  text: string;
  /** 可选：背景图（key 或完整 URL）。背景层 cover 占满。 */
  bg?: string;
  /** 可选：CG 图（key 或完整 URL）。CG 层 contain 看全。 */
  cg?: string;
  /** 可选：立绘（key 或完整 URL）。半身像，底部对齐。 */
  stand?: string;
  /** 立绘位置（默认 'left'）。 */
  standPos?: 'left' | 'center' | 'right';
  /** 图层序号（默认 0）。同 index 时 cg 在 bg 前。 */
  index?: number;
  /** 可选：z 顺序（叠加排序）。 */
  zIndex?: number;
  /** 换图淡入时长 ms（0=无动画）。 */
  fadeMs?: number;
  effect?: 'shake' | 'flash';
}

/** 背景指令：切到指定背景资源（key 或完整 URL）。背景层 cover 占满。 */
export interface VnBg {
  type: 'bg';
  key: string;
  /** 图层序号（默认 0）。 */
  index?: number;
  /** 可选：z 顺序。 */
  zIndex?: number;
  /** 进入动画时长 ms，0=无动画。 */
  fadeMs?: number;
}

/** CG 指令：切到指定 CG 资源（key 或完整 URL）。CG 层 contain 看全。 */
export interface VnCg {
  type: 'cg';
  key: string;
  /** 图层序号（默认 0）。 */
  index?: number;
  /** 可选：z 顺序。 */
  zIndex?: number;
  fadeMs?: number;
}

/** 选项指令。每个选项跳到 label 或行号。 */
export interface VnChoiceOption {
  text: string;
  to: string;
  /** 条件：满足才显示（如 "$flag == 'a'"）。缺省始终显示。 */
  showWhen?: string;
  /** 选中后写入 vars（如 { flag: 'a' }），供后续 showWhen / jump.if 引用。 */
  set?: Record<string, VnValue>;
}

export interface VnChoice {
  type: 'choice';
  options: VnChoiceOption[];
}

/** 跳转指令：跳到 label、'menu'（回菜单）、完整 URL（打开网页），或场景名。 */
export interface VnJump {
  type: 'jump';
  to: string;
  /** 条件：满足才跳转；不满足则跳过继续下一行（如 "$flag == 'a'" 或 "$flag" 真值）。 */
  if?: string;
}

/** 标签指令：跳转目标。 */
export interface VnLabel {
  type: 'label';
  name: string;
}

/** 结束指令。可选 goto：'#vn-menu' 回菜单、完整 URL 开网页、场景名加载。 */
export interface VnEnd {
  type: 'end';
  goto?: string;
}

export type VnLine = VnPreload | VnSay | VnBg | VnCg | VnChoice | VnJump | VnLabel | VnEnd;

/** UI 布局/样式声明（可选）。缺省用框架默认。 */
export interface VnUiStyle {
  /** 对话框位置/样式。 */
  dialog?: {
    left?: string | number; right?: string | number; top?: string | number; bottom?: string | number;
    align?: 'left' | 'center' | 'right';
    bg?: string; color?: string; textSize?: number; radius?: number;
    minHeight?: number; padding?: string;
    /** 换台词时淡入上浮动画（默认 false）。 */
    animate?: boolean;
  };
  /** 选项列表样式。 */
  choice?: {
    align?: 'center' | 'left' | 'right';
    itemBg?: string; itemColor?: string; fontSize?: number; gap?: number;
    /** 出现时淡入上浮动画（默认 false）。 */
    animate?: boolean;
  };
  /** CG 显示框（contain）。 */
  cgBox?: {
    aspect?: number;       // 宽高比，默认 16/9
    maxWidth?: string;     // 如 'calc(100vh * 16 / 9)'，默认同
  };
}

/** 剧本：meta（可选全局配置）+ lines。 */
export interface VnScript {
  meta?: {
    /** 加载完再继续 还是 不等也能继续。true=严格等待（默认）。 */
    strictLoad?: boolean;
    fontFamily?: string;
    textSize?: number;
    boxHeight?: number;
    /** 打字机每字间隔 ms（默认 30）。0=瞬间显示全文。 */
    typeSpeed?: number;
    /** 默认图片显示模式：cg=看全(contain)，bg=占满(cover)。 */
    bgMode?: 'cg' | 'bg';
    /** UI 布局/样式声明。 */
    ui?: VnUiStyle;
  };
  lines: VnLine[];
}
