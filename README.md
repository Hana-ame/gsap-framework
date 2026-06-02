# sim

Vite + React 19 + PixiJS v8 多 display 项目：全屏画布 + 独立 display + 移动端 PWA。

---

## 跑起来

```bash
npm install
npm run dev         # vite dev
npm run build       # vite build → dist/
npm run preview     # 预览构建结果
npm run lint        # eslint .
npx tsc -b --noEmit # typecheck
```

---

## 部署

- 推送到 `origin/sim` → **Cloudflare Pages 接管**（仓库侧无 deploy workflow）
- 部署状态在 Cloudflare Pages 面板查看

---

## CI/CD（仓库侧）

`.github/workflows/` 提供完整的检查 + 卫生：

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

---

## 结构

```
.
├── index.html
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts        (sourcemap: true)
├── eslint.config.js
├── public/
│   ├── manifest.webmanifest  PWA manifest
│   ├── sw.js                 Service Worker (network-first nav, cache-first assets)
│   └── favicon.ico           moonchan
├── src/
│   ├── main.tsx              React 入口
│   ├── App.tsx               PwaGate 包装 RouteSwitch
│   ├── ErrorBoundary.tsx     红色 panel，stack + retry（自包含，不依赖全局 hook）
│   ├── pwa/                  PWA gate 模块（见下）
│   ├── pixi/
│   │   ├── PixiApp.ts        startPixiApp + assertSingleBodyCanvas + WebGL 预检
│   │   ├── SubCanvas.ts      核心类：AABB + PIXI 风格代理
│   │   ├── SubCanvasProxy.ts
│   │   └── *.md              文档
│   ├── router/
│   │   ├── RouteSwitch.tsx   路由分发 + BackButton（safe-area 感知）
│   │   └── routes.ts         DEFAULT_ROUTE = 'launcher'
│   ├── window/
│   │   ├── Window.tsx        HTML Window（anywhere drag + isInteractive）
│   │   ├── createConfirm.tsx 5 种 kind 对话框
│   │   └── PixiConfirm.ts    createConfirm — PIXI 化 dialog
│   ├── three/                start3DApp（对称于 startPixiApp）
│   ├── three-displays/       3D displays
│   ├── html-displays/        HTML display
│   ├── ui/                   Loading
│   └── displays/
│       ├── launcher/         PIXI 入口（filter input placeholder + Go）
│       ├── screen-size/      viewport / dpr / device info（PIXI）
│       ├── window-mobile/    移动端：堆叠 + 底部 trigger bar
│       ├── single/ multiple/ window/ confirm/ pixi-confirm/
└── .github/
    ├── workflows/
    ├── ISSUE_TEMPLATE/
    ├── dependabot.yml
    └── labeler.yml
```

---

## Displays 路由

| Route | File | 内容 |
|---|---|---|
| `launcher` | `displays/launcher/LauncherDisplay.tsx` | 入口 home，**纯 HTML** tile grid（10 个 route），filter input 真能过滤 |
| `screen-size` | `displays/screen-size/ScreenSizeDisplay.tsx` | **PIXI** 实时显示 inner / visualViewport / screen / dpr / 设备信息 |
| `single` | `displays/single/SingleDisplay.tsx` | 全 viewport canvas + 鼠标十字准星 + 点击圆点 |
| `multiple` | `displays/multiple/MultipleDisplay.tsx` | 2×2 quadrant grid |
| `window` | `displays/window/WindowDisplay.tsx` | 拖拽窗口 + 聊天 |
| `window-mobile` | `displays/window-mobile/WindowMobileDisplay.tsx` | **移动端堆叠**：5 个 confirm kind 通过底部 trigger bar 弹出 |
| `three` | `three-displays/three/` | PIXI 3D 场景 |
| `two-3d` | `three-displays/two-3d/` | 两个同步 3D 视图 |
| `three-euler` | `three-displays/three-euler/` | 欧拉角 demo |
| `camera-euler` | `three-displays/camera-euler/` | 相机旋转 demo |
| `confirm` | `html-displays/confirm/` | HTML 对话框 playground |
| `pixi-confirm` | `displays/pixi-confirm/PixiConfirmDisplay.tsx` | **PIXI confirm 组件 playground**：5 个 trigger 测不同 kind |

`WindowMobileDisplay` 和 `PixiConfirmDisplay` 都用 `createConfirm` 建 PIXI 对话框，
但侧重点不同：
- `window-mobile`：演示**移动端自适应 layout** + **trigger bar 模式**（5 个 kind 按钮挤在底部）
- `pixi-confirm`：演示 **`createConfirm` 本身**（5 个 trigger 一字排开，每个展示不同 kind）
  顶部 header 写明 "buttons in anywhere-drag mode must not trigger drag"——这是组件要保证的不变式

---

## PWA Gate

`src/pwa/` 模块，可复用。

```
PwaGate (App.tsx 唯一包装点)
├── requireStandalone: 'never' | 'mobile-only' | 'always'
├── enabled?: boolean          总开关
├── bypassStorageKey?: string  localStorage 写入后绕过
├── rememberBypass?: boolean   写入是否持久化（默认 true）
├── showContinue?: boolean     是否显示 "Continue in browser" 按钮（默认 true）
├── fallback?: ReactNode       自定义拦截 UI
└── onBypassChange?: (b) => void
```

检测：

- `standalone.ts` — `isStandalone()`（iOS `navigator.standalone` + `display-mode` media query）
- `isMobile.ts` — `detectMobile()` 返回 `{ isMobile, evidence[] }`，≥2 证据才认 mobile

默认拦截 UI 是 `InstallPrompt`（iOS / Android / other 三分支 + "Continue in browser"）。

当前配置：`<PwaGate requireStandalone="mobile-only" bypassStorageKey="pwa-gate-bypass">`

---

## 单 canvas 不变式

PixiApp 内部有 `assertSingleBodyCanvas()` 和模块级 `bodyCanvases` registry，
**body 中只能有一个 PIXI canvas**。Stale canvas 会在下次 mount 时被强制清理并 dev 模式 warn。

`canvases: Set<HTMLCanvasElement>` 模块级跟踪，mount 时 add，cleanup 时 delete。
Dev 调试：`import { debugBodyCanvases } from './pixi/PixiApp'`

---

## 失败可见性（诊断代码，不清理）

PWA gate 之外的 PIXI 失败有 3 层可见性：

1. **`probeWebGL()` 在 `startPixiApp` 入口**——没有 webgl/webgl2 context → 红色 overlay with UA / dpr / viewport / vendor / renderer
2. **PIXI init `.catch()`**——红色 overlay with init error、stack、renderer type、webgl version、device fingerprint
3. **`onReady` try/catch**——display 自己的 setup 抛错 → 红色 overlay with stack
4. **dev-only 2 秒后健康检查**——采样 canvas 32×32 patch，如果 stage 有 children 但 canvas 全黑 → "PIXI canvas is blank" overlay

`ErrorBoundary` 红色 panel（stack + Retry）不依赖 `__paintError` 全局，**自包含**。

`index.html` 全局 `error` / `unhandledrejection` handler 把错误 paint 到 `#root`。

---

## 工作约束

1. **不本地 build** — CI/CD 处理
2. **不 commit 第三方二进制**（PIL/zlib），标准库可用
3. **不修改原 display 来演进** — 创建新 display、新路由
4. **commit message 用 conventional commits**：`feat/fix/chore/docs/refactor`，scope 可选
5. **push 到 `origin/sim`**，不创建新分支
6. **SubCanvas 改动保持 PIXI 风格代理 API** + AABB 双向同步
7. **PIXI 单 canvas** — `assertSingleBodyCanvas` 强制
8. **不清理任何有助于测试的代码**（probeWebGL / showFatalOverlay / dev health check / ErrorBoundary 保留）

---

## 关键决策

1. **SubCanvas 不 extends Container** — 独立类 + 代理到 `stage.position`
2. **AABB 双向同步**：`ObservablePoint` callback + `_syncing` flag 防循环
3. **`_subRegions` 私有字段**，`children` 代理到 stage — SubCanvas 树是事件路由真源，PIXI 树是渲染顺序
4. **tag-based drag**：子节点 `label === 'subcanvas-drag-handle'` 视为拖拽手柄；`dragMode: 'anywhere'` 时若没有 tagged child 则自动加一个 `zIndex=-1` 的透明 bg
5. **PixiApp `destroyed` flag** 在 `init.then()` 里 short-circuit mount
6. **Window anywhere drag** 不依赖 `stopPropagation`，target 直接 `closest('button, input, ...')` 检查
7. **PwaGate 拦截时 children 不挂载** → 不创建 PIXI canvas → 不污染 body
8. **App.tsx 唯一性包装**，RouteSwitch 不知道 PWA gate 存在（保持可复用）
9. **PIXI v8 `ObservablePoint` 构造签名**：第一个参数是 `Observer<T> = { _onUpdate: (p?: T) => void }` 对象，不是 callback
10. **PIXI/THREE canvas 尺寸**：`position: fixed; inset: 0; width/height: 100%`，不用 `100vw` / `100vh`（mobile Safari 是 "large viewport" 会溢出）
11. **HTML overlay 尺寸**：`position: absolute; top/right/bottom/left` inset，不用 `calc(100vh - Npx)`
12. **Launcher 入口**是纯 HTML/CSS（不依赖 PIXI）—— 保证 WebGL 失败的设备上 home 仍可见；其他 display 可以是 PIXI（渐进增强）
13. **拖拽通过 PIXI FederatedEvents**，不用 window 全局 pointer 监听；`app.stage.eventMode` 必须是 `'static'` 才能让 `app.stage.on('pointermove')` 收到冒泡上来的事件
14. **可点击子节点用 PIXI 原生 hit-test**（`Container` + `eventMode='static'` + `hitArea` + 自己的 `pointerdown` + `stopPropagation`），不走 SubCanvas 的 `onPress` AABB 路由 — AABB 路由只服务于 `mountDisplays` 这种 legacy 可视化场景
15. **`bringToFront` / `sendToBack` 用 sibling `zIndex` 扫描** + `parent.sortableChildren = true`，不用静态计数器 — 避免和 `anywhere` 模式的 bg `zIndex=-1` 冲突
16. **SubCanvas 的 `addChild` 代理到 `stage.addChild` 同时检测 drag label**：`win.stage.addChild`（PIXI 原生）会绕过自动安装拖拽。tagged child 必须通过 `SubCanvas.addChild` 添加

---

## 踩过的坑（按问题分类，方便回查）

### PIXI 拖拽

- **drag 装好了但不响应**：`SubCanvas.addChild` 才是安装拖拽的入口；`win.stage.addChild` 会绕开。如果 `console.log('installDragOnHandle')` 一次都不打 → 走 PIXI 原生 addChild 了。**修法**：tagged child 一律用 `win.addChild(bar)`。
- **pointerdown 触发了，pointermove 没反应**：`app.stage.eventMode` 没设成 `'static'`。PIXI v8 默认 `'auto'` 不会收到子节点冒泡上来的事件。**修法**：PixiApp init 里 `app.stage.eventMode = 'static'`。
- **PIXI v8 Graphics hit-area 不稳**：复杂图形用 `Graphics` + `eventMode='static'` 命中测试会"打飞"。**修法**：用 `Container` 包一层 + 显式 `hitArea = new Rectangle(...)`，命中稳。
- **快拖脱手（fast drag drop）**：用户或自动化用 `mouse.move` 单步跳到远处时，窗口不动。原因：PIXI v8 FederatedEvent **每个 move 都过 hit-test**；指针跳到无 interactive child 的位置时，事件 *不会* 分发给任何 listener — 既不发给 handle，也不发给 `app.stage`（即使 `eventMode='static'` 也不行，因为根本没有 target）。**症状**：`onDown` 触发，`onMove` 一次都不打，`onUp` 的 `target=undefined`。**修法**：drag 装两层 — PIXI 的 `app.stage.on('pointermove')` 当主路径（命中区在时同步），**同时 `window.addEventListener('pointermove')` 当 backup**（DOM pointer event 不做 hit-test，永远触发）。位置直接读 `e.clientX/clientY`（canvas 是 `position: fixed; inset: 0`，`client==canvas-relative==PIXI coord`）。`window` 监听器在 `onDown` 装、`onUp` 拆。**这是 PIXI v8 第二次踩了 — 第一次靠 `app.stage` 监听器绕过、第二次必须 fallback 到 DOM 级别。**

### 部署 / 缓存

- **Cloudflare Pages 灰度 deploy**：HTML 立即更新，子 bundle（`assets/xxx-[hash].js`）还在旧 hash 状态。**症状**：页面报 `Failed to fetch dynamically imported module`，MIME type `text/html` 404 页。**修法**：等 1-2 分钟；不要在 push 完立即 playwright 测。
- **SW cache 撞 stale**：SW 是 `sim-v2`，network-first nav 仍然可能命中旧 cache。**症状**：本地改完的代码 push 后访问没生效。**修法**：`unregister` 一次 SW 再 reload；或 DevTools → Application → Clear storage。

### 文件 / 路径

- **Vite/tsc 静默接受错误路径**：`src/components/windowing/PixiWindow.ts` 写成 `from '../pixi/SubCanvas'` 解析成 `src/components/pixi/SubCanvas`（不存在），但 build 通过。**修法**：import 路径必须用相对 depth（`../../pixi/SubCanvas`），写完用真实 tsc 验证。

### React 19

- **`useHead` deps**：config 引用每次渲染都是新对象。**修法**：要么 `useMemo` 化 config，要么 dep 列表里写具体字段（`[config.title, config.description]`）。
- **`useState` initializer 内副作用**（如读 `localStorage`）：在 SSR 下 `typeof window` 是 undefined。**修法**：用 `useEffect` 做副作用，或 `typeof window !== 'undefined'` 守卫。

### 错误可见性

- **PIXI 黑屏没报错**：四层诊断 `probeWebGL()` → `init.catch()` → `onReady` try-catch → 2s dev 健康检查。**不要清理这段**。
- **`ErrorBoundary` 自包含**：不依赖 `__paintError` 全局，组件自己渲染红色 panel。

### v8 PIXI 怪事

- **`Container.position` setter 是 `this._position.copyFrom(value)`**：外部给 `_position._observer` 装的 observer 会被丢弃。**修法**：SubCanvas 用显式 `setBounds` / `setPosition` 同步。
- **`getLocalPosition(parent)` 在 `'auto'` eventMode 上不可靠**：必须 `eventMode='static'`，否则 event 的 `target` 是错的。

---

## Agent 上下文（接手必读）

> 这部分是给后续 agent / contributor 看的状态笔记。

### 当前状态

- ✅ **PIXI 在 mobile 上能跑了**（29d37df 修 `ObservablePoint` 签名）
- ✅ **PIXI canvas 不溢出**（c7e1f05 inset:0 替代 100vw/100vh）
- ✅ **HTML overlay 不溢出**（calc(maxHeight) → absolute inset）
- ✅ **Event log 框不再吃屏**（79cf334 maxWidth:200/240, maxHeight:40vh）
- ✅ **PIXI 黑屏有 4 层可见诊断**（probeWebGL / init catch / onReady try-catch / 2s health check）
- ✅ **ErrorBoundary 自包含**（不依赖 `__paintError` 全局）
- ✅ **SW 强制更新**（sim-v2 + skipWaiting + controllerchange reload + SW_UPDATED message）
- ✅ **PwaGate**（mobile-only、bypass、rememberBypass、showContinue 各自独立）
- ✅ **CI 链路齐**：lint + typecheck + build + CodeQL + dependency-review + labeler + stale
- ✅ **Dependabot 周一 09:00** 提依赖 PR
- ✅ **Sourcemap 上线**（vite.config.ts `build.sourcemap: true`）

### In progress / 未决

- ✅ **SubCanvas drag 系统重构完成**（commits 94d21b4..9a9075f）：clipToBounds / 死代码 / dragBounds / zIndex bringToFront / tag-based drag / 移除 grid+divide / 移除 event-alias layer
- ✅ **PixiWindow + PixiConfirm 迁移到新 drag 系统**：用 `win.addChild(bar)` 触发自动安装 + 每个 button 自己的 `pointerdown` + `stopPropagation`
- ✅ **PIXI drag 验证**（playwright 拖拽 Inventory 标题栏 / #pixi-confirm dialog）：drag 实际移动窗口
- **Launcher input box 当前能用**（filter 真的过滤了，10 个 tile 中显示匹配的）
- **PWA gate desktop 路径未测** — `InstallPrompt` 的 `!isMobile` 分支会显示 "requires a mobile device"

### 关键文件位置

- `src/pixi/PixiApp.ts:1` — `startPixiApp` + `assertSingleBodyCanvas` + `probeWebGL` + `showFatalOverlay` + 2s health check
- `src/pixi/SubCanvas.ts:160` — `setBounds` / `setPosition` / `setSize` 全部带 `_destroyed` 守卫
- `src/pixi/SubCanvas.ts:71` — `ObservablePoint(observer_obj, x, y)` 必须是 Observer 对象
- `src/pwa/PwaGate.tsx` — gate 组件（enabled / requireStandalone / bypassStorageKey / rememberBypass / showContinue / fallback / onBypassChange）
- `src/router/RouteSwitch.tsx` — 路由分发 + BackButton（route === 'launcher' 不显示 BackButton）
- `src/router/routes.ts` — 路由表 + DEFAULT_ROUTE
- `src/components/windowing/Window.tsx` — HTML Window + isInteractive
- `src/components/windowing/PixiConfirm.ts` — `createConfirm` PIXI dialog
- `src/displays/window-mobile/WindowMobileDisplay.tsx` — 移动端堆叠 + trigger bar
- `src/displays/pixi-confirm/PixiConfirmDisplay.tsx` — confirm 组件 playground
- `src/displays/screen-size/ScreenSizeDisplay.tsx` — viewport/dpr/device info
- `src/ErrorBoundary.tsx` — 红色 panel 自包含
- `index.html` — manifest link、SW 注册、valid hash 列表、global error handlers

### 未做的（按优先级）

- [ ] Cloudflare Pages 部署 root 路径（`/` 或 `/dist/`）未确认
- [ ] `.github/CODEOWNERS` — 单一 owner，意义不大
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` — 流程未成形
- [ ] iOS Safari `beforeinstallprompt` 监听（目前 InstallPrompt 只静态指导）

---

## 对话历史（关键提问 + 决策）

> 这部分是会话中的关键交互，给后续 agent 上下文。

### Session 1：sim 分支迭代

- 用户在 sim 分支做手机适配 + PWA + launcher
- 最初要求："点 tile 进 display 后黑屏"
- 决定 manifest `start_url` → `/#launcher`（避免 PWA installed 模式直接进 PIXI display）
- 决定 SW 改 network-first + bump cache version + skipWaiting + controllerchange reload

### Session 2：PwaGate 可复用化

- 用户："这个不让启动的设置需要是可以复用的"
- 用户："并且可以选择是否开启" → 加 `enabled` + `bypassStorageKey` props
- 设计：`requireStandalone: 'never' | 'mobile-only' | 'always'`
- 检测逻辑拆 utility：`standalone.ts`、`isMobile.ts`
- 默认 UI 是 `InstallPrompt`（iOS / Android / other 三分支）

### Session 3：CI/CD

- 用户："可否给 github 编一下 cicd 更多的"
- 用户："不能的话直接 webfetch" → 用 webfetch 看了仓库结构
- 用户："算了直接加到 README 里面好了" → AGENT.md 并入 README
- 加了 ci.yml、codeql.yml、dependency-review.yml、labeler.yml、stale.yml + dependabot + issue templates

### Session 4：手机打开黑屏

- 用户："现手机打开什么东西都没有的"
- 决定加 4 层失败可见性：probeWebGL、init catch、onReady try-catch、2s health check
- 决定 ErrorBoundary 自包含渲染（不依赖 `__paintError`）
- 用户："你他妈的 pixi 几个点进去就是黑屏没内容的你他妈的有毛病吧，我这个是pixi项目"
  → **PIXI 是核心不动，加诊断让失败可见**
- 用户："你怎么不早点给 error screen" → 之前只在 console.error，失败不可见

### Session 5：PIXI ObservablePoint 签名

- 错误：`this._observer._onUpdate is not a function at set x at new ObservablePoint at createRegion`
- 根因：PIXI v8 `ObservablePoint` 构造签名改了
  - v7：`new ObservablePoint(callback, scope)`
  - v8：`new ObservablePoint(observer, x, y)`，observer 是 `{ _onUpdate: (p?: T) => void }`
- 修复：`src/pixi/SubCanvas.ts:71` 改成 Observer 对象
- 加 vite `build.sourcemap: true`（dev overlay stack trace 可读）

### Session 6：屏幕尺寸 app

- 用户："重新出现了，添加一个 app，显示屏幕长宽"
- 加 `ScreenSizeDisplay` (route `screen-size`)——PIXI 实时显示 inner / visualViewport / screen / dpr / 设备信息

### Session 7：inner vs screen + 溢出

- 用户："正常显示内容重新出现了" → PIXI 修好了
- 用户："bug了回复不了，总之你不要清理任何有助于测试的代码" → 保留诊断代码
- 用户："另外屏幕用 inner，而不要用 screen，你有几个 app 会溢出"
- 修复：
  - PIXI/THREE canvas 改 `inset: 0; width/height: 100%`（替代 `100vw`/`100vh`，mobile Safari 是 large viewport）
  - HTML overlay 改 `absolute inset`（替代 `calc(100vh - Npx)`）
  - Launcher grid mobile 上 1 列 → 2-3 列起步
  - ScreenSizeDisplay table 紧凑 + rowH 动态

### Session 8：event log 框太大

- 用户："谁让你 event 这么大的，event 这么大我看什么啊"
- 改 maxWidth 240/200 + maxHeight 40vh/35vh + fontSize 10 + padding 6

### Session 9：WindowMobile vs PixiConfirm

- 用户："window Mobile 和 pixi confirm 有什么区别"
- 答：都用 `createConfirm` 建 PIXI dialog
  - `window-mobile` = 移动端自适应 layout 演示（trigger bar 模式）
  - `pixi-confirm` = `createConfirm` 组件 playground（一字排开 5 个 trigger 测不同 kind）

### Session 10：destroy 后 setBounds 崩溃

- 错误：`TypeError: Cannot read properties of null (reading 'set') at n_.setBounds`
- 根因：display 卸载时 PIXI 异步 cleanup（resize 事件还在 queue），destroy 后 `stage.position` 被 nullify
- 修复：`setBounds` / `setPosition` / `setSize` 全部加 `_destroyed` 守卫

### Session 11：README 包含历史

- 用户："当前内容和对话信息都存到 readme.md 里面"
- 用户："包括历史提问" → 这份 README
