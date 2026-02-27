# prompt

使用了 PixiJS v8

## 输出要求

应该在注释中清晰写明自身用途，嗯。并且应该置于什么上下文。
并且在开头列出本文件的outline，简短注意事项。
遇到需要给出代码的场合,给出完整的,整个文件的代码.
代码段的边界应清晰可见，最好是用特殊符号进行分割。
如果太长,则需要拆分为多个文件.

## 全局目的(SYSTEM PROMPT)

是一个pixi.js的测试项目。
作为框架,能够便利地在react框架下对pixi.js进行操作

## 当前目的(USER PROMPT)

使用插件来对controller进行处理。
这是为了在日后可以更方便的进行操作。

## 当前目录树

├── src
│   ├── App.css
│   ├── App.tsx
│   ├── assets
│   │   └── react.svg
│   ├── components
│   │   ├── ErrorBoundary.tsx
│   │   ├── PixiCanvas.tsx
│   │   └── TestJSX.jsx
│   ├── controllers
│   │   └── PixiController.ts
│   ├── main.tsx
│   ├── pixijs
│   │   ├── dataSource.ts
│   │   ├── PixiExample.tsx
│   │   └── README.md
│   ├── styles.css
│   ├── test
│   │   └── testDataSource.ts
│   ├── vite-env.d.ts
│   └── websocket
│       ├── useWebsocket.ts
│       ├── webSocketDataSource.ts
│       └── websocket.service.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.js
└── vite.config.ts

## 重要代码(不一定是最新的,因为github有缓存.)

https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/components/PixiCanvas.tsx?proxy_host=raw.githubusercontent.com&v=2602271154
https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/controllers/PixiController.ts?proxy_host=raw.githubusercontent.com&v=2602271154
https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/App.tsx?proxy_host=raw.githubusercontent.com&v=2602271154
