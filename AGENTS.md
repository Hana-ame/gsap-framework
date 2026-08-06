# AGENTS.md — Hana-ame

项目级规则，所有 agent 必须遵守。同 `.opencode/agents/PixiBuild.md`（subagent 专用），这里是项目根级、适用于任何 agent 的硬约束。

## 现状

- 仓库：`Hana-ame/gsap-framework`，生产分支 `main` → Cloudflare Pages → `https://react.moonchan.xyz/`
- `sim` 分支是废弃集成分支，**永远不要 push 到 sim**
- VN 框架 = `src/vn/`（剧本驱动，已从 `vn-rework` 合并到 `main` 并上线）。旧 `src/avd/*` 是遗留代码，不要扩展
- 默认入口：`#vn-title`（数据驱动标题界面）→ `#vn-menu`（HS 回想菜单）→ `#hscene-<key>`（H 场景）；还有 `#vn-recall`（解锁回想）、`#component-vn`

## 硬规则（违反会返工）

1. **不要用本地 run 验证效果** — 用户以**已部署的 `https://react.moonchan.xyz/`** 为准验收。push → 等 CF Pages → curl 该站 (+ per-deploy `*.pages.dev` URL)。除非用户明确要求本地 dev/preview，否则不得声称某功能"完成"，直到它在线上生效。
2. **H-scene 图片一律用 `ex.moonchan.xyz` 外链**（`ex.moonchan.xyz/s/<hash>/<id>?redirect_to=image`），**不用 `/game-cgs/`**。外链在 DOM `<img>` 无 CORS 限制。旧的 `game-cgs` 本地图方案已被用户否决。
3. **VN 场景剧本 / 图片映射表绝不进主 bundle**。`examples.ts` 里每个示例组件必须用 `React.lazy(() => import('./路径/X'))` 分离成独立 chunk，按 `#hash` 按需加载。静态 import 会把所有场景 + URL 拖进 1.9MB 主包（曾引发 504）。
4. **VN 框架走 `src/vn/` 新引擎**（剧本驱动，`VnScript` = meta + lines）。指令集：`preload`（`{key,url}` + `wait`）、`say`（`bg`/`cg` + `stand`/`standPos` 立绘 + `index`/`zIndex` + `fadeMs` + `effect`）、`wait`（显式挂起等点击，可带 `effect`）、`bg`（cover 占满）、`cg`（contain 看全）、`choice`（`options[].to` + `set` 写变量 + `showWhen` 条件显示）、`jump`（label / `#hash` / `https://` / 场景名，`if` 条件满足才跳）、`label`、`hook`（内嵌 `run(vn)` 操作 VnHandle 或声明式 fetch）、`audio`（bgm/sfx/voice）、`menu`（title/list/grid 数据驱动界面）、`stand`（立绘进出场动画）、`transition`（全屏转场）、`video`（全屏视频演出）、`end`（可 `goto`）。meta 支持 `ui`（对话框/选项/CG/标题布局样式）、`typeSpeed`、`strictLoad`。详见 `src/vn/README.md`。旧 `src/avd/*` 是遗留代码，**不要扩展它**。
5. 资源**按剧本加载**，`preload.wait:true` = 等加载完再继续，`wait:false` = 不等也能继续 —— 两种加载模式都要支持。
6. **图层**：`bg` 背景层（cover 占满），`cg` CG 层（contain 看全）。同 `index` 时 cg 在 bg 前；`index`/`zIndex` 可选控制叠加。CG 不要 cover（会裁切溢出）。
7. **场景播放完自动回菜单**：场景 `end.goto:'#vn-menu'`。
8. **跨场景状态**（`src/vn/global-state.ts`，localStorage 持久化）：场景 `end` 自动 `markSceneSeen(scriptKey)` 写 `seen_<key>`；回想解锁用 `showWhen: "$seen_<key>"`。`showWhen`/`jump.if` 求值视图 = 全局 ⊕ 本地。场景组件必须传 `scriptKey`（场景名），否则解锁不生效。

## Git 约定

- 交互 git 用内联身份：`git -c user.name=lumin -c user.email=luminovoez@gmail.com ...`
- **每个有意义的进展必须新建 commit**（`type(scope): 描述`），不得攒着一次性提交
- **push 由用户决定：agent 绝对不可以自行 push**。有 push 需求/进展时只提交 commit，然后明确问用户是否 push
- `main` 提交前必须 `npm run lint` 绿；CI 处理 typecheck/build
- 结构改动（framework/components/example）先声明归属，不跨越 `index.ts` 直连