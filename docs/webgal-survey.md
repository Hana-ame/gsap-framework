# WebGAL 与 DOM 版 AVD 框架调查记录

> 调查日期：2026-08-02
> 主题：手机/PC 双端 DOM 渲染 AVD 框架选型、WebGAL 扩展能力（Pixi 小游戏、存档、LLM、动态剧情、点击调查、加载机制）

## 1. 手机/PC 双端 DOM 版 AVD 框架候选

### 第一梯队（最匹配 DOM 渲染 + 双端需求）

| 项目 | Stars | 说明 |
|------|-------|------|
| [OpenWebGAL/WebGAL](https://github.com/OpenWebGAL/WebGAL) | 3.9k | TS/React，DOM 渲染 + 可选 Pixi.js 特效，响应式自适应手机/PC，中文社区最活跃，MPL-2.0 可商用 |
| [Monogatari/Monogatari](https://github.com/Monogatari/Monogatari) | 867 | TS，"responsive and mobile-ready out of the box"，PWA 可装离线，可打包 Electron/Electrobun 桌面端 |
| [tsuzuru-engine/tsuzuru](https://github.com/tsuzuru-engine/tsuzuru) | - | TS 新框架，纯 DOM/Preact 渲染（core 不依赖浏览器 API），core/preact 分层清晰 |

### 第二梯队（备选）

| 项目 | 说明 |
|------|------|
| [ahzvenol/StarNight-Engine](https://github.com/ahzvenol/StarNight-Engine) | SolidJS 真实 DOM 驱动，内核与界面解耦（事件驱动），跨平台用 Capacitor + Tauri 预设 |
| [DianaABA/AuroraEngine](https://github.com/DianaABA/AuroraEngine) | 事件驱动内核 + React/React Native 双端，浏览器/Expo iOS/Android/桌面都能跑 |
| [AndreaFrederica/KosuzuEngine](https://github.com/AndreaFrederica/KosuzuEngine) | Quasar + Vue3（自带响应式），TS 脚本，舞台图层/历史回退/存档读档 |
| [RimoChan/Librian](https://github.com/RimoChan/Librian) | Python + CEFPython，桌面向（偏桌面，非纯 Web） |
| [DRincs-Productions/pixi-vn](https://github.com/DRincs-Productions/pixi-vn) | PixiJS 渲染 + React/Vue 做 UI（注意：Pixi 渲染，非纯 DOM） |
| [AINovel-Studio/OpenAVG](https://github.com/AINovel-Studio/OpenAVG) | Vue3 + Pixi.js 通用冒险引擎，可做 Galgame 和 RPG |
| [1366sll/GinkgoEngine](https://github.com/1366sll/GinkgoEngine) | vanilla HTML/CSS/JS + PWA，零依赖 |
| [Kirilllive/tuesday-js](https://github.com/Kirilllive/tuesday-js) | 纯 div/img 渲染，有 Android/桌面版 |
| [Redmega/simple-visual-novel](https://github.com/Redmega/simple-visual-novel) | 最小 DOM 渲染引擎（vanilla TS） |

### 结论

按"DOM 渲染 + 手机/PC 双端"排序：
1. **WebGAL** — 最成熟，响应式 + 手机/PC + 可打包桌面
2. **Monogatari** — mobile-ready + PWA + Electron 打包
3. **StarNight-Engine** — DOM 驱动 + Capacitor/Tauri 双端，架构（内核与渲染解耦）与本项目 AvdController 思路最像
4. **AuroraEngine** — 若后续想出原生 App，React Native 那套最省事

参考借鉴：tsuzuru 的 core/preact 分层与 WebGAL 的 DOM 主渲染 + Pixi 自定义效果架构最值得参考。

## 2. WebGAL 中间插入 Pixi 自制小游戏：可以，两条路线

### 路线 A：官方特效通道（改源码，最少改动）

- WebGAL 特效系统就是 PixiJS 的：`pixiInit` 初始化 → `pixiPerform:xxx` 调用
- 在 `/Core/gameScripts/pixiPerformScripts/` 新建文件，`registerPerform('name', { fg: () => ... })` 注册
- 函数里能拿到 `WebGAL.gameplay.pixiStage!.effectsContainer` 和 `currentApp`，直接 `addChild` 自己的 `PIXI.Container` 做交互
- 引擎的演出系统有"阻塞/跳过"语义（演出控制模块，不可跳过的演出会阻塞流程直到结束）——把小游戏注册为不可跳过演出即可在流程中间挡住
- 脚本侧编排：`pixiPerform:minigame; wait:xxxx;` 或用 `callScene:minigame.txt` + `return` 回到主流程

### 路线 B：fork 源码加自定义阻塞指令（推荐，控制力最强）

- WebGAL 是 MPL-2.0 开源，可加自定义指令，指令执行器里挂载 Pixi 小游戏覆盖层，结束回调里驱动 `WebGAL.sceneManager` 继续步进
- 社区做小游戏基本都走这条路（如 webgal-llm-puppet 就是改源码实现的）

## 3. WebGAL 存档机制与云同步

### 存储方式

- **IndexedDB（主）**。旧版全部存档存单个 key；新版已改为**每个存档一个独立 IndexedDB 键** + `syncGameLoadStorage(startIndex, endIndex)` 按需加载
- 变量域：`stage`（运行时内置变量，跟随存档）、`userData`（存档内置变量，在 IndexedDB 中）
- 另有 localStorage 用于部分用户数据/设置

### 能否发送到服务器

- **官方无内置云存档**，但官方优化文档明确说分键设计"为存档云同步等扩展功能"预留了基础
- 存档在 Redux 状态里是 JSON，可在存读档 hook 处 fetch 到自己的服务器
- 场景文件本身支持远程 URL（`changeScene:http://...`），webgal-llm-puppet 就是这么加载远程剧本的
- 结论：存档同步必须自己写

## 4. WebGAL LLM 整合情况

官方无内置，社区有多个成熟方案：

| 项目 | 方式 | 特点 |
|------|------|------|
| [RibomBalt/webgal-llm-puppet](https://github.com/RibomBalt/webgal-llm-puppet) | Python 后端驱动 WebGAL + 改 getUserInput 组件 | DeepSeek 等 OpenAI 兼容 API，表情/动作分析，fish-speech/edge-tts 配音，**外部脚本驱动引擎**，最接近"LLM 动态生成框架" |
| [rubbish-picker/WebGAL-llm](https://github.com/rubbish-picker/WebGAL-llm) | 源码级修改 | `-aichat -aiexp -aibg -aibgm` 参数 + AIconfig（角色卡/世界书/controls），AI 输出格式块直接驱动 live2d/背景/bgm/场景切换；作者 2025/11 停更（"改源码不是好接入方式"） |
| [QiuSui1145/GWC](https://github.com/QiuSui1145/GWC) | 纯前端 React，非 WebGAL | GalGame 风格 AI 聊天，剧情 AI 实时生成，OpenAI 兼容任意端点 |
| [openwebgal-mcp-server](https://registry.npmjs.org/openwebgal-mcp-server) | MCP（开发期） | LLM 写剧本/转 WebGAL 脚本/自动配音，不是运行时 |

**结论**：没有官方"LLM 动态生成"一键框架；最接近的是 webgal-llm-puppet 的"外部脚本驱动演出"架构 + WebGAL-llm 的"AI 输出即演出指令"格式约定，两者组合即想要的动态生成框架。

## 5. 动态剧情树支持

- **静态分支**：完整支持——`label`/`jumpLabel`（同文件跳转）、`choose`（选项，支持 `(条件)` 显隐 + `[条件]` 可点）、`changeScene`/`callScene`/`return`（场景调用栈）、`setVar` + `-when` 条件参数
- **动态（运行时生成节点）**：**不支持原生**。没有运行时创建脚本/动态插枝能力
- 变通：
  - `changeScene` 支持**远程 URL**（`?bot=xxx` 传参），服务端可动态下发剧本文件，近似动态
  - `setVar` + `when` 判断可实现数据驱动的条件分支
- 真正的动态剧情树（LLM 生成节点/运行时改结构）需改源码或走 LLM 后端方案

## 6. CG 上鼠标调查（点击热点）

- **原生没有内置点击热点系统**（无类似 Krkr/Artemis 的 hotspot 组件）
- 两个实现途径：
  - **特效通道**：`registerPerform` 里在 `effectsContainer` 挂透明 `PIXI.Container`，`eventMode='static'` + 多个热点 rect，`pointerdown` 回调里 `setVar`/推进流程——最快路径
  - **改源码加 React 覆盖层**：在 CG 上叠绝对定位热点 div，配合自定义指令

## 7. 加载机制（慢网速黑屏问题）

### 内置 Preloading（自动，场景级）

- **每个场景文件解析时，自动提取并预加载其中引用的全部资源**（`changeBg` 的图、`bgm` 的音频、`playVideo` 的视频、立绘等）
- **额外预加载当前场景引用的子场景资源**（`changeScene` / `callScene` / `choose` 的目标场景），只拓展一层，防止资源浪费
- 正确拆场景（每章一个 txt + `callScene`）就能让预加载按章节切片

### Loading 检测机制

- **启动时**：有 `LoadingScreen`（加载界面 + 进度），可定制 UI
- **运行中**：**没有**逐张图片的加载指示器/失败重试/占位机制。黑屏/切换不及时通常发生在：
  - 首次进入场景，资源还没下载完（预加载只覆盖一层子场景，跳转超过一层就会现场下载）
  - `changeBg:none` 手动关闭背景后
  - 资源加载失败（404/网络中断）——引擎会保持旧图或空白，**无降级提示**

### 慢网速应对方案（社区实践）

| 层面 | 做法 |
|------|------|
| 部署 | CDN 分发 + Nginx gzip + `Cache-Control: max-age` 缓存头 |
| 剧本结构 | 拆场景文件，利用"一层预加载"提前拉取；大资源（视频/CG）放靠后的独立场景，前置场景提前 `callScene` 预热 |
| 引擎侧 | 演出阻塞机制：带持续时间的演出（对话/视频/动画）会阻塞自动推进直到结束，不会因图片未到而乱跳流程 |

**结论**：preloading 内置且自动，但运行中逐图加载检测（spinner/失败重试）官方没有，需 fork 源码或自定义 UI 组件补充。

## 8. 调查问答记录（Q&A 汇总）

> 按提问顺序整理，涵盖本次调查的全部问题与结论。

### Q1. GitHub 上是否有手机/PC 双端通用的 DOM 版 AVD 框架？

**A**：有。第一梯队：WebGAL（最成熟，DOM 主渲染 + Pixi 特效，MPL-2.0）、Monogatari（mobile-ready + PWA + Electron）、tsuzuru（core/UI 分层清晰）。详见本文第 1 节。

### Q2. 再找找（补充候选）？

**A**：补充 StarNight-Engine（SolidJS DOM + Capacitor/Tauri）、AuroraEngine（React/React Native）、KosuzuEngine（Quasar/Vue3）、Librian（Python/CEF 桌面向）、pixi-vn、OpenAVG、GinkgoEngine、tuesday-js、simple-visual-novel。

### Q3. 中间插入 Pixi.js 完全自制小游戏是可能的吗？

**A**：可以，两条路线：
- 官方特效通道：`registerPerform('name', {fg})` 注册，在 `WebGAL.gameplay.pixiStage.effectsContainer` 上 `addChild` 任意 `PIXI.Container`，脚本 `pixiPerform:xxx` + `wait`/`callScene` 编排；演出系统支持"不可跳过"阻塞语义
- fork 源码加自定义阻塞指令（推荐，控制力最强）

### Q4. WebGAL 的存档怎么存？能否发送到服务器？

**A**：IndexedDB（新版每档一 key + `syncGameLoadStorage` 按需加载）；变量域 `stage`（跟随存档）/ `userData`（全局）。**无内置云存档**，需自建：存档是 JSON（Redux），在存读档 hook 处 fetch 到自己服务器。

### Q5. LLM 整合情况如何？有没有 LLM 动态生成框架？

**A**：官方无内置。社区方案：webgal-llm-puppet（外部 Python 后端驱动，最接近动态生成）、WebGAL-llm（源码级，AI 输出格式块直接驱动演出，已停更）、GWC（纯前端 React 非 WebGAL）、openwebgal-mcp-server（开发期 MCP）。最佳组合 = puppet 的"外部脚本驱动" + WebGAL-llm 的"AI 输出即指令"格式约定。

### Q6. 是否支持动态剧情树？

**A**：静态分支完整（label/jumpLabel/choose/changeScene/callScene/setVar + when）。运行时动态生成节点**不支持原生**，可用远程场景 URL（`changeScene:http://...?bot=xxx`）+ 服务端动态下发剧本变通。

### Q7. 是否支持 CG 上鼠标调查（点击热点）？

**A**：原生无 hotspot 系统。可用特效通道挂透明交互 `PIXI.Container`（eventMode='static' + 热点 rect），或改源码加 React 覆盖层。

### Q8. 慢网速下图片切换不及时/黑屏，有 loading 检测和 preloading 吗？

**A**：preloading 内置自动（场景级 + 一层子场景）。启动有 LoadingScreen；运行中**无**逐图加载指示/失败重试。对策：CDN + gzip + 缓存头、拆场景切片、fork 补加载指示组件。

### Q9. 字幕特效、菜单动画特效怎么做？用 GSAP 吗？

**A**：
- WebGAL：不用 GSAP，自研数据驱动动画系统——`setTransform`（单段 JSON）/`setAnimation`（动画文件）/`setTempAnimation`（内联多段），作用于背景/立绘/舞台（`-target=fig-center/bg-main` 等），滤镜（blur/brightness/glitch 等）由 Pixi Filter 插值
- 字幕特效：WebGAL 无逐字特效命令，文本样式用文本拓展语法 `[文本](style=...)`；本项目 Hana-ame 侧已有 GSAP 文字动效（`text-effects.ts`：typewriter/fadeInChars/slideIn/scaleBounce/charRain/scramble；DOM 版 `DomTypingEngine`：wave/shake/rainbow）
- GSAP 迁移可行但只建议换"执行器"（保留 JSON 格式），滤镜需 onUpdate 写回

### Q10. webgal-llm-puppet 是怎么做的？是 fork 吗？

**A**：**不是 fork**。git submodule 锁定官方 WebGAL（4.5.9）+ `webgal.git.diff` 补丁（仅 getUserInput UI 改动）+ 独立 FastAPI 后端。架构核心：`start.txt` 用 `changeScene:http://localhost:10228/webgal/newchat.txt?bot=sakiko;` 跳到后端动态生成脚本，WebGAL 只当播放器。

### Q11. 为什么用 submodule + diff 而不是 fork？

**A**：改动量小（仅 getUserInput UI）、升级同步容易（重新应用 diff 即可）、可审查性（一个 diff 文件看完全部改动）、职责分离（项目本体是后端 + 配置，WebGAL 是依赖）。深度改造引擎时才该 fork。

### Q12. WebGAL 能迁移到 GSAP 吗？

**A**：技术上可行。动画是数据驱动 JSON（alpha/scale/position/rotation/duration），GSAP 能驱动同样属性；两个坑：滤镜不能直接 tween（需 onUpdate 写回 Pixi Filter）、需重写 stage 动画执行器。脚本格式可原样保留。**建议只换执行器，不整体迁移**。

### Q13. WebGAL 剧本是什么形式？

**A**：`.txt` 纯文本，每行一条语句 `指令:内容 -参数;`，分号结尾（分号后为注释）。对话语法糖 `角色名:台词;`，旁白 `:台词;`，独白 `intro:行|行;`，分支 `choose:`，跳转 `label/jumpLabel/changeScene/callScene`，变量 `setVar` + `{name}` 插值，注音 `[词](读音)`，动画 `setTransform:{JSON}`。`start.txt` 为入口，按章节拆文件用 `callScene` 串联。

### Q14. 可以用服务器动态生成剧本吗？

**A**：可以（puppet 的架构）。`changeScene` 支持远程 URL，服务端返回 `.txt` 脚本流即可动态驱动。4 个坑：CORS 头、预加载失效（动态 URL 无法预知内容）、存档/回溯受限（需服务端会话状态或 `?session_id=` 重放）、资源路径要完整 URL。建议**混合模式**：静态剧情走本地 txt（预加载/存档正常），LLM 交互处 `callScene` 远程，结束 `return` 回来。

### Q15. 是否能预加载不出现在剧本中的素材？

**A**：**原生不能**——预加载完全由脚本解析驱动（当前场景资源 + 一层子场景），命令表中也没有 preload 指令。变通：源码有 `prefetcher` 模块（社区博客提及，官方性能优化计划 #519 也在控制预加载逻辑）；可 fork 加 `preload` 指令；或注册自定义 `pixiPerform` 特效里用 `PIXI.Assets.load` 提前拉取，预热浏览器缓存。

### Q16. MyGO 是什么？

**A**：BanG Dream! 企划的乐队/动画（《BanG Dream! It's MyGO!!!!!》2023 及其续作 Ave Mujica 2025）。puppet 的演示素材来源（祥子 L2D、Bestdori UI 等二创资源），与 WebGAL 技术无关，换任何角色素材都能用。

## 9. 源码对照验证（fork v4.6.3，2026-08-02）

> 对照 `Hana-ame/WebGAL` fork（v4.6.3）源码逐条验证 survey 结论。

### 修正 1：pixiPerform 演出不阻塞流程（原第 2 节路线 A 有误）

`packages/webgal/src/Core/gameScripts/pixi/index.ts:39-40`：
```ts
blockingNext: () => false,
blockingAuto: () => false,
```
pixi 演出是 `isHoldOn: true`（保持显示），但**完全不阻塞 next**。
"把小游戏注册为不可跳过演出即可挡住流程"不成立。要做阻塞小游戏必须
自己改 `blockingNext` 或走路线 B（自定义指令）。

### 修正 2：预加载是"行门控 + 进度式"，非整场景全量（原第 7 节不完全对）

v4.6.3 三层机制，运行中确有分段预加载：

- `Core/util/prefetcher/assetsPrefetcher.ts`：解析时仅预加载**前 24 行**资源
  （`INITIAL_PARSE_LINE_LOOKAHEAD`），非全场景；`link rel=prefetch` + 220ms 排队
- `Core/util/prefetcher/progressPrefetcher.ts`：游玩中滚动预加载（当前行 + 20 行资源前瞻、
  36 行内子场景）——"运行中无逐图预加载"不成立，只是浏览器缓存级（非强制加载）
- `Core/util/prefetcher/scenePrefetcher.ts`：子场景深度 1，320ms 间隔排队

### 修正 3：动画执行器是 popmotion，非"自研"（原 Q9 措辞不准）

`Core/controller/stage/pixi/animations/timeline.ts:23` 用 `popmotion.animate` 驱动 JSON timeline。
数据驱动 JSON 没错，执行器是 popmotion（非自研、非 GSAP）。原 Q12"GSAP 迁移只换执行器"仍成立。

### 修正 4：getUserInput 已原生内置（原第 4 节隐含假设过时）

v4.6.3 `Core/gameScripts/getUserInput/index.tsx` 已内置（含正则校验 `-rule/-ruleFlag/-ruleText`）。
webgal-llm-puppet 改 getUserInput UI 是因为锁定 4.5.9 旧版。

### 确认正确的结论

| Survey 结论 | 源码证据 | 状态 |
|---|---|---|
| `pixiPerform:xxx` 指令存在 | `parser/sceneParser.ts:48`，`{ next: true }` | ✅ |
| `registerPerform(name, {fg,bg})` API | `util/pixiPerformManager/pixiPerformManager.ts` | ✅（generator 返回 `{container, tickerKey}`，非裸 container） |
| 每档一个 IndexedDB key | `controller/storage/savesController.ts`：`gameKey-saves${i}` + fast save | ✅ |
| `changeScene` 支持远程 URL | `controller/scene/sceneFetcher.ts` axios.get；`util/gameAssetsAccess/assetSetter.ts` 对 http(s) 原样返回 | ✅（**URL 必须 `.txt` 结尾**，否则 reject） |
| `wait` 指令 + `-nobreak` | `gameScripts/wait.ts`：`goNextWhenOver: true`，`blockingNext: nobreak` | ✅ |
| 自定义指令 = `scriptRegistry` + `defineScripts` | `parser/utils.ts`，`SCRIPT_TAG_MAP` / `SCRIPT_CONFIG` | ✅ 路线 B 可行 |
| label/jumpLabel/callScene/return/setVar/choose 齐全 | `parser/sceneParser.ts:42-79` | ✅ |
| 动画 JSON 数据驱动 | `timeline.ts` + `generateTransformAnimationObj.ts` | ✅（执行器 popmotion） |
| setAnimation/setComplexAnimation/setTempAnimation/setFilter/setTransition | `gameScripts/` 五个指令 | ✅ 无需改源码即可编排复杂演出 |

### 结论修正后的两条实现路线

**自定义动画**：改 `timeline.ts` 执行器（popmotion→GSAP 可行，onUpdate 写回）；
或直接用五个动画指令 + `game/animation/` 动画文件编排，**无需改源码**。

**卡牌小游戏**：推荐路线 B（fork 后加自定义阻塞指令）：
1. 新建 `gameScripts/cardGame.ts`，仿 `pixi/index.ts` 但 `blockingNext: () => true`
2. `sceneParser.ts` 的 `SCRIPT_TAG_MAP` 注册 `cardGame`
3. UI 用 Pixi（挂 `foregroundEffectsContainer`）或 React 覆盖层
4. 结束回调驱动 `continueSentence()` 继续流程

## 10. 参考链接汇总

- WebGAL 文档：https://docs.openwebgal.com/
- 特效（Pixi 自定义）：https://docs.openwebgal.com/webgal-script/special-effect.html
- 技术介绍（预加载/流程控制）：https://docs.openwebgal.com/tech/
- 场景与分支：https://docs.openwebgal.com/webgal-script/scenes.html
- 变量与存档：https://docs.openwebgal.com/webgal-script/variable.html
- 资源管理：https://docs.openwebgal.com/resources.html
- 部署优化：https://blog.csdn.net/gitblog_00027/article/details/138893502
- WebGAL 存档系统优化（分键存储）：https://blog.gitcode.com/0d2f4a02b4c6573df2df77e3a3f8412a.html
