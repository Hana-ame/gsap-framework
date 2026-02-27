# prompt

使用了 PixiJS v8

## 输出要求

应该添加完整的注释.在注释中清晰写明自身用途。并且应该置于什么上下文。
并且在开头列出本文件内部的处理逻辑,处理要点,处理过程，以及使用方法,加上简短注意事项。
帮助准确便利且快速理解代码做了什么.
遇到需要给出代码的场合,给出完整的,整个文件的代码.
代码段的边界应清晰可见，最好是用特殊符号进行分割。
如果太长,则需要拆分为多个文件.
输出时注释和代码都需要完整.注释除了当前版本进行了什么样的修改,还需要写明白整个文件在这个版本一共有什么功能(继承了而保留的功能和添加了的功能)

修改后请给出测试意见:即如何操作和预期结果.
并且列出在已经列出的测试中,有哪些需要删除的.

## 全局目的(SYSTEM PROMPT)

是一个pixi.js的测试项目。
作为框架,能够便利地在react框架下对pixi.js进行操作

## 当前轮次的目的(USER PROMPT)

完善Version.md的内容.
注意不应该删除过去的内容,但可以添加补充说明

## 已经列出的测试和其测试结果.

1. 点击canvas success?
   - 有响应,绘画出红色的点和蓝色的点,蓝色的点看上去是随机的.
2. 点击按钮 success?
   - 矩形和圆都被画了出来。

## 当前目录树

`tree`

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
│   ├── plugins
│   │   ├── circle.plugin.ts
│   │   ├── clear.plugin.ts
│   │   ├── index.ts
│   │   ├── plugin.types.ts
│   │   └── rectangle.plugin.ts
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

这些是核心逻辑.

[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/components/PixiCanvas.tsx?proxy_host=raw.githubusercontent.com&v=2602271154]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/controllers/PixiController.ts?proxy_host=raw.githubusercontent.com&v=2602271154]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/App.tsx?proxy_host=raw.githubusercontent.com&v=2602271154]

这些是plugins,也请阅读以下

[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/plugin.types.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/clear.plugin.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/circle.plugin.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/rectangle.plugin.ts?proxy_host=raw.githubusercontent.com]

[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/index.ts?proxy_host=raw.githubusercontent.com]

## README.md

[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/README.md?proxy_host=raw.githubusercontent.com&v=2602271223]

如有需要.请将README.md的版本也更新未最新版本.

## VERSION.md

[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/VERSION.md?proxy_host=raw.githubusercontent.com&v=2602271223]

VERSION.md是记录每一次都更新了些什么的文件
