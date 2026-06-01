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

### 常用命令
```bash
# 部署状态
gh run list --repo Hana-ame/Hana-ame --branch sim
gh run watch <run-id> --repo Hana-ame/Hana-ame
# 拉远端
git fetch origin sim
```

### 注意
- Node 22.9 < Vite 7 要求的 ≥22.12（仅 warning，构建 OK）
- 仓库根的 `null/`、`fastapi/`、`server/`、`out.txt`、`PROMPT.md` 暂未清理（待你决定）
- Tailwind 装在 deps 但 vite.config.ts 没启用（dead weight）
