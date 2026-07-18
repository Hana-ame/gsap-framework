# SubCanvas — 项目现状

## 已完成

### 基础架构
- PIXI v8 Application + SubCanvas + SubCanvasProxy 核心层
- EventBus 发布订阅
- InfiniteCanvas 插件化无限拖拽（chunk 分块 + DeceleratePlugin 惯性）
- InfiniteCanvas 支持 zoom-to-pointer（`setZoom(zoom, cx?, cy?)`）
- 框架纯函数工具集：`math.ts`(12 func) + `color.ts`(10 func) + `rect.ts`(8 func)

### GSAP 集成（2026.07 完成）
- `framework/gsap-pixi.ts` — PixiPlugin 注册 + re-export
- 替换 5 个手写 ticker：
  - `FullscreenManager.ts` — 缩放/拖动动画
  - `Loading.ts` — spinner 旋转
  - `AvdPortraitLayer.ts` — 立绘淡入淡出（移除 `update(now)` 耦合）
  - `Avd.ts` — 对话框滑入 + 文本淡入
  - `Displays.ts` — 点击波纹

### 组件系统
- `Component` 接口 + `registerComponent` / `createComponent` 注册表
- 已注册适配器：`window` / `confirm` / `scrollable`
- `ui-helpers.ts` — `makeButton` / `makeStepper`

### 示例（18 个路由）
- 2048 / Avd / Bus / Colony / Conway / Cutscene / Delete / Displays / Drag / Events / Life Map / Mask / Scroll / Screen Size / Video Player (PIXI + DOM) / Window

### 测试
- 63 个 vitest 测试（纯函数 + registry smoke test）
- CI: `.github/workflows/ci.yml` — lint → tsc → test → build

### 部署
- Cloudflare Pages: push to `sim` → `react.moonchan.xyz`

## 进行中
- （无）

## 待办

### Medium Priority
- 用 `createComponent('window', opts)` 重构现有示例中散装的 `createWindow` 调用
- `makeButton` / `makeStepper` 在 5 个 example 中的重复定义统一引用 `ui-helpers.ts`
- Avd 类型机 + arrow bob 考虑是否 GSAP 化（当前逻辑保留 ticker）

### Low Priority
- 添加 InfiniteCanvas 的平滑滚轮缩放（WheelPlugin，参考 pixi-viewport）
- 添加 ClampPlugin（边界约束）和 SnapPlugin（网格吸附）
- 组件冒烟测试扩展到实际 Factory 创建（需要 PIXI Application mock）
- 学习笔记 `src/LEARNINGS.md` 持续更新

### TBD / 不需要做
- VideoPlayer (React) 从 barrel 移出 → 被 `ComponentVideoPlayerDomDisplay` 使用，命名已足够区分

---

## 架构图

```
framework/
├── index.ts              → barrel export
├── SubCanvas.ts          → PIXI 子画布容器
├── SubCanvasProxy.ts     → SubCanvas 管理器 + EventBus
├── EventBus.ts           → 发布订阅
├── PixiApp.ts            → app.init + canvas mount
├── InfiniteCanvas.ts     → 插件化无限画布（chunk + decelerate + zoom）
├── gsap-pixi.ts          → GSAP + PixiPlugin 注册
├── component.ts          → 组件注册表（Map<string, Factory>）
├── register-components.ts → 注册 window/confirm/scrollable 适配器
├── ui-helpers.ts         → makeButton / makeStepper
└── utils/
    ├── math.ts
    ├── color.ts
    ├── rect.ts
    └── __tests__/

components/
├── index.ts              → barrel export
├── PixiWindow.ts         → createWindow
├── PixiConfirm.ts        → createConfirm
├── PixiImage.ts          → createLoadingImage
├── PixiVideoPlayer.ts    → createVideoPlayer (PIXI)
├── VideoPlayer.tsx       → VideoPlayer (React DOM)
├── FullscreenManager.ts  → 全屏看图（GSAP）
├── Loading.ts            → loading 遮罩 + 旋转（GSAP）
├── Scrollable.ts         → 滚动容器
├── ClickableImage.ts     → 可点击图片
├── Avd.ts                → 视觉小说引擎（GSAP + ticker）
├── AvdDialogueBox.ts
├── AvdPortraitLayer.ts   → 立绘管理（GSAP）
├── AvdInlineLayout.ts
└── AvdScript.ts

example/
├── examples.ts           → 路由表
├── launcher/             → LauncherDisplay
├── _shared/              → Displays.ts
└── component-*/          → 各示例 Display
```
