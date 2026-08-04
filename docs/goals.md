# 目标与路线（Goal / Roadmap）— src/vn

> 记录日期：2026-08-04
> 范围：全新剧本驱动 VN 播放器 `src/vn/`。
> 目的：**以 WebGAL 为对齐基准**，把 `src/vn` 从「单场景播放器」补成可完整游玩的 VN 引擎，能力面逐项对齐 WebGAL（同功能同语义），并在对齐过程中吸收其设计（存档分键、一层子场景预加载、演出阻塞/跳过语义等）。
> 对齐基准：WebGAL（`docs/webgal-report.md` / `docs/webgal-survey.md` 已做完整调查）。

---

## 0. 现状定位

`src/vn` 当前已具备「单场景播放器」的全部原子能力：

- 指令集：`preload`(wait:true/false) / `say`(bg/cg/stand/standPos/fadeMs/effect) / `wait`(挂起等点击) / `bg`(cover) / `cg`(contain) / `choice`(to/set/showWhen) / `jump`(label/#hash/URL/场景名, if) / `label` / `hook` / `audio` / `menu`(title/list/grid) / `stand`(进出场) / `transition`(全屏转场) / `end`(goto)
- 图层：bg cover 占满 / cg contain 看全；index/zIndex 叠加
- 变量：`choice.set` 写、`showWhen` / `jump.if` / `choice.showWhen` 读；安全表达式解析（不 eval）；全局跨场景变量（localStorage）合并进条件求值
- 效果：`fadeMs` 淡入、`shake` 震屏、`flash` 白闪（一次性 keyed + 自动清除，不残留）、`stand` 进出场（fade/slide/zoom）、`transition` 全屏转场（fade/wipe/circle/slide/zoom）
- 加载：切图等 `onload` 再推进（避免黑屏）；`preload.wait` 双模式
- 消费方：`src/example/hscene/*.tsx` 懒加载组件 + `vn-menu` 封面卡片 + `examples.ts` 全 React.lazy

**与 WebGAL 对比覆盖度：约 30–35%**。单场景播放能力已齐，差距全在「游戏性外壳」：存档、音频、回放、快进/自动、设置、标题界面、完整状态机。

---

## 1. 差距矩阵（vs WebGAL）

| 能力 | WebGAL | src/vn | 优先级 |
|------|--------|--------|--------|
| 剧本驱动 | `.txt` 脚本 | 动态 js / json / ts（`VnScript`） | ✅ 已有 |
| 图层/立绘/对话框/打字机 | ✅ | ✅ 已有 | ✅ 已有 |
| 选项 / 分支跳转 | `choose` | `choice`+`jump` **已实现** | ✅ 已有 |
| 变量与条件 | `setVar`+`-when` | `set`+`showWhen`+`if` | ✅ 已有 |
| 无内置演出（flash/shake/video 等） | 全套 | flash/shake/fade + `stand` 进出场 + `transition` 转场（video 未做） | 中（已补演出） |
| **存档系统** | IndexedDB 分键 | ✗ 无 | **高（第 1）** |
| **音频**（BGM/SFX/语音） | ✅ | ✗ 无（**先天缺陷：DV 场景全靠字幕无音频**） | **高（第 1）** |
| **回放/回溯**（历史记录） | Backlog | ✗ 无 | **高（第 2）** |
| **自动/跳过/设置** | ✅ | ✗ 无 | **高（第 3）** |
| 标题界面 | ✅ | 无（菜单=场景列表） | 中（第 4） |
| 跨场景状态/全局变量 | `userData` | ✗ 每场景独立 hash | 中（第 4） |
| 编辑器 / 插件生态 | Terre / 插件 | ✗ | 低（远期） |

**建议实施序：存档 → 音频 → 回放 → 自动/跳过/设置 → 标题/全局状态 → 演出扩充。**

> 实施序即对齐序：每完成一项，向 WebGAL 的能力面推进一格，目标最终对齐（或按需超越）。

---

## 2. 剧情跳转与「跳转前 preload」（本次设计思考）

### 2.1 现有跳转机制

`jump`/`choice`/`end.goto` 统一走 `navigate(target)`：

- `label` 名 → `runLine(index)`（同场景内跳行）
- `#hash` → 改 `window.location.hash`
- `http(s)` → `window.open` 新标签
- 场景名 → 拼 `#hscene-<name>`（由 `examples.ts` 的 React.lazy 按需加载对应组件）

**跨场景跳转时，目标组件是 just-in-time 加载**（哈希变化 → React.lazy chunk 拉取 → 新 `VnPlayer` mount → 才开始 `preload` 目标场景资源）。

### 2.2 缺失：跳转前无法预加载目标场景

当前从场景 A 跳 B，B 的资源要到 B 真正挂载后才开始下载 → 慢网下会出现「黑一下」→ 这正是 WebGAL「一层子场景预加载」解决的。

**目标设计**：跳转（`jump.to`/`choice.to`/`end.goto` 指向另一场景名）前，先预取目标场景的组件 chunk **及** 其首个 `preload` 声明资源，再切 hash。需要：

- 暴露「场景 → prefetch 资源清单」的注册表（可复用 `scene-covers.ts` 的封面元数据思路）
- `navigate` 在切场景前：`dynamic import` 目标组件 + 挂预取 `<link>`/new Image 预热浏览器缓存
- 提供 `prefetchSceneKey(key)` 工具，供 `vn-menu` 悬停/相邻场景预加载

> 注意：本项目场景支持 **动态 js / json / ts** 三种形态（见 §3 / §0），**不假设静态**。预加载的可行性取决于场景形态：模块形式（js/ts）可静态导出资源清单直接预取；纯 json（或远程下发 / 运行时生成）脚本资源无法预知，只能加载后按其 `preload` 声明再拉取，或由应用层显式预取。两种都要支持。

---

## 3. 新指令设计：`hook`（异步钩子 / 成就 / 统计上报）

### 3.1 需求

剧本在**任意位置**执行一次异步逻辑——发送网络请求（统计 / 成就埋点）、或直接执行 JS 回调对播放器进行操作。

### 3.2 设计前提：scenario 支持动态 js / json / ts，函数是合法一等公民

**场景（scenario）支持动态 js / json / ts 三种形态**——不是只能写静态 TS 数据。`VnScript` 是约定（meta + lines 的接口），具体用什么形式提供都行：

- **js / ts 模块**：`export const X: VnScript`，可直接把 JS 函数作为剧本的一部分（`hook.run`、自定义逻辑）。这是本项目场景的常态。
- **json**：纯数据声明（用于远程下发 / 动态生成 / 数据化导出），此时指令只走声明式字段（如 `hook.url`），不依赖函数。

因此函数内嵌**不是"放宽"或"破坏纯数据"**，而是 js/ts 场景形态下的**合法一等公民**。因此：

- **`hook` 指令的 `run` 字段可直接放一个函数**，它接收一个 `VnHandle`（播放器操作句柄），可对 VN 对象进行读/写变量、跳转、切音频、存读档等操作。异步函数返回 Promise，`wait` 控制播放器是否等待。
- `url`/`body` 模式保留：json 形态场景（或不想用函数的场景）仍可声明式发 fetch，不依赖函数。
- 两者都支持 `set` 写回变量。

### 3.3 VnHandle（回调操作句柄）

```ts
export interface VnHandle {
  getVar(name: string): VnValue | undefined;
  setVar(patch: Record<string, VnValue>): void;
  jump(target: string): void;           // label / #hash / URL / 场景名（复用 navigate 语义）
  playAudio(key: string, opts?): void;  // 播放预加载的音频资源
  stopAudio(channel?: 'bgm'|'sfx'|'voice'): void;
  flash(): void; shake(): void;
  save(slot: number): Promise<void>;    // 快存
  load(slot: number): Promise<void>;    // 读档
  end(goto?: string): void;             // 结束（可回菜单）
}
```

### 3.4 类型草案

```ts
export interface VnHook {
  type: 'hook';
  key?: string;                          // 事件名/埋点 key（成就/统计标识）
  /** JS 回调：scenario 的一部分，直接操作 VnHandle；async 可被 wait 等待 */
  run?: (vn: VnHandle) => void | Promise<void>;
  url?: string;                          // 声明式 fetch 模式（不依赖函数）
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
  set?: Record<string, VnValue>;         // 写回变量（run 内也可自行 setVar）
  /** true=等 hook 完成再继续下一行；false/缺省=fire-and-forget 立即继续 */
  wait?: boolean;
}
// VnLine 联合类型加入 VnHook
```

### 3.5 注意

- `wait` 语义与 `preload.wait` 一致（true=等完成，false=立即继续）。
- 失败不阻断流程（`run` 抛错 / fetch 失败都吞掉并继续），保证成就/统计故障不影响演出。
- **js/ts 形态场景函数内嵌是合法设计**；纯 json 形态则走声明式字段（`url`/`body`）。存档只存播放器状态快照（行号/变量/图层/音频），不依赖剧本函数本身，两种形态都支持。
- 成就/统计：`key` 标识事件，`run` 里自行上报；或 `url` 声明式上报。

---

## 4. 设计原则：标题 / 回想 / 菜单 = 特殊 scenario（一切数据驱动）

**原则**：游戏的「外壳界面」——标题界面、回想（Backlog / 通关回想）、场景菜单——**不用专门的 React 组件硬编码**，全部用与剧情一致的 `VnScript` 表达。它们只是**特殊用途的 scenario**，同样由 `VnPlayer` 走统一指令集渲染。

### 4.1 为什么

- **单一数据源**：剧本 = 场景声明（js/json/ts 均可，界面条目也是数据）；把菜单做成 React 组件 = 界面逻辑泄漏到框架层。
- **可编排**：菜单不再是"进场景前/后的特判"，而是普通剧本，可以用 `bg`/`cg`/`effect` 做背景与转场，用 `choice`/`jump` 做入口导航。
- **对齐 WebGAL**：其 title / Backlog / 存档界面也是走脚本驱动的一套 UI，本原则与之同构。

### 4.2 需要框架支持什么

当前指令集表达不了"网格/列表型界面"。需要新增一个**数据驱动的界面指令**（草案名 `menu`）：

```ts
export interface VnMenu {
  type: 'menu';
  /** 界面布局形态：列表（回想） / 网格（场景卡片） / 标题按钮 */
  layout: 'list' | 'grid' | 'title';
  items: Array<{
    id: string;          // 目标：场景名 / #hash / label / URL（复用 jump 语义）
    title: string;
    cover?: string;      // 封面图 URL（卡片/网格用；数据驱动，同资源声明）
    group?: string;      // 分组标题（网格分组显示）
    showWhen?: string;   // 条件显示（如 通关才解锁回想条目）
  }>;
  // 样式走 meta.ui（menu 布局样式），不硬编码
}
```

- `VnPlayer` 渲染 `menu` 时切到网格/列表视图，点击条目走 `navigate(item.id)`（与 `jump` 完全同语义）。
- **回想条目用 `showWhen` 结合全局变量做解锁**（如 `$seen_iru_HC1_42`），变量域见 §1 跨场景状态。
- 标题界面 = 一个 `layout:'title'` 的 menu scenario，背景图/转场都用 `bg`/`cg`/`fadeMs` 表达。
- 条目 id 指向场景时，复用 §2.2 的「跳转前 preload」：`menu` 渲染时可悬停/可视区预取目标场景资源。

> 注意：现有 `src/example/vn-menu/` **已按本原则重构**——不再用硬编码 React 组件，改为 `menu layout:'grid'` scenario（分组 `group` / 封面 `cover` 全数据驱动），原 `VnMenuDisplay.tsx` 只剩一个 VnPlayer 壳。

---

## 5. 已确认/待办快照

- `choice` 已有；`jump` 已有（同场景跳行 + 跨场景 navigate）。
- **已实现（本次）**：
  - `hook` 指令：js/ts 场景内嵌 `run(vn)` 函数直接操作播放器（VnHandle）；json 场景声明式 fetch；`set` 写回；`wait` 双模式（§3）。
  - `audio` 指令：bgm/sfx/voice 三频道，`VnAudioEngine` 管理 HTMLAudioElement。
  - `menu` 指令：数据驱动界面（title/list/grid），标题/回想/场景菜单统一走 scenario（§4）。
  - 跳转前 preload：`prefetchScene` + 不可见 DOM 预加载栏（隐藏 `<img>` 预热），`end` 自动清理 + 手动 `clearWarmLayer` + countdown 清理。
  - 存档系统：IndexedDB 分键 save/load/list/delete + `resetSaveDb`；`VnHandle.save/load` 快存读档（§1 第 1 优先）。
  - VnHandle：`getVar/setVar/jump/playAudio/stopAudio/flash/shake/save/load/end/clearPrefetch/showBacklog/closeBacklog/openSettings/closeSettings/toggleAuto/toggleSkip/setSetting`。
  - **回放（Backlog）**：`say` 台词并入历史，Backspace/上箭头打开，点击回溯到对应行（§1 第 2 优先）。
  - **自动/跳过/设置**：顶栏按钮 + 键盘快捷键；auto 延迟推进、skip 快进（越过 wait 不越 choice/menu）；设置面板调节音量/打字机速度/自动延迟，persist localStorage（§1 第 3 优先）。
  - **标题界面落成**：`#vn-title` 数据驱动 scenario（`menu layout:'title'` + bg 背景 + 半透明底），`DEFAULT_EXAMPLE` 改为 `vn-title`；menu 条目 id 支持 label 优先解析（`resolveJump`，与 jump 同语义）（§1 第 4 优先）。
  - **全局跨场景状态**：`src/vn/global-state.ts`（localStorage 持久化 + `useSyncExternalStore` 订阅），`showWhen`/`jump.if` 求值合并全局变量；场景 `end` 自动 `markSceneSeen` → 回想解锁；`#vn-recall` 数据驱动回想 + `VnHandle.getGlobalVar/setGlobalVar/markSeen`（§1 第 4 优先）。
  - **演出扩充**：`stand` 指令（立绘进出场动画：fade/slide/zoom，show/hide）与 `transition` 指令（全屏转场：fade/wipe/circle/slide/zoom，播完自动继续），`src/vn/effects.ts` 统一 keyframe 映射（§1 中优先）。
  - **`vn-menu` 下沉**：HS 回想列表由硬编码 React 改为数据驱动 `menu layout:'grid'` scenario（§4 反例清除）。
- 场景形态：支持动态 **js / json / ts**，函数是 js/ts 场景的合法一等公民（§3.2）。
- 待办：**远期**（编辑器/插件生态，§1 低优先）→ 主路线图各优先项已全部落成。
- 下一里程碑：全部中/高优先项完成，`src/vn` 能力面对齐 WebGAL 主能力面。