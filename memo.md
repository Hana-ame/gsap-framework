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
