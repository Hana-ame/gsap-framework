# Avd — Visual Novel Dialogue Component

`src/components/Avd.ts` 的对应文档。

---

## 职责

视觉小说风格的对话框 / 立绘 / 文字演出组件。一个 `Avd` 实例管理：

- **对话框**（背景圆角矩形 + 边框 + Speaker 名字 + 文字区 + Continue 箭头）
- **立绘槽**（左 / 中 / 右 三个槽位，立绘变更时自动淡入淡出）
- **文字演出**（typewriter 逐字揭示 + 整段 alpha 淡入）
- **文字 / 图片混排**（`text` 可以是 `string` 或 `[str, img, str]` 段列表，自动排版换行）
- **入场动画**（首行对话时对话框从下方 80px 滑入，ease-out cubic）
- **Continue 提示**（reveal 完成后右下角小箭头 1Hz alpha 脉冲）

API 是**纯 PIXI 类**——没有 React 依赖、没有 DOM overlay。所有动画用 `PIXI.Ticker` 驱动。

---

## 组件拆分

Avd 拆成 4 个文件，**职责单一**：

| 文件 | 类 / 导出 | 职责 |
|---|---|---|
| `Avd.ts` | `class Avd` | 编排器：状态机（typing / between / done）、ticker 回调、生命周期、点击 advance 逻辑 |
| `AvdDialogueBox.ts` | `class DialogueBox` | 对话框渲染：背景圆角矩形、Speaker 名字 tag、对话内容容器、Continue 箭头 |
| `AvdPortraitLayer.ts` | `class PortraitLayer` | 立绘层：三槽位（left/center/right）、自动换 texture、淡入淡出 |
| `AvdInlineLayout.ts` | `function buildInlineLayout / updateInlineLayout / destroyInlineLayout` | 纯函数：把 `[str, img, str]` 段列表布局成多行 Container；每帧按 `revealedChars` 推进可见性 |

**`Avd` 不直接画 box / portrait / text**——只编排这三个子组件。state machine 在 `Avd._tick` 里驱动：

```ts
_tick:
  if boxEnterActive:  → DialogueBox.setBoxOffsetY(...)
  if textFading:      → DialogueBox.setAlpha(...)
  if state == typing: → updateInlineLayout(...)  或  dialogueText.text = slice(...)
  if state == between:→ DialogueBox.redrawArrow(state, phase)
  PortraitLayer.update(now)
  redraw clickOverlay
```

DialogueBox 内部维护 `boxBg Graphics / nameText / dialogueContainer / arrow` 四个对象。PortraitLayer 内部维护三个 `PortraitSlot`。InlineLayout 是无状态纯函数（每次 line enter 重建 layout）。

---

## 快速使用

```ts
import { Avd, type AvdLine, type AvdTextSegment } from '../../components/Avd';
import * as PIXI from 'pixi.js';

const moonTex = renderer.generateTexture(makeMoonIcon());

const avd = new Avd(proxy.stage, screenW, screenH, region.ticker, {
  typewriterSpeed: 40,
  textFadeMs: 250,
  onComplete: () => console.log('all lines done'),
});

const inlineWithMoon: AvdTextSegment[] = [
  { kind: 'text', text: 'Alice 抬头，看见了 ' },
  { kind: 'image', texture: moonTex, width: 32, height: 32 },
  { kind: 'text', text: ' 这轮明月。' },
];

avd.setScript([
  { speaker: 'Alice', text: '你好，世界！' },
  { speaker: 'Alice', text: inlineWithMoon, portrait: aliceTex, portraitPos: 'left' },
  { speaker: 'Bob',   text: 'Hello, world.' },
]);
```

调用 `.next()` 推进（typing 时跳到行尾 / between 时进入下一行 / done 时 noop）。demo 用屏幕 click overlay 自动绑定 `next`。

---

## API

### `new Avd(parent, screenW, screenH, ticker, options)`

| 参数 | 类型 | 说明 |
|---|---|---|
| `parent` | `PIXI.Container` | 父容器，组件把 `this.container` addChild 到此 |
| `screenW` / `screenH` | `number` | 屏幕尺寸（用于 click overlay + portrait 槽位） |
| `ticker` | `PIXI.Ticker` | 调用方提供（一般从 `SubCanvas.ticker` 取） |
| `options` | `AvdOptions` | 见下 |

### `AvdText` 与 `AvdTextSegment`

```ts
type AvdText = string | AvdTextSegment[];

type AvdTextSegment =
  | { kind: 'text'; text: string }
  | { kind: 'image'; texture: PIXI.Texture; width?: number; height?: number };
```

- `string`：走 `PIXI.Text` + `wordWrap` 自动换行（PIXI 内置）
- `AvdTextSegment[]`：走 `AvdInlineLayout`，每段可能是 `text` 或 `image`，**自动排版换行**

### `AvdLine`

```ts
interface AvdLine {
  speaker?: string;
  text: AvdText;
  portrait?: PIXI.Texture | null;
  portraitPos?: AvdPortraitPos;
}
```

### `AvdOptions`（全部可选）

| key | default | 说明 |
|---|---|---|
| `boxWidth` | `920` | 对话框宽 |
| `boxHeight` | `200` | 对话框高 |
| `boxX` | `(W - 920) / 2` | 对话框 X |
| `boxY` | `H - 200 - 40` | 对话框 Y |
| `boxBg` | `0x0a0a1e` | 背景色 |
| `boxBgAlpha` | `0.92` | 背景透明度 |
| `boxRadius` | `12` | 圆角 |
| `boxPadding` | `24` | 内边距 |
| `textColor` | `0xffffff` | 文字色 |
| `textSize` | `24` | 字号 |
| `fontFamily` | `'sans-serif'` | 字体族（可填 `'Noto Sans SC', sans-serif` 等） |
| `typewriterSpeed` | `30` | 初始 typewriter 速度（chars/sec） |
| `textFadeMs` | `200` | 整段 alpha 淡入时长 |
| `nameColor` | `0x88ccff` | speaker 名颜色 |
| `nameSize` | `22` | speaker 名字号 |
| `portraitMaxH` | `min(560, H*0.7)` | 立绘最大高度 |
| `portraitY` | `H - portraitMaxH - 20` | 立绘底边 Y |
| `portraitFadeMs` | `300` | 立绘淡入淡出时长 |
| `arrowColor` | `0x88ccff` | Continue 箭头颜色 |
| `boxEnterMs` | `400` | 对话框入场动画时长 |
| `boxEnterOffsetY` | `80` | 入场起始 Y 偏移 |
| `onLineEnter` | `(line, index) => void` | 行开始时触发 |
| `onLineExit` | `(line, index) => void` | 行退出时触发 |
| `onComplete` | `() => void` | 全部行播放完触发 |
| `onStateChange` | `(state) => void` | state 变化时触发 |

### 实例方法

| 方法 | 说明 |
|---|---|
| `setScript(lines)` | 替换整个剧本，从第 0 行开始 |
| `next()` | 推进：typing 跳到行尾 / between 进入下一行 / done 啥也不做 |
| `setTypewriterSpeed(charsPerSec)` | 实时调整 typewriter 速度 |
| `goTo(index)` | 跳到指定行 |
| `getState()` | 返回 `'typing' \| 'between' \| 'done'` |
| `getLineIndex()` / `getLineCount()` | 当前行 / 总行数 |
| `applyOptions(partial)` | 实时修改 options（已实现的字段：boxBg / boxBgAlpha / textColor / nameColor / arrowColor / portraitY） |
| `destroy()` | 卸载组件 |

---

## 关键设计

### 状态机

```
typing ──[click]──> between ──[click]──> typing (next line) ──[click]──> ... ──> done
   │                    │
   │  typewriter        │  arrow pulse
   │  revealing          │
```

- `typing`：ticker 推进 `revealedChars`；reveal 完自动转 `between` 并触发 `onStateChange`
- `between`：箭头 1Hz 脉冲（`sin(2πt)` 调 alpha 0.7-1.0）；click 进下一行
- `done`：click overlay `eventMode = 'none'`，什么都不做

### 文字淡入 vs 字符揭示

- **淡入**：`DialogueBox.setAlpha(0 → 1 over textFadeMs)`（200ms）—— 在 typewriter 揭示前先"出现"对话框
- **揭示**：每帧 `text = chars.slice(0, n)` —— 字符依次出现
- 二者**并行**：fade alpha 0→1 同时，typewriter 从 char 0 开始。reveal 走完时 fade 也走完

### 自动排版（inline layout）

`text: AvdTextSegment[]` 走 `buildInlineLayout`：

1. **Tokenize**：把每个 text 段拆成"断点"（whitespace 边界、CJK 字符边界）
2. **Measure**：每个 token 创建 `PIXI.Text` 测宽
3. **Flow**：把 token 按行累加，超过 `maxWidth` 时换行；image 段按指定宽高占位
4. **Position**：每行 `rowMaxHeight` = 最高 item 高；item 垂直居中 `y = rowY + (rowMaxHeight - itemHeight) / 2`

Typewriter 推进（每字符 1 unit，图片 0 unit 但 position 等于图片前的 text 长度）：

```ts
updateInlineLayout(layout, revealedChars):
  for each item:
    if text: visible = (revealedChars > startUnit); text.text = slice(localRevealed)
    if image: visible = (revealedChars >= startUnit)
```

**限制**：CJK 字符断点是按字符，CJK 词不能整体换行（其实 CJK 没有词的概念）。Latin 词在断点间换行：单词太长会被拆开（greedy fill）。如要 word-aware wrap，需要在 `computeBreakPoints` 里加 word-boundary 检测。

### CJK 字体

`fontFamily: 'sans-serif'` 默认。在装了 Noto Sans CJK / 思源黑体的系统上正常显示。

**生产建议**：在 `index.html` 预加载 CJK webfont：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet">
```

然后 `fontFamily: "'Noto Sans SC', 'Source Han Sans', sans-serif"`。

### 立绘槽位与淡入淡出

三个槽位（left / center / right），X 位置 = `(slotW * (0.5 | 1.5 | 2.5))`（三分屏）。PortraitLayer 内部：

```ts
setPortrait(targetPos, texture):
  for each pos in [left, center, right]:
    if pos === targetPos:  _showSlot(pos, slot, texture)  // 新建 / 换 texture / 淡入
    else:                  _fadeOutSlot(slot)              // 当前位置淡出
```

- 同位置换 texture → 立即换 `sprite.texture`，alpha 0 → 1
- 同位置传 null → alpha 1 → 0，`sprite.visible = false`
- 其它位置有 sprite 且 alpha > 0 → 淡出到 0

`anchor.set(0.5, 1)`：以脚底为中心锚定，立绘 Y 坐标 = 脚底位置，X 居中。

### Click overlay（自动推进）

Avd 内部建一个全屏 invisible 透明矩形（alpha 0.001），`eventMode = 'static'` + `pointerdown → next()`。

`done` 状态时 `eventMode = 'none'`，避免误触。

**注意层级**：如果用户在同一层叠放 control panel，panel 必须**后 addChild**才能盖在 overlay 上面（PIXI 后绘制 = 更上 z 序），或 panel 自己用更高的 zIndex。Avd 的 overlay 是 `this.container` 内的最后 addChild。

### 入场动画

只在 `lineIndex === 0`（首行）触发一次：
- 起始 `DialogueBox.setBoxOffsetY(80)`
- ticker 每帧 `eased = 1 - (1-t)³`，`y = offsetY * (1-eased)`
- `t >= 1` 关闭，y 归零

后续行直接 y=0（**不**每次都滑入，避免吵闹）。

### 子组件之间的耦合

- **DialogueBox ↔ Avd**：Avd 调用 `setSpeaker` / `setAlpha` / `setBoxOffsetY` / `redrawArrow` / `applyOptions` / `getDialogueContainer`。DialogueBox 不知道 Avd 存在。
- **PortraitLayer ↔ Avd**：Avd 调用 `setPortrait(targetPos, texture)` / `update(now)` / `applyOptions`。PortraitLayer 不知道 Avd 存在。
- **InlineLayout ↔ Avd**：Avd 调用 `buildInlineLayout(segments, opts)` → `{ container, items, totalUnits }`；`_enterLine` 把 `container` addChild 到 `dialogueContainer`；`_tick` 调 `updateInlineLayout(items, revealedChars)`。InlineLayout 是无状态函数。
- **Avd 持有**：state machine、`ticker` 订阅、`clickOverlay` 渲染。

这样 `AvdDialogueBox` 和 `AvdPortraitLayer` 可以独立测试或换实现；`AvdInlineLayout` 是纯函数，易于单测。

---

## 已知约束

- **CJK 字体依赖系统**：未预加载 webfont 时，无 CJK 的 Linux/Android 浏览器会显示 tofu（□）。Demo 推荐加 `Noto Sans SC` Google Font。
- **多行 wordWrap（string mode）**：`wordWrapWidth = boxWidth - padding*2`，超长行自动换行。但**行高是固定的**（`textSize * 1.4`），大量换行会挤出 name 区域。
- **Inline 自动排版是 greedy fill**：Latin 单词太长会按字符拆开换行。word-aware wrap 待实现。
- **Image 段不会按行高缩放**：image 的 height 由 `imageWidth/Height` 决定（无 size 时用 texture 原始尺寸）。如果 image 比 lineHeight 高，整行被拉高。
- **Click overlay 与其他交互冲突**：如果同时有 button / 自定义交互层，那些层必须**后 addChild 到更高 z 序**，否则会被 overlay 拦截。
- **destroy 必须调**——否则 ticker callback 不会 unregister。
- **surrogate pair 处理**：`Array.from(text)` 正确处理 emoji 和 CJK 扩展。typewriter speed 按"字符 unit"计算，不做视觉宽度归一化。
- **`applyOptions` 字段支持有限**：当前实现只对 `boxBg / boxBgAlpha / textColor / nameColor / arrowColor / portraitY` 做了热更新。`textSize / fontFamily / boxX / boxY` 等不会热更新到当前 line（要等下次 enter line 才生效）。

---

## 性能特征

- **Typewriter 文字更新（string mode）**：每帧 `text = chars.slice(0, n).join('')`，PIXI v8 Text 内部 dirty → 重绘 canvas。
- **Typewriter 更新（inline mode）**：每帧只更新 cursor 范围内的 item 的 `text.text`（N 个 text 项），不是整段重绘。
- **3 个 portrait slot 复用**：所有位置共用同一组 sprite 实例。换 texture 不创建新对象。
- **Ticker 单一 callback**：Avd 注册一个 `_tick` 处理所有动画。
- **Inline layout 每行 enter 重建**：在 `_enterLine` 时一次性 `buildInlineLayout`（创建 N 个 Text/Sprite + 测量 + 定位）；后续 `updateInlineLayout` 只改 `.text` / `.visible`。
- **总对象数**：1 DialogueBox（4 children）+ 3 PortraitLayer sprite + 0~N inline items + 1 clickOverlay Graphics = 8~108+ display objects（取决于 line 长度）。

---

## 扩展方向

- **`autoPlay` 模式**：每行 reveal 完后等 N 秒自动 next（`nextDelay` 选项）
- **Skip mode**：按住 skip 按钮时立即把所有 `between` 状态跳到下一行（fast-forward）
- **Backlog / 回看**：缓存所有 reveal 完的行，up 键打开
- **Voice / SE / BGM**：`AvdLine.voice?: Sound, bgs?: Sound, se?: Sound` —— 配合 `PIXI.Assets` 加载 audio
- **Background layer**：`AvdLine.background?: Texture` —— 全屏背景图淡入淡出
- **Animation hooks**：`onLineEnter` 返回 `Promise` / `Tween`，等待外部动画结束再 reveal
- **Save / Load**：state machine + revealed chars 序列化到 JSON
- **Event bus 集成**：emit `'avd:line' { index, speaker, text }` 给其他组件订阅
- **Word-aware wrap**：在 `computeBreakPoints` 加 word-boundary 检测，避免拆 Latin 单词
- **Inline 段富文本**：在 `AvdTextSegment` 加 `bold` / `italic` / `color` / `size` 字段，每个 text 段独立 style
