# 野分支 `9a2d559` 存档

> 2026-06-01 极简重写 sim 之前，远程 `origin/sim` 末端的提交。
> 已被 force-push 覆盖；本文件作为档案留存。

## 元信息

| 项 | 值 |
|---|---|
| 顶端 commit | `9a2d559` (空 commit，只删了三个 prompt log 文件) |
| 总 commit 数 | 34 |
| 起始 commit | `4a1bec5` Initial commit |
| 根作者 | lumino `<luminovoez@gmail.com>` |
| 关系 | `origin/sim` 被 `sim@10296d8` 强制覆盖前的最后状态 |

`9a2d559` 在 reflog 中仍可达（`git show 9a2d559`），但不在任何分支上。
GitHub 端历史已被覆盖（除非有第三方镜像）。

## 完整 commit 列表

```
9a2d559  (空提交，清除 LAST/MESSAGE/THIS_RESPONSE 三个 prompt 日志)
101f50b  milestone.
ef803f1  完成前后端集成，修复坐标问题，优化界面并移除调试日志
761bc1f  AI说都过了，我信了
9c61c24  非常厉害是说
c764da3  getDemoContainer
6dcf654  readme & version.md
7d8d065  v8适配是Gemini做的
4ab09c8  修改expand.py 感觉prompt也是需要编译的了.
aaa10fb  竟然连strict模式也解决了.
51b02f5  very nice
2fe0243  完全胜利
9f0d4a4  强而有力，强而有力呀。
739aab0  好像人连strict的模式都攻克了。
e3c6b50  plugins
153a88f  你不是给改的，基本上没有review。
10049d9  真的可以用，但是代码很难看。
9f414a7  这个可以用，你牛大了。
ca9a9a0  Merge remote-tracking branch 'origin/sim' into sim
b79a6c0  whatisitnow?
f23fca3  strictmkde
1947ec8  ErrorBoundary
eb8a414  type,installpixijs
ea73ae5  verbatimModuleSyntax
394724e  deepseek
2310c06  no strict
858cdf5  mobile
63eda00  通过vite创建
740077d  (server/ + ds/ 初始)
b1dc859  HJB
ff225ce  readme
239b829  init
11d90ac  all files
4a1bec5  Initial commit
```

## 顶层目录

```
.env
.gitignore
PROMPT.md
README.md
SYSTEM_PROMPT.bak
VERSION.md
eslint.config.js
expand.py
fastapi/
generate_urls.py
index.html
log.md
null/                ← 杂物
out.txt
package.json
package-lock.json
server/              ← Python ECS 后端
src/
test_client.html
tsconfig.*
vite.config.*
```

## 关键模块

### `server/` — Python ECS 后端
`__init__.py`、`components.py`、`config.py`、`distance.py`、`ecs.py`、`ecs_1.py`、`main.py`、`myserver.py`、`systems.py`、`test_ecs.py`、`test_server.py`、`README.md`

由 `ef803f1` / `761bc1f` 一系列提交引入；前端通过 `src/controllers/ServerConnection.ts` 连接（WebSocket？测试客户端在 `test_client.html`）。

### `fastapi/` — FastAPI 实验
`server.py`、`.gitignore`。看起来只是一个独立的 FastAPI 尝试，**与 sim 主项目没有集成**。

### `null/` — 杂物
`null/HJB/{HJB.md, HJB.py, readme.md}`、`null/convert.py`。来源不明，未使用。

### `src/` — PixiJS v8 + React 19 + 插件架构
- `App.tsx` — 主组件，含按钮工具栏（开始/暂停/步进/清除）、事件日志面板
- `components/PixiCanvas.tsx` — 259 行 canvas 容器（鼠标/触摸事件→Controller）
- `components/Toolbar.tsx` — 工具栏
- `controllers/GameController.ts` — 业务逻辑，~388 行
- `controllers/PixiController.ts` — 插件消息中枢
- `controllers/ServerConnection.ts` — 与后端通信
- `plugins/` — 完整插件体系：
  - `balls.plugin.ts`、`bounce.plugin.ts`、`circle.plugin.ts`、`clear.plugin.ts`、`fireworks.plugin.ts`、`gameOfLife.plugin.ts`、`rectangle.plugin.ts`、`apiDemo.plugin.ts`
  - `physics/` 子模块（balls、dvd、state、types、utils、index）
  - `api-demo/` 子模块（demos 9 个 + state/types/utils/index）

### 根目录杂物
- `PROMPT.md` (5KB)、`SYSTEM_PROMPT.bak` (1.8KB)、`SYSTEM_PROMPT.txt`、`out.txt` (168KB)、`log.md`、`expand.py`、`generate_urls.py`
- `LAST_RESPONSE.txt` / `MESSAGE.txt` / `THIS_RESPONSE.txt` — 与其他 AI 对话时留下的 prompt 日志（已在 `9a2d559` 中清除）

## 包依赖（`package.json` on `9a2d559`）

```json
{
  "name": "sim",
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build", ... },
  "dependencies": {
    "@tailwindcss/vite": "^4.1.18",
    "pixi.js": "^8.16.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "tailwindcss": "^4.1.18"
  },
  "devDependencies": {
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "eslint": ...,
    "vite": "^7.2.4"
  }
}
```

注意：**没有 `three`**。本轮新增的 `three@0.184` 是从这次极简重写起加入的。

## 启用方式（如果想回滚验证）

```bash
# 切到野分支（detached HEAD，HEAD reflog 仍可达）
git checkout 9a2d559
# 或在当前 sim 上 cherry-pick
git checkout sim && git cherry-pick <commit>
# 恢复整个旧分支
git branch wild/sim-9a2d559 9a2d559
```

> ⚠️ 旧项目里有 `node_modules` 之外的 `.env`、Python 依赖、可能的真实凭据——回滚前先翻 `.env` 和 `server/config.py`。

## 决策记录

- 2026-06-01: 用户拍板 force-push 覆盖（[memo.md](./memo.md) 记录），原因是新方向（极简 + 全屏 Pixi + Displays 分离）与旧 game+server 集成不兼容
- 旧 server/、fastapi/、null/、out.txt、PROMPT.md 等杂物在新 sim 上均不存在
- 如果以后需要重启后端集成，可从 `ef803f1` / `761bc1f` 提取 `server/` 与 `ServerConnection.ts`
