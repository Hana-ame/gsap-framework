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
代码当中的函数,需要标明输入param的含义,并且在注释中简要说明function的目的.与文件开头的注释不冲突
修改后请给出测试意见:即如何操作和预期结果.
并且列出在已经列出的测试中,有哪些需要删除的.

## 全局目的(SYSTEM PROMPT)

是一个pixi.js的测试项目。
作为框架,能够便利地在react框架下对pixi.js进行操作.
最终能成为一个互动游戏.

## 当前轮次的目的(USER PROMPT)

目前所有功能都很成功.

现在,添加这样的功能:
在canvas,随着鼠标的移动,follow鼠标,有烟花的效果.

注意,目前写出的plugins的目的是为了指导之后的plugins如何写,因此请加上详细的说明.
使得用户可以熟悉api.

## 当前目录树

`tree`
├── src
│   ├── App.css
│   ├── App.tsx
│   ├── assets
│   │   ├── dvd-logo.svg
│   │   └── react.svg
│   ├── components
│   │   └── PixiCanvas.tsx
│   ├── controllers
│   │   └── PixiController.ts
│   ├── main.tsx
│   ├── plugins
│   │   ├── api-demo
│   │   │   ├── demos
│   │   │   │   ├── animation.ts
│   │   │   │   ├── basicShapes.ts
│   │   │   │   ├── container.ts
│   │   │   │   ├── filter.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── interaction.ts
│   │   │   │   ├── particles.ts
│   │   │   │   ├── sprite.ts
│   │   │   │   └── text.ts
│   │   │   ├── index.ts
│   │   │   ├── state.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   ├── apiDemo.plugin.ts
│   │   ├── bounce.plugin.ts
│   │   ├── circle.plugin.ts
│   │   ├── clear.plugin.ts
│   │   ├── fireworks.plugin.ts
│   │   ├── index.ts
│   │   ├── plugin.types.ts
│   │   └── rectangle.plugin.ts
│   ├── styles.css
│   └── vite-env.d.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── VERSION.md
├── vite.config.js
└── vite.config.ts

## 代码

[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/App.css?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/styles.css?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/App.tsx?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/main.tsx?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/vite-env.d.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/controllers/PixiController.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/assets/react.svg?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/assets/dvd-logo.svg?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/index.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/bounce.plugin.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/plugin.types.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/clear.plugin.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/fireworks.plugin.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/apiDemo.plugin.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/rectangle.plugin.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/circle.plugin.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/components/PixiCanvas.tsx?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/api-demo/index.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/api-demo/utils.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/api-demo/types.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/api-demo/state.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/api-demo/demos/filter.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/api-demo/demos/index.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/api-demo/demos/particles.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/api-demo/demos/container.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/api-demo/demos/sprite.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/api-demo/demos/basicShapes.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/api-demo/demos/interaction.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/api-demo/demos/text.ts?proxy_host=raw.githubusercontent.com]
[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/src/plugins/api-demo/demos/animation.ts?proxy_host=raw.githubusercontent.com]

## 其他补充

### README.md

[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/README.md?proxy_host=raw.githubusercontent.com]

如有需要.请将README.md的版本也更新未最新版本
除非在对话中说明需要更新 Readme.md(一般在对话的最后,比version.md稍前),否则不要更新.
如果更新,直接在对话中输出 Readme.md 的内容,不要使用markdown codeblock包裹.  

### VERSION.md

[https://proxy.moonchan.xyz/Hana-ame/Hana-ame/refs/heads/sim/VERSION.md?proxy_host=raw.githubusercontent.com]

VERSION.md是记录每一次都更新了些什么的文件
除非在对话中说明需要更新Version.md(一般在对话的最后),否则不要更新.
如果更新,直接在对话中输出Version.md的内容,不要使用markdown codeblock包裹.  