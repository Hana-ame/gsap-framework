# WebGAL 调查报告

> 调查日期：2026-08-02
> 调查人：opencode（Hana-ame 项目）
> 目的：评估 WebGAL 作为手机/PC 双端 DOM 渲染 AVD 引擎的可行性，覆盖扩展能力（Pixi 小游戏、LLM 动态生成、点击调查、加载机制）与替代方案对比。

---

## 1. 项目概况

| 项目 | 信息 |
|------|------|
| 仓库 | [OpenWebGAL/WebGAL](https://github.com/OpenWebGAL/WebGAL) |
| Stars | ~3,900 |
| 语言 | TypeScript (88%) + SCSS (8%) |
| 许可证 | MPL-2.0（可商用、需保留修改声明） |
| 最新版本 | 4.6.3（fork 基线，2026-08） |
| 活跃度 | 高：50 名贡献者，近期仍在持续发布（47 个 release） |
| 社区 | 中文社区活跃（QQ 群、B 站、Discord），官方文档完善 |
| 定位 | 网页端视觉小说引擎（Web Visual Novel Engine） |

核心卖点：**一次编写，处处运行**，无需编程基础即可创作，3 分钟学会全部语法。

---

## 2. 技术架构

### 2.1 渲染架构：PixiJS 舞台（背景/立绘）+ React DOM UI

- **舞台层（背景、立绘、Live2D、特效）**：PixiJS 渲染（`syncPixiStageState` → `syncBg`/`syncFigures`/`syncLive2d`），canvas id=`pixiCanvas`
- **UI 层（对话框、选择支、Backlog、标题菜单）**：React + DOM，响应式设计适配手机/PC
- 与 Hana-ame 现有 AVD 架构（Pixi + DOM 双引擎 + `IRenderLayer` 抽象）设计理念一致，参考价值高

### 2.2 脚本系统：WebGAL Script

```
指令:内容 -参数1 -参数2;注释
```

- 对话有语法糖：`角色名:台词 -voice_1.ogg;` 自动解析为 `say` 指令
- 参数支持 `string / number / boolean` 三种动态类型，`-next` 省略值语法糖
- 场景以文件为单位（`.txt`），支持 `choose` / `changeScene` / `callScene` / `return`（场景调用栈）/ `label` / `jumpLabel` / `setVar` / `wait`

### 2.3 流程控制：演出系统

- 每条指令执行后返回"演出控制模块"（带持续时间的视觉效果）
- 演出支持**阻塞**（自动/快进不跳过）与**用户跳过早停**两种语义
- 自动模式 / 快进模式：定时步进 + 优先级区分（选择支不可被快进跳过）

### 2.4 预加载机制

- 场景解析时自动提取并预加载该场景全部资源（图/音频/视频）
- 额外预加载被当前场景引用的**一层**子场景资源，防资源浪费
- 资源目录约定：`background` / `figure` / `scene` / `bgm` / `vocal` / `video` / `tex` / `animation`

### 2.5 存档系统

- 主存储 **IndexedDB**：新版改为每档一 key + `syncGameLoadStorage` 按需加载（官方优化方案，为云同步预留基础）
- 变量域：`stage`（运行时，跟随存档）、`userData`（全局，IndexedDB）
- **无内置云存档**，需自行在存读档 hook 处接服务器；场景文件支持远程 URL（`changeScene:http://...`）

---

## 3. 需求能力矩阵

| 需求 | WebGAL 支持情况 | 结论 |
|------|-----------------|------|
| 手机/PC 双端 | 响应式 DOM 渲染，浏览器原生 | ✅ 开箱即用 |
| 桌面打包 | 官方调试工具可打包（另有 WebGAL Craft 跨平台工作室） | ✅ 支持 |
| Pixi 自制小游戏插入 | 特效通道 `registerPerform` 挂载任意 `PIXI.Container`；或 fork 源码加自定义阻塞指令 | ⚠️ 可做，需改源码 |
| CG 鼠标点击调查 | 无原生 hotspot；特效通道挂交互容器或 React 覆盖层实现 | ⚠️ 可做，需自写 |
| LLM 动态生成剧情 | 无官方集成；社区方案齐全（webgal-llm-puppet 外部驱动 / WebGAL-llm 源码级 / GWC 纯前端） | ⚠️ 可做，需集成 |
| 动态剧情树 | 静态分支完整；运行时动态生成不支持原生（可用远程场景 URL 变通） | ⚠️ 部分支持 |
| 慢网速加载 | 场景级自动预加载 + 启动 LoadingScreen；运行中无逐图加载指示/失败重试 | ⚠️ 部分支持 |

---

## 4. LLM 整合方案（社区生态）

| 项目 | 方式 | 特点 |
|------|------|------|
| [RibomBalt/webgal-llm-puppet](https://github.com/RibomBalt/webgal-llm-puppet) | Python 后端驱动 WebGAL 演出 + 改 getUserInput | DeepSeek 等 OpenAI 兼容 API、情感分析驱动表情、fish-speech/edge-tts 配音，**最接近"LLM 动态生成框架"** |
| [rubbish-picker/WebGAL-llm](https://github.com/rubbish-picker/WebGAL-llm) | 源码级修改 | `-aichat -aiexp -aibg -aibgm` 参数 + AIconfig（角色卡/世界书/controls），AI 输出格式块直接驱动立绘/背景/BGM/场景切换；作者已停更（2025/11） |
| [QiuSui1145/GWC](https://github.com/QiuSui1145/GWC) | 纯前端 React（非 WebGAL 系） | AI 实时生成剧情、Live2D、GPT-SoVITS，OpenAI 兼容任意端点 |
| [openwebgal-mcp-server](https://registry.npmjs.org/openwebgal-mcp-server) | MCP 开发期工具 | LLM 写剧本/转脚本/自动配音 |

**建议**：参考 webgal-llm-puppet 的"外部脚本驱动演出"架构 + WebGAL-llm 的"AI 输出即演出指令"格式约定，自建动态生成层。

---

## 5. 优缺点评估

### 优点

1. 中文社区最活跃、文档完善、图形化编辑器（WebGAL Terre）降低创作门槛
2. MPL-2.0 开源协议，可商用、可 fork 深度定制
3. 响应式 DOM 渲染，手机/PC 一套代码
4. 脚本语法简洁（3 分钟上手），场景/分支/变量/存读档/回溯（Backlog）功能完整
5. 演出阻塞/跳过语义完善，自动与快进体验成熟
6. 场景级自动预加载 + 一层子场景预加载，架构设计良好

### 缺点 / 风险

1. **深度定制需改源码**：小游戏、点击调查、LLM 动态生成、逐图加载指示均无原生能力
2. **无内置云存档**：需要自建同步服务
3. **无运行时动态剧情树**：LLM 动态生成需要外围驱动层
4. **运行中加载检测缺失**：慢网速下图片切换不及时/黑屏无降级提示
5. 自定义特效 API 面向"演出"设计（带持续时间、自动销毁），非通用游戏对象系统
6. 依赖 React 生态，与 Hana-ame 现有 React 组件体系（component-avd-*）可衔接

---

## 6. 结论与建议

### 是否采用

**结论：WebGAL 是目前"手机/PC 双端 DOM 渲染视觉小说引擎"的最优开源选择**，尤其适合需要快速交付、社区支持、语法成熟度高的场景。

### 对本项目（Hana-ame）的意义

Hana-ame 已拥有自研 AVD 框架（Pixi + DOM 双引擎、AvdLineJSON 脚本、19 个已移植 H 场景），**不建议整体迁移到 WebGAL**，但可借鉴：

| 可借鉴点 | 说明 |
|----------|------|
| 演出阻塞/跳过语义 | Hana-ame 的 `DialogueStateMachine` 可补充"不可跳过演出"概念 |
| 场景级预加载 | 借鉴"一层子场景预加载"策略优化 `/game-cgs/` 与 ExMoonchan 图片懒加载 |
| 分键存档 | Hana-ame `AvdSaveData` 可参考每档一 key 的 IndexedDB 方案 |
| LLM 外部驱动架构 | 若未来做 LLM 剧情，参考 webgal-llm-puppet 的"外部脚本驱动演出" |

### 若选 WebGAL 的关键前置工作

1. fork 源码，建立自定义指令注册机制（小游戏/调查/LLM 输出解析）
2. 自建云存档 API + 存读档 hook
3. 自定义加载指示组件（运行中逐图 loading/失败重试）
4. 部署层：CDN + gzip + 缓存头

---

## 7. 参考链接

- 官方仓库：https://github.com/OpenWebGAL/WebGAL
- 官方文档：https://docs.openwebgal.com/
- 特效（Pixi 自定义）：https://docs.openwebgal.com/webgal-script/special-effect.html
- 技术介绍（预加载/流程控制）：https://docs.openwebgal.com/tech/
- 场景与分支：https://docs.openwebgal.com/webgal-script/scenes.html
- 变量与存档：https://docs.openwebgal.com/webgal-script/variable.html
- 部署优化指南：https://blog.csdn.net/gitblog_00027/article/details/138893502
- 存档分键优化：https://blog.gitcode.com/0d2f4a02b4c6573df2df77e3a3f8412a.html
- 相关调查原始记录：`docs/webgal-survey.md`
