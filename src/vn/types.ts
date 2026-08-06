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

/** 挂起指令：停在当前画面，等点击才继续（不自动推进）。用于节奏停顿 / 特效定格。 */
export interface VnWait {
  type: 'wait';
  /** 可选特效：flash 白屏闪、shake 抖动（与 say 一致）。 */
  effect?: 'shake' | 'flash';
}

/** 结束指令。可选 goto：'#vn-menu' 回菜单、完整 URL 开网页、场景名加载。 */
export interface VnEnd {
  type: 'end';
  goto?: string;
}

/** 播放器操作句柄 —— 传给 hook.run 回调，可对 VN 对象进行读写/跳转/音频/存读档。 */
export interface VnHandle {
  /** 读剧本变量。 */
  getVar(name: string): VnValue | undefined;
  /** 写剧本变量（同步更新 ref，紧跟的 showWhen / jump.if 立即可读）。 */
  setVar(patch: Record<string, VnValue>): void;
  /** 跳转：label / #hash / URL / 场景名（复用 jump 语义）。 */
  jump(target: string): void;
  /** 播放预加载的音频资源（channel 缺省按资源类型推断）。 */
  playAudio(key: string, opts?: VnAudioOptions): void;
  /** 停止指定频道（缺省全部）。 */
  stopAudio(channel?: VnAudioChannel): void;
  /** 白屏闪一下。 */
  flash(): void;
  /** 画面抖动一下。 */
  shake(): void;
  /** 快存到指定槽位。 */
  save(slot: number): Promise<void>;
  /** 从指定槽位读档（当前剧本需一致）。 */
  load(slot: number): Promise<void>;
  /** 结束（可回菜单）。 */
  end(goto?: string): void;
  /** 手动清理预加载栏（隐藏 img DOM），释放内存。 */
  clearPrefetch(): void;
  /** 打开回放（Backlog）面板（无历史时无操作）。 */
  showBacklog(): void;
  /** 关闭回放面板。 */
  closeBacklog(): void;
  /** 打开设置面板。 */
  openSettings(): void;
  /** 关闭设置面板。 */
  closeSettings(): void;
  /** 切换自动播放。 */
  toggleAuto(): void;
  /** 切换跳过模式。 */
  toggleSkip(): void;
  /** 更新设置（音量/打字机速度/自动延迟等），persist 到 localStorage。 */
  setSetting(patch: Partial<VnSettings>): void;
  /** 读全局跨场景变量（跨场景共享，persist）。 */
  getGlobalVar(name: string): VnValue | undefined;
  /** 写全局跨场景变量（跨场景共享，persist；成就/统计/解锁用）。 */
  setGlobalVar(patch: Record<string, VnValue>): void;
  /** 标记场景已通关（解锁回想等）。 */
  markSeen(sceneKey: string): void;
}

/** 播放器设置（localStorage 持久化）。 */
export interface VnSettings {
  /** 各频道音量 0..1。 */
  volume: { bgm: number; sfx: number; voice: number };
  /** 打字机每字间隔 ms（0=瞬间）。 */
  typeSpeed: number;
  /** 自动播放：每行结束后到自动推进的延迟 ms。 */
  autoDelay: number;
  /** 自动播放开关。 */
  auto: boolean;
  /** 跳过模式（快进：直接补全打字、跳过 wait）。 */
  skip: boolean;
}

/** 异步钩子指令：执行一次异步逻辑 —— 内嵌函数（js/ts 场景）或声明式 fetch（json 场景），可写回变量。 */
export interface VnHook {
  type: 'hook';
  /** 事件名/埋点 key（成就/统计标识）。 */
  key?: string;
  /** JS 回调：scenario 的一部分，接收 VnHandle 直接操作播放器；async 时被 wait 等待。 */
  run?: (vn: VnHandle) => void | Promise<void>;
  /** 声明式 fetch 模式（json 场景 / 不想用函数时）。 */
  url?: string;
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
  /** 完成后写回变量。 */
  set?: Record<string, VnValue>;
  /** true=等 hook 完成再继续下一行；false/缺省=fire-and-forget 立即继续。 */
  wait?: boolean;
}

/** 音频频道：bgm 背景音乐（循环）/ sfx 音效 / voice 角色语音。 */
export type VnAudioChannel = 'bgm' | 'sfx' | 'voice';

export interface VnAudioOptions {
  channel?: VnAudioChannel;
  loop?: boolean;
  volume?: number;
  /** 播放/停止；缺省 play。 */
  action?: 'play' | 'stop';
}

/** 音频指令：播放/停止按剧本加载的音频资源。 */
export interface VnAudio {
  type: 'audio';
  /** 资源 key（preload 声明）或完整 URL。 */
  key: string;
  channel?: VnAudioChannel;
  loop?: boolean;
  volume?: number;
  /** 缺省 play。 */
  action?: 'play' | 'stop';
}

/** 菜单条目：点击跳转目标（复用 jump 语义）+ 展示元数据 + 条件显示。 */
export interface VnMenuItem {
  /** 目标：场景名 / #hash / label / URL（复用 jump/to 语义）。 */
  id: string;
  title: string;
  cover?: string;
  group?: string;
  /** 条件显示（如回想解锁 `$seen_xxx`）。 */
  showWhen?: string;
}

/** 菜单指令：数据驱动的界面（标题 / 回想列表 / 场景网格），条目即数据。 */
export interface VnMenu {
  type: 'menu';
  /** 布局：title 标题按钮 / list 回想列表 / grid 场景卡片。 */
  layout: 'list' | 'grid' | 'title';
  items: VnMenuItem[];
}

/** 自定义按钮的点击动作。 */
export type VnButtonAction =
  /** 跳转：label / #hash / https URL / 场景名（复用 jump 语义）。 */
  | { type: 'jump'; to: string }
  /** 写剧本变量并关闭本层。 */
  | { type: 'set'; set: Record<string, VnValue> }
  /** 新窗口打开链接（本层保持打开）。 */
  | { type: 'href'; url: string };

/** 自定义按钮：场景内创建的交互按钮，可配动作/条件/样式。 */
export interface VnButton {
  label: string;
  action: VnButtonAction;
  /** 条件显示（缺省始终显示）。 */
  showWhen?: string;
  /** 覆盖默认样式。 */
  style?: { bg?: string; color?: string; fontSize?: number };
}

/** 按钮指令：在场景上叠加一层自定义按钮（非阻塞，不暂停剧情推进）。buttons 为空数组 = 清除按钮层。 */
export interface VnButtons {
  type: 'buttons';
  buttons: VnButton[];
  /** 布局：column 竖排（默认）/ row 横排 / grid 网格。 */
  layout?: 'column' | 'row' | 'grid';
  /** 锚点（默认 'bottom'）。 */
  position?:
    | 'center' | 'top' | 'bottom' | 'left' | 'right'
    | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** 点击空白处关闭本层（默认 false）。 */
  dismissible?: boolean;
}

/** 立绘进出场动画类型。 */
export type VnStandEffect = 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom';

/** 立绘指令：显隐/替换立绘，带进出场动画（对齐 WebGAL 立绘演出）。 */
export interface VnStand {
  type: 'stand';
  /** 资源 key（preload 声明）或完整 URL。action==='hide' 时缺省。 */
  key?: string;
  /** 位置（默认 left）。 */
  pos?: 'left' | 'center' | 'right';
  /** show=显示/替换（默认）；hide=移出该位置立绘。 */
  action?: 'show' | 'hide';
  /** 进出场动画（默认 fade）。 */
  effect?: VnStandEffect;
  /** 动画时长 ms（默认 350）。 */
  fadeMs?: number;
}

/** 全屏转场效果类型。 */
export type VnTransitionEffect =
  | 'fade'
  | 'wipe-left' | 'wipe-right' | 'wipe-up' | 'wipe-down'
  | 'circle'
  | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down'
  | 'zoom';

/** 转场指令：全屏过场动画（盖住画面，播完继续下一行）。对齐 WebGAL 转场演出。 */
export interface VnTransition {
  type: 'transition';
  effect?: VnTransitionEffect;
  /** 动画时长 ms（默认 450）。 */
  fadeMs?: number;
  /** 转场遮罩颜色（默认黑）。 */
  color?: string;
}

/** 视频演出指令：全屏播放视频（对齐 WebGAL video 演出）。 */
export interface VnVideo {
  type: 'video';
  /** 资源 key（preload 声明）或完整 URL。 */
  key: string;
  /** 播放/停止；缺省 play。 */
  action?: 'play' | 'stop';
  /** 循环（默认 false）。 */
  loop?: boolean;
  /** 音量 0..1（默认 1）。 */
  volume?: number;
  /** contain 看全 / cover 占满（默认 contain，对齐 cg 语义）。 */
  fit?: 'contain' | 'cover';
  /** 播完是否自动继续下一行（默认 true）；loop 时忽略。 */
  wait?: boolean;
  /** 音轨静音（纯画面，默认 false）。 */
  muted?: boolean;
}

export type VnLine =
  | VnPreload
  | VnSay
  | VnBg
  | VnCg
  | VnChoice
  | VnJump
  | VnLabel
  | VnWait
  | VnHook
  | VnAudio
  | VnMenu
  | VnButtons
  | VnStand
  | VnTransition
  | VnVideo
  | VnEnd;

/** UI 布局/样式声明（可选）。缺省用框架默认。 */
export interface VnUiStyle {
  /** 对话框位置/样式。 */
  dialog?: {
    left?: string | number; right?: string | number; top?: string | number; bottom?: string | number;
    align?: 'left' | 'center' | 'right';
    bg?: string; color?: string; textSize?: number; radius?: number;
    /** 背景贴图 URL（铺在 bg 之上，cover 占满；缺省无）。 */
    bgImg?: string;
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
  /** 标题界面标题文本（menu layout='title' 显示；缺省回退 meta.title / 'Hana'）。 */
  title?: string;
}

/** 剧本：meta（可选全局配置）+ lines。 */
export interface VnScript {
  meta?: {
    /** 加载完再继续 还是 不等也能继续。true=严格等待（默认）。 */
    strictLoad?: boolean;
    fontFamily?: string;
    textSize?: number;
    /** 打字机每字间隔 ms（默认 30）。0=瞬间显示全文。 */
    typeSpeed?: number;
    /** 标题界面标题文本（缺省走 ui.title）。 */
    title?: string;
    /** UI 布局/样式声明。 */
    ui?: VnUiStyle;
  };
  lines: VnLine[];
}
