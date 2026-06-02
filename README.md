# sim

Vite + React 19 + PixiJS v8 多 display 项目：全屏画布 + 独立 display + 移动端 PWA。

## 跑起来

```bash
npm install
npm run dev         # vite dev
npm run build       # vite build → dist/
npm run preview     # 预览构建结果
npm run lint        # eslint .
npx tsc -b --noEmit # typecheck
```

## 部署

- 推送到 `origin/sim` → **Cloudflare Pages 接管**（仓库侧无 deploy workflow）
- 部署状态在 Cloudflare Pages 面板查看

## CI/CD（仓库侧）

`.github/workflows/` 提供了完整的检查 + 卫生：

| File | 触发 | 干什么 |
|---|---|---|
| `ci.yml` | push/PR to sim | lint + typecheck + build，artifact 上传 `dist` |
| `codeql.yml` | push/PR + 周一 06:17 cron | JS/TS 安全扫描 |
| `dependency-review.yml` | PR | 依赖变化审查，high severity 失败 |
| `labeler.yml` | PR | 按目录自动 label（pixi/mobile/pwa/...） |
| `stale.yml` | 周一 03:00 | 30 天 stale → 14 天 close |

`.github/dependabot.yml` 周一 09:00 提依赖 PR，minor+patch 一组、major 一组，
`pixi.js ≥ 9` / `react ≥ 20` 被 ignore（避免 major 跳坑）。

`.github/ISSUE_TEMPLATE/` 提供 bug / feature / chore 三种模板。

## 结构

```
.
├── AGENT.md                  （不存在；agent 上下文已并入本 README 末尾）
├── index.html
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
├── public/
│   ├── manifest.webmanifest  PWA manifest
│   ├── sw.js                 Service Worker (cache-first)
│   └── favicon.ico           moonchan
├── src/
│   ├── main.tsx              React 入口
│   ├── App.tsx               PwaGate 包装 RouteSwitch
│   ├── pwa/                  PWA gate 模块（见下）
│   ├── pixi/
│   │   ├── PixiApp.ts        startPixiApp + assertSingleBodyCanvas
│   │   ├── SubCanvas.ts      核心类：AABB + PIXI 风格代理
│   │   ├── SubCanvasProxy.ts
│   │   └── *.md              文档
│   ├── router/
│   │   ├── RouteSwitch.tsx   路由分发 + BackButton（safe-area 感知）
│   │   └── routes.ts         DEFAULT_ROUTE = 'launcher'
│   ├── window/
│   │   ├── Window.tsx        HTML Window（anywhere drag + isInteractive）
│   │   └── createConfirm.tsx 5 种 kind 对话框
│   ├── three/                start3DApp（对称于 startPixiApp）
│   ├── three-displays/       3D displays
│   └── displays/
│       ├── launcher/         PIXI 入口（filter input placeholder + Go）
│       ├── window-mobile/    移动端：堆叠 + 底部 trigger bar
│       ├── single/ multiple/ window/ confirm/ pixi-confirm/
└── .github/
    ├── workflows/
    ├── ISSUE_TEMPLATE/
    ├── dependabot.yml
    └── labeler.yml
```

## Displays 路由

| Route | File | 用途 |
|---|---|---|
| `launcher` | `displays/launcher/LauncherDisplay.tsx` | 入口 home，10 tile grid |
| `single` | `displays/single/` | 全 viewport canvas |
| `multiple` | `displays/multiple/` | 2×2 quadrant grid |
| `window` | `displays/window/` | 拖拽窗口 + 聊天 |
| `window-mobile` | `displays/window-mobile/` | 移动端堆叠 + confirm trigger bar |
| `three` / `two-3d` / `three-euler` / `camera-euler` | `three-displays/` | 3D 场景 |
| `confirm` / `pixi-confirm` | `displays/.../ConfirmDisplay.tsx` | 对话框 playground |

## PWA Gate

`src/pwa/` 模块，可复用。

```
PwaGate (App.tsx 唯一包装点)
├── requireStandalone: 'never' | 'mobile-only' | 'always'
├── enabled?: boolean          总开关
├── bypassStorageKey?: string  localStorage 写入后绕过
├── fallback?: ReactNode       自定义拦截 UI
└── onBypassChange?: (b) => void
```

检测：

- `standalone.ts` — `isStandalone()`（iOS `navigator.standalone` + `display-mode` media query）
- `isMobile.ts` — `detectMobile()` 返回 `{ isMobile, evidence[] }`，≥2 证据才认 mobile

默认拦截 UI 是 `InstallPrompt`（iOS / Android / other 三分支 + "Continue in browser"）。

当前配置：`<PwaGate requireStandalone="mobile-only" bypassStorageKey="pwa-gate-bypass">`

## 单 canvas 不变式

PixiApp 内部有 `assertSingleBodyCanvas()` 和模块级 `bodyCanvases` registry，
**body 中只能有一个 PIXI canvas**。Stale canvas 会在下次 mount 时被强制清理并 dev 模式 warn。

Dev 调试：`import { debugBodyCanvases } from './pixi/PixiApp'`

## 工作约束

1. **不本地 build** — CI/CD 处理
2. **不 commit 第三方二进制**（PIL/zlib），标准库可用
3. **不修改原 display 来演进** — 创建新 display、新路由
4. **commit message 用 conventional commits**：`feat/fix/chore/docs/refactor`，scope 可选
5. **push 到 `origin/sim`**，不创建新分支
6. **SubCanvas 改动保持 PIXI 风格代理 API** + AABB 双向同步
7. **PIXI 单 canvas** — `assertSingleBodyCanvas` 强制

## 关键决策

1. **SubCanvas 不 extends Container** — 独立类 + 代理到 `stage.position`
2. **AABB 双向同步**：`ObservablePoint` callback + `_syncing` flag 防循环
3. **`_subRegions` 私有字段**，`children` 代理到 stage
4. **事件 alias**：`press↔pointerdown` / `move↔pointermove` / `release↔pointerup` / `leave↔pointerleave`
5. **PixiApp `destroyed` flag** 在 `init.then()` 里 short-circuit mount
6. **Window anywhere drag** 不依赖 `stopPropagation`，target 直接 `closest('button, input, ...')` 检查
7. **PwaGate 拦截时 children 不挂载** → 不创建 PIXI canvas → 不污染 body
8. **App.tsx 唯一性包装**，RouteSwitch 不知道 PWA gate 存在（保持可复用）

## Agent 上下文（接手必读）

> 这部分是给后续 agent / contributor 看的状态笔记。

**当前状态（截至最近 commit）**：
- PwaGate 已落地，App.tsx 套上
- PixiApp 单 canvas 不变式已加
- CI 链路齐：lint + typecheck + build + CodeQL + dependency-review + labeler + stale
- Dependabot 周一 09:00 提依赖 PR

**In progress / 未决**：
1. **display 空白问题** — 已通过 PixiApp 的 `assertSingleBodyCanvas` 缓解。Dev 模式看 console 是否有 `[PixiApp] body 已有 N 个 canvas` 警告，如有则定位该 display 的 cleanup 漏点
2. **Launcher input box** — 当前只显示占位符文字 "filter input disabled (tap Go or a tile)"，Go 按钮按了显示 status "input disabled — tap a tile"。实装需引入 hidden HTML input 接管键盘
3. **PWA gate desktop 路径未测** — `InstallPrompt` 的 `!isMobile` 分支会显示 "requires a mobile device"，但目前 desktop 上 gate 不会触发

**关键文件位置**：
- `src/pixi/PixiApp.ts:1` — `startPixiApp` + `assertSingleBodyCanvas`
- `src/pixi/SubCanvas.ts` — 核心类，AABB + PIXI 代理
- `src/pwa/PwaGate.tsx` — gate 组件
- `src/router/RouteSwitch.tsx` — 路由分发 + BackButton
- `src/router/routes.ts` — 路由表 + DEFAULT_ROUTE
- `src/window/Window.tsx` — HTML Window + isInteractive
- `src/displays/window-mobile/WindowMobileDisplay.tsx` — 移动端堆叠 + trigger bar
- `index.html` — manifest link、SW 注册、valid hash 列表

**未做的（按优先级）**：
- [ ] Cloudflare Pages 部署 root 路径（`/` 或 `/dist/`）未确认
- [ ] `.github/CODEOWNERS` — 单一 owner，意义不大
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` — 流程未成形
- [ ] iOS Safari `beforeinstallprompt` 监听（目前 InstallPrompt 只静态指导）
