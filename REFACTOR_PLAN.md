# 重构计划：AVD 与 Framework 整合 · 进度追踪

## 背景

`src/avd/` 与 `src/framework/` 原是互不引用的平行子系统。AVD 有 IRenderLayer/PixiLayer/DomLayer/DomNode，framework 有 SubCanvas/LayerManager/DragController。重构目标是打通两者。

---

## 整体进度（按 REFACTOR_PLAN.md 的 5 个 Phase）

| Phase  | 描述 | 优先级 | 进度 |
|-------|------|--------|------|
| 0 | IRenderLayer 下沉到 framework | 高 | 100% ✅ |
| 1 | AvdController 拆分 | 中 | 100% ✅ |
| 2 | 统一 text-effects 布局引擎 | 中 | 100% ✅ |
| 3 | GSAP 抽象层 | 低 | 100% ✅ |
| 4 | 清理：移除未使用的 framework 交叉引用 | 低 | 100% ✅ |
| 5 | 类型安全修复（as unknown as / as any） | 中 | 100% ✅ |
| 6 | EventBus 接入回调 | 中 | 100% ✅ |
| 7 | vn/ 模块集成（VnAdapter） | 低 | 100% ✅ |
| 8 | AVD + SubCanvas 集成 | 低 | 100% ✅ |

---

## Phase 0 — IRenderLayer 下沉到 framework（高优先级）· 100% ✅

### 目标
把 AVD 验证过的双渲染抽象变成 framework 的基础设施，让 SubCanvas 也能跑 DOM 模式。

### 完成清单

| 步骤 | 状态 | 文件 |
|------|------|------|
| 0.1 移动 render/types.ts → framework | ✅ | `src/framework/render/types.ts` |
| 0.2 创建 framework PixiLayer + DomLayer + AVD 继承层 | ✅ | `src/framework/render/PixiLayer.ts`, `DomLayer.ts`, `dom/DomNode.ts`; `src/avd/render/AvdPixiLayer.ts`, `AvdDomLayer.ts` |
| 0.3 SubCanvas 支持 IRenderLayer | ✅ | `src/framework/SubCanvas.ts` |
| 0.4 DragController 解耦为 IRenderContainer | ✅ | `src/framework/DragController.ts` |
| 0.5 ZOrderManager 解耦为 IRenderContainer | ✅ | `src/framework/ZOrderManager.ts` |
| 0.6 SubCanvasTypes 添加 renderLayer 选项 | ✅ | `src/framework/SubCanvasTypes.ts` |

---

## Phase 1 — AvdController 拆分（中优先级）· 100% ✅

### 目标
把 637 行的 `AvdController` 拆成多个可独立测试的服务，通过 EventBus 通信。

### 完成清单

| 步骤 | 状态 | 文件 |
|------|------|------|
| 1.0 AudioService | ✅ | `src/avd/AudioService.ts` |
| 1.1 SaveLoadService | ✅ | `src/avd/SaveLoadService.ts` |
| 1.2 ChoiceService | ✅ | `src/avd/ChoiceService.ts` |
| 1.3 EventBus | ✅ | `src/avd/EventBus.ts` |
| 1.4 FlagService | ✅ | `src/avd/FlagService.ts` |
| 1.5 BacklogService | ✅ | `src/avd/BacklogService.ts` |
| 1.6 AutoSkipService | ✅ | `src/avd/AutoSkipService.ts` |
| 1.7 InputService | ✅ | `src/avd/InputService.ts` |
| 1.8 AvdUIHost 接口 | ✅ | `src/avd/AvdUI.ts` |
| 1.9 BgState | ✅ | `src/avd/BgState.ts` |
| 1.10 SpeakerState | ✅ | `src/avd/SpeakerState.ts` |
| 1.11 Live2DState | ✅ | `src/avd/Live2DState.ts` |
| 1.12 单元测试（43 个） | ✅ | `src/avd/__tests__/Services.test.ts` |

重构后 `AvdController` 从 642 行压缩至 ~517 行（8 services + 3 state holders + AvdUIHost）。

---

## Phase 2 — 统一 text-effects 布局引擎（中优先级）· 100% ✅

### 目标
消除 `DomTypingEngine._buildLayout()` 与 `text-effects-layout.buildLayout()` 的代码重复。

### 完成清单

| 步骤 | 状态 | 文件 |
|------|------|------|
| `layoutItems<T>` 泛型化 | ✅ | `src/framework/text-effects-layout.ts` |
| DomTypingEngine 复用 layoutItems | ✅ | `src/avd/dom/DomTypingEngine.ts` |
| TypingEngine 保持 buildLayout（PIXI 包装） | ✅ | `src/avd/TypingEngine.ts` |

---

## Phase 3 — GSAP 抽象层（低优先级）· 100% ✅

### 目标
GSAP 原硬编码在 10+ 个文件中，抽象后可替换为 Web Animations API 等。

### 完成清单

| 步骤 | 状态 | 文件 |
|------|------|------|
| AnimationDriver 接口 | ✅ | `src/framework/animation/types.ts` |
| GSAPDriver 实现 | ✅ | `src/framework/animation/GSAPDriver.ts` |
| Barrel 导出 | ✅ | `src/framework/animation/index.ts` |
| 9 个 AVD 组件注入 driver | ✅ | BackgroundLayer/DomBackgroundLayer/PortraitLayer/DomPortraitLayer/DialogueBox/DomDialogueBox/ScreenEffects/DomScreenEffects/AvdController/NotificationSystem/VnScriptPlayer/KagLayerManager |

---

## Phase 4 — 清理交叉引用（低优先级）· 100% ✅

### 目标
解决 backend 层从 example/ 和 components/ 导入的违规依赖。

### 完成清单

| 步骤 | 状态 |
|------|------|
| WindowManager.ts 移除对 example/ 的依赖 | ✅ |
| 后端只依赖 framework/ 和 ./ | ✅ |

---

## 不在上述 5 个 Phase 内的额外计划（来自 docs/refactor-plan.md）

`docs/refactor-plan.md` 定义了更广泛的 10 个阶段（0-9），以下为其额外部分及其实施状态：

| docs 中的 Phase | 描述 | 状态 | 说明 |
|-----------------|------|------|------|
| 1 (docs) | SubCanvas 双模式 | ✅ 已达成 | 实为 Phase 0.3-0.5 的一部分 |
| 2 (docs) | AVD 基于 SubCanvas 构建 | ✅ 已达成 | `AvdOptions.renderLayer` 支持传入 SubCanvas 的 `IAvdRenderLayer` |
| 6 (docs) | 类型安全修复 | ✅ 已达成 | `AvdPixiLayer.ts` 使用 `toPixiContainer()`/`toHandle()` 辅助函数；`AvdController.ts` 改用 `_renderMode` 分支 |
| 7 (docs) | backend 层违规修复 | ✅ 已达成 | 同 Phase 4 |
| 8 (docs) | vn/ 模块集成（VnAdapter） | ✅ 已达成 | `VnAdapter.ts` 提供 `vnScriptToAvdLines()` 和 `VnScriptRunner` |
| 9 (docs) | EventBus 接入 AVD 回调 | ✅ 已达成 | 新增 `choice:enter`/`complete` 事件；`AvdController` 在所有回调处同步 emit EventBus 事件 |

### 整体总进度

```
Phase 0 (IRenderLayer下沉)     100% ✅
Phase 1 (AvdController拆分)    100% ✅
Phase 2 (布局引擎统一)          100% ✅
Phase 3 (GSAP抽象层)           100% ✅
Phase 4 (清理交叉引用)          100% ✅
Phase 5 (类型安全修复)          100% ✅
Phase 6 (EventBus回调接入)      100% ✅
Phase 7 (vn/模块集成)          100% ✅
Phase 8 (AVD+SubCanvas)        100% ✅
```

---

## 验证

```
npx tsc --noEmit      ✅ 通过（0 errors）
vitest run            ✅ 975/977 通过（2 个预存在的 SubCanvas 委托测试失败）
```
