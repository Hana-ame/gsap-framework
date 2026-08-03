# AGENTS.md — Hana-ame

项目级规则，所有 agent 必须遵守。同 `.opencode/agents/PixiBuild.md`（subagent 专用），这里是项目根级、适用于任何 agent 的硬约束。

## 现状

- 仓库：`Hana-ame/gsap-framework`，生产分支 `main` → Cloudflare Pages → `https://react.moonchan.xyz/`
- `sim` 分支是废弃集成分支，**永远不要 push 到 sim**
- VN 框架正在分支 `vn-rework` 上重写（剧本驱动、与旧 `src/avd` 解耦）；新引擎在 `src/vn/`

## 硬规则（违反会返工）

1. **不要用本地 run 验证效果** — 用户以**已部署的 `https://react.moonchan.xyz/`** 为准验收。push → 等 CF Pages → curl 该站 (+ per-deploy `*.pages.dev` URL)。除非用户明确要求本地 dev/preview，否则不得声称某功能"完成"，直到它在线上生效。
2. **H-scene 图片一律用 `ex.moonchan.xyz` 外链**（`ex.moonchan.xyz/s/<hash>/<id>?redirect_to=image`），**不用 `/game-cgs/`**。外链在 DOM `<img>` 无 CORS 限制。旧的 `game-cgs` 本地图方案已被用户否决。
3. **VN 场景剧本 / 图片映射表绝不进主 bundle**。`examples.ts` 里每个示例组件必须用 `React.lazy(() => import('./路径/X'))` 分离成独立 chunk，按 `#hash` 按需加载。静态 import 会把所有场景 + URL 拖进 1.9MB 主包（曾引发 504）。
4. **VN 框架走 `src/vn/` 新引擎**（JSON 剧本驱动：`preload`/`say`/`bg`/`choice`/`jump`/`label`/`end`，`preload` 带 `{key,url}` 和 `wait`）。旧 `src/avd/*` 是遗留代码，**不要扩展它**。
5. 资源**按剧本加载**，`preload.wait:true` = 等加载完再继续，`wait:false` = 不等也能继续 —— 两种加载模式都要支持。

## Git 约定

- 交互 git 用内联身份：`git -c user.name=lumin -c user.email=luminovoez@gmail.com ...`
- `main` 提交前必须 `npm run lint` 绿；CI 处理 typecheck/build
- 结构改动（framework/components/example）先声明归属，不跨越 `index.ts` 直连