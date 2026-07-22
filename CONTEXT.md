# 游戏安装路径

```
C:\Users\lumin\Downloads\otomi-games.com_1N3M2UKO\堎悽奅桬幰
```

## 剧本位置

- `data/CommonEvents.json` — 通用事件脚本（包含 H-scene 事件）
- `data/Map001.json` — 地图事件（包含回想房间）

## 事件对照

| 事件ID | 名称 | 对应脚本 | 说明 |
|--------|------|---------|------|
| 25 | HA1自慰1 | HA1Script.ts | 旅馆自慰(通常服) |
| 26 | HA2自慰2 | HA2Script.ts | 旅馆自慰 |
| 27 | HA3自慰3 | HA3Script.ts | 旅馆自慰 |
| 33 | HB开始 | HBStartScript.ts | 忠诚自慰开始 |
| 34 | HB1忠诚自慰1 | HB1Script.ts | 忠诚自慰(通常服) |
| 35 | HB2忠诚自慰2 | HB2Script.ts | 忠诚自慰 |
| 39 | T21胸揉 | T21Script.ts | 西区胸揉(通常服) |
| 40 | T22胸揉 | T22Script.ts | 西区胸揉(色情服) |
| 41 | T22胸揉(淫乱) | T22InranScript.ts | 西区胸揉(色情服/淫乱) |
| 42 | HC1/HC2窥视1 | HC1Script.ts | 西区窥视(色情服) |
| 44 | HC3贫乳手交 | HC3Script.ts | 西区乳交口交 |
| 54 | T3性骚扰 | T3Script.ts | 胸揉 + 金项圈奴隶契约（z_*/m_* 立绘） |
| 55 | HD1贫乳手交 | HD1Script.ts | 城2F 欧派斯基回想(口交/女仆服) |
| 56 | HD2正常位 | HD2Script.ts | 城2F 欧派斯基回想(正常位/女仆服) |
| 57 | HD3骑乘位 | HD3Script.ts | 城2F 欧派斯基回想(骑乘位/女仆服) |
| 60 | HE1洗脑 | HE1Script.ts | 洗脑结局 |
| 61 | HE2骑乘位 | HE2Script.ts | 欧派斯基败北结局 |
| 63 | HF1正常位 | HF1Script.ts | 欧派斯基的奴隶结局 |
| 65 | HG1乱交 | HG1Script.ts | 居民结局 |

## display 组件（纯 DOM 版）

全部 40 个场景（`component-avd-*` 与 `component-avd-*-dom`）均使用 DOM 渲染，
`component-avd-*` 原为 Pixi 版，已于 2024-07-23 迁移至纯 DOM（ExMoonchan 图片源）。

共用 `domSceneHelper.ts` 引导，当传入 `imageMap` 参数时使用 `IMAGE_MAP`（ExMoonchan）查找 URL，
否则使用 `/game-cgs/` 本地文件。

| 路由 | 脚本 |
|------|------|
| component-avd-ha1-dom | HA1Script |
| component-avd-ha2-dom | HA2Script |
| component-avd-ha3-dom | HA3Script |
| component-avd-hbstart-dom | HBStartScript |
| component-avd-hb1-dom | HB1Script |
| component-avd-hb2-dom | HB2Script |
| component-avd-t21-dom | T21Script |
| component-avd-t22-dom | T22Script |
| component-avd-t22inran-dom | T22InranScript |
| component-avd-hc1-dom | HC1Script |
| component-avd-hc3-dom | HC3Script |
| component-avd-t3-dom | T3Script |
| component-avd-hd1-dom | HD1Script |
| component-avd-hd2-dom | HD2Script |
| component-avd-hd3-dom | HD3Script |
| component-avd-he1-dom | HE1Script |
| component-avd-he2-dom | HE2Script |
| component-avd-hf1-dom | HF1Script |
| component-avd-hg1-dom | HG1Script |
| component-avd-t1-dom | T1Script |

## CG 文件位置

`img/pictures/` — 图片文件（RPG Maker MV 加密格式，后缀 `_`）

加密方式：RPGMV header + XOR with System.json encryptionKey

解密后导出至 `public/game-cgs/` 为 PNG。

## 加密密钥

`System.json → encryptionKey: d41d8cd98f00b204e9800998ecf8427e`

使用 binary 形式（16 bytes）与文件数据（跳过前 16 byte RPGMV header）逐字节 XOR。

## bgKey 规则

从 CommonEvents.json 转换剧本时，`bgKey` 放在 Show Picture (code 231) 之后的第一句台词上：
- 游戏在对话框切换间隙调用 `Show Picture` 改图
- `speaker=""` 的行使用 `speaker: ''`（无名显示）
- 终了行也使用无名显示

## 已确认问题

### 问题 1：CG 缩放用 cover 导致截断（已修正）

所有 step-hd2 组件和 BackgroundLayer 使用 `Math.max`（cover 模式）缩放 CG，导致画面超出屏幕被裁剪。
修正：改为 `Math.min`（fit 模式），完整显示 CG 并保留比例，上下留黑边。

涉及文件：
- `src/avd/BackgroundLayer.ts:85` — `_fitSprite()` 内 `Math.max` → `Math.min`
- `src/avd/dom/DomBackgroundLayer.ts:85` — 同上
- `src/example/step-hd2-01-sprite/StepHd201SpriteDisplay.tsx:35`
- `src/example/step-hd2-02-subcanvas/StepHd202SubcanvasDisplay.tsx:35`

### 问题 2：CG 与台词搭配错误（已修正）

HD2Script.ts 最初有多余的 Narrator 行且 bgKey 位置不对。已重新对照 CommonEvents.json event 56 转换。
同时修正所有其他脚本的 bgKey 时间位置，确保与原始事件完全一致。

### 问题 3：缺少 display 组件和 launcher 条目（已修正）

T21、T22、T22淫乱、T3 原先缺少 display 组件和 launcher 条目。已全部添加。

### 问题 4：CG 切换使用 GSAP fade 过渡（已修正）

`BackgroundLayer.ts` / `DomBackgroundLayer.ts` 中 CG 切换时使用 GSAP fade 动画（非空切换），导致画面黑一下再显示新图。
修正：非空切换直接 `alpha = 1`，仅保留从空到有的 fade-in。

### 问题 5：对话框每行都从 alpha=0 淡入（已修正）

`AvdController.ts:_loadLine()` 中每行都 `setAlpha(0)` + GSAP fade-in。
修正：仅第 0 行（对话框首次出现）执行 fade-in，后续连续对话保持 alpha=1。

## 已移植事件（共19个，全部汉化）

| 事件ID | 名称 | 脚本 | 路由 |
|--------|------|------|------|
| 25 | HA1自慰1 | HA1Script.ts | component-avd-ha1 |
| 26 | HA2自慰2 | HA2Script.ts | component-avd-ha2 |
| 27 | HA3自慰3 | HA3Script.ts | component-avd-ha3 |
| 33 | HB开始 | HBStartScript.ts | component-avd-hbstart |
| 34 | HB1忠诚自慰1 | HB1Script.ts | component-avd-hb1 |
| 35 | HB2忠诚自慰2 | HB2Script.ts | component-avd-hb2 |
| 39 | T21胸揉 | T21Script.ts | component-avd-t21 |
| 40 | T22胸揉 | T22Script.ts | component-avd-t22 |
| 41 | T22胸揉(淫乱) | T22InranScript.ts | component-avd-t22inran |
| 42 | HC1/HC2窥视1 | HC1Script.ts | component-avd-hc1 |
| 44 | HC3贫乳手交 | HC3Script.ts | component-avd-hc3 |
| 54 | T3性骚扰 | T3Script.ts | component-avd-t3 |
| 55 | HD1贫乳手交 | HD1Script.ts | component-avd-hd1 |
| 56 | HD2正常位 | HD2Script.ts | component-avd-hd2 |
| 57 | HD3骑乘位 | HD3Script.ts | component-avd-hd3 |
| 60 | HE1洗脑 | HE1Script.ts | component-avd-he1 |
| 61 | HE2骑乘位 | HE2Script.ts | component-avd-he2 |
| 63 | HF1正常位 | HF1Script.ts | component-avd-hf1 |
| 65 | HG1乱交 | HG1Script.ts | component-avd-hg1 |

### 问题 6：ExMoonchan 无 CORS 头，Pixi 版全部迁移至 DOM（已修正）

所有 `component-avd-*`（原 Pixi 版）使用 `imageMap.ts`（sda1.dev CDN，支持 CORS），
但 ExMoonchan 图片源（`ex.moonchan.xyz`）不发送 `Access-Control-Allow-Origin` 头，
导致 PixiJS `texImage2D` 拒绝跨域纹理。

修正：全部 20 个组件重写为 DOM 模式 `mountDomScene({ imageMap: IMAGE_MAP })`，
使用 `imageMapEx.ts` 的 ExMoonchan URL + `DomTexture` 懒加载。

涉及文件：
- `src/example/component-avd-*/*Display.tsx` — 20 个组件全部替换为 DOM 实现
- `src/example/h-scenes/domSceneHelper.ts` — 新增 `imageMap` 参数支持

## AVD 框架研究

详见上传文档：https://r2.moonchan.xyz/1784747022/d527d834

框架核心设计：
- **双引擎**：PixiJS (Canvas/WebGL) + 纯 DOM，通过 `IRenderLayer` 接口抽象
- **状态机**：`DialogueStateMachine` 管理行推进 (typing → between → choice → done)
- **渲染管道**：`AvdController._loadLine()` 处理 bg/bgm/sfx/voice/portrait/typing 流水线
- **CG 懒加载**：`setBgLazyLoad()` 回调机制，`_loadLine()` 遇到新 bgKey 时触发
- **脚本分离**：`AvdLineJSON`（字符串 key）→ `parseScript(resolver)` → `AvdLine[]`（已解析纹理）
- **GSAP 通用动效**：两组后端使用相同属性名（alpha, x, y, scale），GSAP 跨模式兼容
- **DOM 节点系统**：`DomNode.ts` 将 Pixi 风格 API 映射到 CSS transform/opacity

## 迁移文档

`docs/exmoonchan-migration.md` — ExMoonchan H-scene 纯 DOM 迁移范式
