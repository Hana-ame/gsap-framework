# memo

随手记录 — 每次提交/部署后追加一段。

## 2026-06-01 — sim 分支极简化 + 全屏 Pixi

### 触发
仓库根有大量未跟踪的 `null/`、`fastapi/`、`server/`、`out.txt`、旧 `standalone_tools/` 等历史杂物；远程 `sim` 包含老的 game+server 集成（Toolbar、ServerConnection、Python 后端），与"整理成最小"的目标冲突。

### 动作
- 删 `src/{App,styles,components,controllers,plugins,assets}`（−4130 行）
- 新 `src/` 结构：
  - `main.tsx` — React 入口
  - `App.tsx` — useEffect 启动
  - `PixiApp.ts` — 全屏 PIXI.Application（100vw × 100vh，resize 监听）
  - `Displays.ts` — 显示逻辑：点击圆圈+坐标 / 鼠标十字准星+坐标
  - `index.css` — 100% 重置
- 升级：React 19.2.0 → 19.2.6、@types/react 19.2.5 → 19.2.15、pixi.js 8.16 → 8.18.1；新增 three@0.184 + @types/three@0.184.1
- 远程 `sim` force-push 覆盖（旧的 game+server 集成作废）

### 部署
- 远端 `Hana-ame/sim` ← `10296d8`（Cloudflare 接管 deploy）
- 部署后查看地址：**https://react.moonchan.xyz/**
- 仓库侧无 workflow / 无 webhook / 无 GitHub Pages，Cloudflare 走 GitHub App 模式，部署日志在 Cloudflare dashboard

### 根目录清理
- 删 `vite.config.js`（与 .ts 重复；.ts 为 active）
- 删 `expand.py` / `generate_urls.py`（Python 杂物）
- 删 `fastapi/` / `null/` / `server/` / `out.txt` / `PROMPT.md` / `VERSION.md`（野分支历史残留）
- `README.md` 改写为新项目说明

### 流程约定
- **不本地 build**，改完直接 `git push origin sim`，由 Cloudflare 接管构建部署
- 验证部署：浏览器打开 https://react.moonchan.xyz/

### 生成调用栈的好 prompt（备忘）
要点：
1. 指定缩进树 + `└─` `├─` 框图格式
2. 明确入口点（"从 index.html 开始"）
3. 标 `file_path:行号`
4. 关键代码 3-5 行内联，附"做什么 / 为什么"
5. 覆盖：启动 / 典型用户事件 / resize / 卸载
6. 结尾 markdown 表格总结 3-5 个关键设计
7. 中文叙述 + 英文代码/标识符
8. 长度 100-200 行

模板：
```
你是代码讲解助手。请把 <项目名> 的运行时调用栈画清楚。
要求：
1. 缩进 + └─ ├─ 树形，从 <入口> 追到最深层
2. 每步标 file_path:行号
3. 关键代码 3-5 行内联，附 1 句"做什么"和 1 句"为什么"
4. 至少覆盖：启动 / 一个典型用户事件 / resize / 卸载
5. 结尾用 markdown 表格总结 3-5 个关键设计选择
6. 中文叙述，代码和标识符保持英文
7. 总长 100-200 行
输入：[粘贴代码或文件路径]
```

### 常用命令
```bash
# 拉远端
git fetch origin sim
# 推送（不本地 build）
git push origin sim
# 查看部署（仓库侧无 Actions，仅作参考）
gh run list --repo Hana-ame/Hana-ame --branch sim
```

### 注意
- Node 22.9 < Vite 7 要求的 ≥22.12（仅 warning，构建 OK）
- Tailwind 装在 deps 但 vite.config.ts 没启用（dead weight，待定）

## 2026-06-01 — 多窗口架构（WindowInstance / SubCanvasProxy）

### 目标
一个主 PIXI.Application（canvas 仍挂 body）下，挂多个 `WindowInstance`，每个看上去跟 `PIXI.Application` 一样（`.stage`、`.ticker`、`.renderer`、`.canvas`、`.onPress/.onMove/.onRelease`、`.destroy`），但实际只占用主 canvas 的一个子区域，事件按 bounds 路由。

### 新增文件
- `src/WindowInstance.ts` — 类。内部 = 主 app 的一个 `Container`（`.position = bounds`），外部暴露 PIXI 兼容的 getter 链（`ticker/renderer/canvas` 都是主 app 的代理）；自管 `pointerdown/move/up/leave` 监听。
- `src/SubCanvasProxy.ts` — 代理类。`createWindow(bounds)` / `destroyAll()` / `routePointer(type, e)`。事件从 `PixiApp` 一处统一监听后投喂进来。

### 修改
- `src/PixiApp.ts` — `startPixiApp(onReady?)` 改为接受回调；`onReady(proxy)` 在 `app.init()` 完成后触发；全局 `window` 监听 4 种 pointer 事件，路由到 `proxy.routePointer`。
- `src/Displays.ts` — 签名从 `mountDisplays(app)` 改为 `mountDisplays(win)`；坐标改用 `e.x/e.y`（窗口内局部坐标）；点击环/十字准星都加到 `win.stage`，所以天然在子区域内。
- `src/App.tsx` — `onReady` 里 2×2 创建 4 个 `WindowInstance`，每窗带边框 + 标题 + `mountDisplays`。

### WindowInstance 公开 API（PIXI 兼容面）
```ts
class WindowInstance {
  readonly stage: PIXI.Container       // PIXI.Application.stage
  readonly bounds: { x, y, width, height }
  get ticker(): PIXI.Ticker             // → app.ticker
  get renderer(): PIXI.IRenderer        // → app.renderer
  get canvas(): HTMLCanvasElement       // → app.canvas
  get destroyed(): boolean
  onPress(fn): this                     // pointerdown 在 bounds 内
  onMove(fn): this                      // pointermove
  onRelease(fn): this                   // pointerup
  onLeave(fn): this                     // pointerleave
  off(type, fn): this
  destroy(): void
}
```

### 事件流（点击）
```
[OS] pointerdown @ (cx, cy)
  └─ window 'pointerdown' 监听 (PixiApp.ts)
       └─ proxy.routePointer('pointerdown', e)
            └─ for win in proxy.windows:
                 └─ win.handlePointer('pointerdown', e)
                      ├─ localX = cx - bounds.x
                      ├─ localY = cy - bounds.y
                      ├─ 越界则 return
                      └─ listeners.get('pointerdown').forEach(fn => fn({ type, x: localX, y: localY, ... }))
                           └─ Displays 的 onPress 回调，画 ring + label
```

### 已知限制
- resize 时子窗口 bounds 不变（按创建时的 viewport 算的）。要做响应式：监听 resize → 调 `win.stage.position.set(...)` + 更新 bounds。
- 越界渲染：子窗口内的 Graphics 越界后会画到主 canvas 的别的区域（没加 mask/clip）。如需严格"窗口化"，在 `WindowInstance` 构造时加 `stage.mask = new Graphics().rect(0, 0, w, h).fill(0xffffff)`。
- 每个 WindowInstance 的 ticker/renderer/canvas 都是主 app 的引用——任何"销毁"操作应只走 `win.destroy()`，**别**直接调 `app.destroy()`。

### 设计原则（备忘）
- "PIXI 兼容" = 暴露同名/同形的属性与方法，让用户照搬 PIXI 习惯的代码（`win.stage.addChild`、`win.ticker.add`）
- "proxy 接收 canvas 操作" = 唯一的 `app` 引用在 `SubCanvasProxy` 内部，外部只通过 `proxy.createWindow` / `proxy.routePointer` 间接操作
- 事件路由放在 proxy 一处，单点监听 + 多点分发，避免每个 WindowInstance 都挂监听（性能 + 内存）

## 2026-06-01 — hash router + 单/多窗口分流

### 新增
- `src/router.ts` — `useHashRoute()` hook（自写，不引 react-router）。`Route = 'single' | 'multiple'`，默认 `multiple`；hash 非法自动 replace 到默认
- `src/Nav.tsx` — 右上角固定 nav（两个 `<a href="#single/#multiple">`，当前路由高亮）
- `src/SingleDisplay.tsx` — 1 个 WindowInstance 填满 viewport
- `src/MultipleDisplay.tsx` — 2×2 网格（从原 App.tsx 抽出）

### 修改
- `src/App.tsx` — 极薄：`useHashRoute` + 路由分发，**无 Nav 元素**（canvas 占满 viewport）
- `src/PixiApp.ts` — pointer 监听加 `e.target !== proxy.canvas` 过滤，HTML 元素上的事件不再误触发窗口 click

### 后来删了
- `src/Nav.tsx`（navbar 叠加层） — 用户要求"canvas 占满全屏，hash 路由切换"

### 关键修复
HTML 元素（如果有 nav 之类）在 canvas 之上时，pointer 事件仍冒泡到 `window`，让原实现误以为点在 canvas 上。修复：路由前先看 `e.target` 是不是主 canvas。

### 路由表
| URL | 显示 |
|---|---|
| `https://react.moonchan.xyz/` | redirect → `#multiple` |
| `#single` | 1 个全屏 window + displays |
| `#multiple` | 2×2 网格 window + displays |
| `#anything-else` | 回退到 `multiple` |

### 已知限制（同上次）
- 越界渲染不裁切（无 mask）
- 路由切换瞬时（destroy → init 闪一下）

## 2026-06-01 — resize 响应 + 控件文档

### 触发
用户："支持 resize" + "多查看 PIXI 文档，按照最新的来" + "为每个控件写下调用栈"。

### 动作
- **PIXI v8.18 API 适配**：
  - `PIXI.IRenderer` → `PIXI.Renderer`（v8 改名为联合类型 WebGL/WebGPU/Canvas）
  - `tsconfig.app.json` 删 `erasableSyntaxOnly`（TS 5.8+ 才支持，当前用 5.6.3）
- **resize 支持**（additive，不改原 API）：
  - `SubCanvas.setBounds(bounds)` — 改 `_bounds` + `stage.position` + 触发 `onResize` 回调
  - `SubCanvas.onResize(fn)` — 注册布局回调
  - `SubCanvas.bounds` 改 getter，背后 `_bounds`（保留 readonly 语义，外部不能 `sc.bounds = ...`）
  - `SubCanvasProxy.onWindowResize(fn)` — 包 `window.addEventListener('resize', fn)`，返回 cleanup
  - `MultipleDisplay` 加 `layout(W, H)` 函数 + `onResize` 重画 border
  - `SingleDisplay` 用 `root.setBounds` 响应 resize
- **控件文档**（每个控件一个 .md，调用栈 + API + 使用 + 应用范围 + 注意事项）：
  - `src/pixi/SubCanvas.md`
  - `src/pixi/SubCanvasProxy.md`
  - `src/pixi/PixiApp.md`
  - `src/displays/Displays.md`
  - `src/displays/SingleDisplay.md`
  - `src/displays/MultipleDisplay.md`
  - `src/router/routes.md`
  - `src/router/RouteSwitch.md`
  - `src/router/useHashRoute.md`

### 部署
- 远端 `Hana-ame/sim` ← 当前 HEAD（Cloudflare 接管 deploy）
- 部署后查看地址：**https://react.moonchan.xyz/**

## 待完善（后续 todo）
按重要性排：

1. ~~resize 响应~~ ✅ 完成
2. **越界裁切** — `SubCanvas` 构造时 `stage.mask = new Graphics().rect(0, 0, w, h).fill(0xffffff)`
3. **z-order / 拖动** — 多个 window 堆叠、拖动标题改位置
4. **窗口生命周期事件** — `onFocus` / `onBlur` / `onClose` 回调
5. **Inter-window 通信** — `proxy.broadcast(msg)` 或 `sc1.sendTo(sc2, msg)`
6. **更多 example displays** — 拖拽、键盘事件、文本输入、动画曲线
7. **持久化** — localStorage 记窗口布局
8. **键盘焦点** — tab 切换、Enter/Esc 绑定
9. **路由过渡动画** — single ↔ multiple 切换时淡入淡出
10. **Window class 派生** — `class GameWindow extends SubCanvas`，内置通用工具栏/关闭按钮

## PIXI 文档参考
- 模块索引：https://pixijs.download/release/docs/modules.html
- v8.18 类型变化（与 v7/v8.0 不同）：
  - `Application.renderer` 类型是 `Renderer`（联合），不是 `IRenderer`
  - `Application.destroy(rendererDestroyOptions?, options?)` 仍支持 v7 签名（v8.18 兼容）
  - `Container` 仍用 `position.set(x, y)`
  - `init()` 仍异步，返回 Promise

