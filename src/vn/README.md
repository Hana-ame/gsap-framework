# src/vn — 剧本驱动 VN 播放器框架

解耦旧 `src/avd` 的轻量视觉小说引擎。剧本（scenario）支持**动态 js / json / ts** 三种形态，资源 URL 内联，按剧本加载。

## 设计目标

- **剧本驱动**：scenario 支持**动态 js / json / ts** 三种形态，均表达 `VnScript` 约定（meta + lines）。js/ts 模块（`export const X: VnScript`）可直接内嵌函数（如 `hook.run`）；json 走纯声明式字段（可远程下发 / 动态生成）。
- **框架只提供组件，不含场景逻辑**：VnPlayer 提供原子能力（图层渲染/对话框/打字机/选项/加载遮罩/跳转），场景数据决定画什么、在哪层。
- **按剧本加载资源**：资源 URL 内联在 `preload` 指令，只加载当前剧本声明的内容，不一次性全量。
- **外链 CG**：图片用 `ex.moonchan.xyz` 外链，DOM `<img>` 无 CORS 限制。

## 剧本格式

```ts
import type { VnScript } from '../types';

export const demo: VnScript = {
  meta: {
    strictLoad: true, fontFamily: '"Noto Serif SC", serif', textSize: 22,
    ui: {
      dialog: { left: '4%', right: '4%', bottom: 24, bg: 'rgba(10,10,30,0.85)', color: '#fff', textSize: 22 },
      choice: { align: 'center', itemBg: 'rgba(20,20,40,0.9)', fontSize: 18 },
      cgBox: { aspect: 16 / 9, maxWidth: 'calc(100vh * 16 / 9)' },
    },
  },
  lines: [
    { type: 'preload', wait: true, assets: [{ key: 'cg1', url: 'https://...' }] },
    { type: 'bg', key: 'bg1' },          // 背景层（cover 占满）
    { type: 'cg', key: 'cg1' },          // CG 层（contain 看全）
    { type: 'say', speaker: '伊露', cg: 'cg1', text: '台词' },
    { type: 'choice', options: [{ text: '继续', to: 'next' }] },
    { type: 'label', name: 'next' },
    { type: 'jump', to: 'next' },        // 跳 label
    { type: 'end', goto: '#vn-menu' },   // 结束并回菜单
  ],
};
```

## meta.ui（UI 布局/样式声明）

scenario 可在 `meta.ui` 声明界面布局与样式，框架按声明渲染（缺省用框架默认）：

```ts
ui: {
  dialog: { left, right, top, bottom, align, bg, color, textSize, radius, minHeight, padding },
  choice: { align, itemBg, itemColor, fontSize, gap },
  cgBox:  { aspect, maxWidth },
}
```

## 变量与条件（choice.set / showWhen / jump.if）

剧本可带运行时变量，实现分支与选项联动：

- **写入**：`choice` 选项 `set` 选中后写入 vars（如 `{ flag: 'a' }`）。
- **条件**：`showWhen`（选项满足才显示）、`jump.if`（满足才跳转，不满足跳过继续下一行）。

条件表达式语法（不 eval，安全解析）：

```
$name                  // 真值判断（非 0/''/false/undefined）
$name == 'a'           // 与字符串比较（也可 == 数字、true/false）
$name != 'a'
$name === 1            // 严格比较
$flag == 'x' && $cnt == 2     // 且
$flag == 'x' || $cnt == 2     // 或（优先级最低，可用整体括号）
```

```ts
{ type: 'choice', options: [
  { text: '留下', to: 'stay', set: { flag: 'stay' } },
  { text: '离开', to: 'leave', set: { flag: 'leave' } },
  { text: '隐藏项', to: 'secret', showWhen: "$flag == 'stay' && $lvl == 2" },
] },
{ type: 'jump', to: 'goodEnd', if: "$flag == 'stay'" },
```

## 立绘（say.stand）

`say` 可带立绘：`stand`（key 或 URL）+ `standPos`（`left`/`center`/`right`，默认 `left`）。半身像底部对齐，点击可切换显示/隐藏。同位置的立绘后到覆盖。

```ts
{ type: 'say', speaker: '伊露', stand: 'char-iru', standPos: 'right', text: '台词' },
```

## 动画

- `bg`/`cg`/`say` 的 `fadeMs`：切图淡入时长 ms（0=无动画，默认 0）。背景仍 cover、CG 仍 contain。
- `say.effect` / `wait.effect`：`shake` 抖动画面、`flash` 白屏闪（瞬时，动画结束自动清除）。
- **切图等待**：`bg`/`cg` 行不会立即推进——若目标图尚未加载完成，会停在当前画面，等 `onload` 后再继续（不显示 loading 遮罩；遮罩只在真实 preload 等待 `loaded < total` 时出现）。避免"切到一张未就绪的 CG 时短暂黑屏"。
- 对话框 / 选项层淡入上浮由 `meta.ui.dialog.animate` / `meta.ui.choice.animate` 开启（默认关闭，避免每次换行都跳动画）。
- 打字机速度由 `meta.typeSpeed` 控制（每字 ms，默认 30；0=瞬间显示）。

## 指令集

| 指令 | 作用 |
|------|------|
| `preload` | 声明资源 `{key,url}`。`wait:true` 等加载完再继续；`wait:false` 立即继续后台加载 |
| `say` | 对话。`speaker` 空串=旁白。`bg`/`cg` 附带切对应图层；`stand`/`standPos` 带立绘；`fadeMs` 淡入；`effect`（`shake`/`flash`） |
| `wait` | 显式挂起：停在当前画面，等点击（advance）才继续，不自动推进。可带 `effect`（如 `{ type: 'wait', effect: 'flash' }` 白闪+定格） |
| `bg` | 背景层，cover 占满全屏。`fadeMs` 淡入 |
| `cg` | CG 层，contain 看全（默认直接全屏 contain，无包裹框；设 `meta.ui.cgBox` 可套指定宽高比框）。`fadeMs` 淡入 |
| `choice` | 选项。`options[].to` 跳 label；`set` 写变量；`showWhen` 条件显示 |
| `jump` | 跳转：label 名 / `#hash` 路由 / `https://` 开网页 / 场景名加载。`if` 条件满足才跳。跳场景名前自动预取目标脚本 + 资源（见「预加载栏」） |
| `label` | 跳转标签 |
| `hook` | 异步钩子。js/ts 场景可内嵌 `run: (vn) => ...` 直接操作播放器（VnHandle：读写变量/跳转/音频/存读档/闪屏/抖动/结束）；json 场景走声明式 `url`/`method`/`body` fetch。`set` 写回变量；`wait:true` 等完成再继续，缺省 fire-and-forget |
| `audio` | 播放/停止音频。`key`（preload 声明或 URL）+ `channel`（`bgm` 循环 / `sfx` / `voice`）+ `loop`/`volume`；`action:'stop'` 停止 |
| `menu` | 数据驱动界面（标题 / 回想 / 场景菜单）。`layout: 'title'|'list'|'grid'` + `items[]`（`id` 复用 jump 语义、`title`、`cover`、`group`、`showWhen` 条件显示）。条目点击走 navigate |
| `end` | 结束。`goto` 可跳 `#hash` / URL / 场景名。结束时自动清理预加载栏 |

## VnHandle（hook.run 操作句柄）

`hook.run` 收到 `VnHandle`，可直接对 VN 对象操作：

```ts
vn.getVar('flag');                     // 读变量
vn.setVar({ flag: 'a' });              // 写变量
vn.jump('sceneName');                  // 跳 label / #hash / URL / 场景名
vn.playAudio('bgm1', { channel: 'bgm', loop: true });  // 播放预加载音频
vn.stopAudio('bgm');                   // 停指定频道（缺省全部）
vn.flash(); vn.shake();                // 特效
vn.save(1); vn.load(1);                // 快存/读档（IndexedDB）
vn.end('#vn-menu');                    // 结束（可回菜单）
vn.clearPrefetch();                    // 手动清理预加载栏
```

## 存档系统

- IndexedDB 分键存储（每槽位一个 key），对齐 WebGAL 分键方案。
- 存档 = 播放器状态快照（行号 / 变量 / 图层 / 立绘 / 台词 / 音频 bgm），不依赖剧本函数，js/json/ts 场景均可。
- API：`saveGame` / `loadGame` / `listSaves` / `deleteSave` / `resetSaveDb`。
- 跨场景读档：`load(slot)` 检测 `scriptKey` 不一致时导航到对应场景（由应用层在新场景挂载后恢复）。

## 预加载栏

- 跳转场景名前自动预取：应用层 `registerSceneScript(key, loader)` 注册场景加载器，播放器 `prefetchScene(key)` 拉取脚本（React.lazy chunk）并按其 `preload` 声明在**不可见 DOM 层**生成 `<img>` 预热，切换时无感。
- 清理：`end` 自动清理；`clearWarmLayer()` 手动清理；`setWarmLayerCountdown(N)` 设置经历 N 次场景变化后自动清理（0=不自动）。

## 图层

- 两层语义：`bg`（背景，cover）、`cg`（CG，contain）。同 index 时 cg 在 bg 前。
- `index`（默认 0）、`zIndex` 可选，控制叠加顺序。
- 用 `bg:`/`cg:` 指令或 `say.bg`/`say.cg` 切换图层。

## 跳转目标（`jump.to` / `end.goto`）

| 目标值 | 行为 |
|--------|------|
| `#vn-menu` | hash 路由切到菜单 |
| `https://example.com` | 打开新网页标签 |
| `scenario-key` | 自动加载 `hscene-<key>` 场景 |

## 加载模式

- `preload.wait:true`（或 meta `strictLoad:true`）：等全部加载完成才继续播放，期间显示 loading 进度。
- `preload.wait:false`：不等待立即继续，图片后台加载、准备好后显示。

## 消费方

- `src/example/hscene/*.tsx`：每个场景一个懒加载组件，渲染 `VnPlayer` + 对应 scenario。
- `src/example/vn-menu/`：默认入口，HS 列表按游戏分组，卡片式展示。每张卡片 = **封面图（该场景第一个 preload 的 CG）+ 标题**，点击切 `#hscenekey`。封面元数据在 `scene-covers.ts`（被菜单懒加载 chunk 引用，不进主 bundle）。
- `src/example/examples.ts`：全组件 React.lazy 分离，主 bundle 保持小体积。

## 维护提示

- 场景由 `scripts/rmmz2vn.py` 从 3 个 RMMZ 游戏 CommonEvents 生成（脚本保留，可重跑）。**重跑会覆盖现有中文翻译**，非必要时不要执行。
- 翻译原则：逐场景按上下文整句意译，**拟声词不要机械直译**（如 `ビクンビクン` 依语境译「身体一阵痉挛」「不住地发颤」「一阵阵发软」等，避免同一短句反复出现）；**成人向译文要生动多变**，不要全篇套用同一个表达；含糊发音（如 `ふぁりがとう`）用「糊」等模拟，不用音译硬凑。
- 不要改动 `src/avd/`（遗留），新增剧情走 `src/vn/`。