# sim

极简 Vite + React 19 + PixiJS v8 项目，全屏画布 + 独立显示逻辑。

## 跑起来

```bash
npm install
npm run dev      # 开发
npm run build    # 构建到 dist/
npm run preview  # 预览构建结果
```

## 结构

```
.
├── index.html
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
├── src/
│   ├── main.tsx       React 入口
│   ├── App.tsx        useEffect 启动 PixiApp
│   ├── PixiApp.ts     全屏 PIXI.Application（100vw × 100vh，resize 监听）
│   ├── Displays.ts    显示逻辑：点击圆圈+坐标 / 鼠标十字准星+坐标
│   └── index.css      100% 重置
├── memo.md            随笔记录
└── WILD_BRANCH.md     野分支 9a2d559 存档
```

## 行为

- PixiJS 直接接管 viewport，canvas 为 `100vw × 100vh`
- 鼠标移动：屏幕中央跟随一个绿色十字准星 + 左上角实时坐标
- 点击：点击处出现品红色圆点 + 扩散环 + 坐标标签 + 累计计数

## 部署

- push 到 `origin/sim` → Cloudflare 接管（具体配置见 Cloudflare dashboard）
- 检查：仓库侧无 workflow，部署状态在 Cloudflare Pages 面板查看
