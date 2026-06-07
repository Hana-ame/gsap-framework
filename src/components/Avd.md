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

## 写 Script

一个 script 就是 `AvdLine[]`。每行是 `speaker` + `text` + 可选 `portrait` + 可选 `portraitPos`。

### 基础

```ts
avd.setScript([
  { speaker: 'Narrator', text: '深夜的实验室里，只有服务器的嗡嗡声。' },
  { speaker: 'Alice',    text: '终于编译通过了！' },
  { speaker: 'Bob',      text: '不对，那是平面几何。这里是相对论。' },
]);
```

- `speaker` 可省略 → 没有名字 tag，对话框不显示 speaker
- `text` 缺省视为空字符串（一般没意义）
- 7 行内联渲染示例见 demo（`src/example/component-avd/ComponentAvdDisplay.tsx`）

### 行内图片（`text: AvdTextSegment[]`）

字符串只支持纯文本。要在文字中间插图（表情、图标、道具），用段列表：

```ts
const moonTex = renderer.generateTexture(makeMoonIcon());

avd.setScript([
  {
    speaker: 'Alice',
    text: [
      { kind: 'text', text: 'Alice 抬头，看见了 ' },
      { kind: 'image', texture: moonTex, width: 32, height: 32 },
      { kind: 'text', text: ' 这轮明月。' },
    ],
  },
]);
```

- `{ kind: 'image', texture, width?, height? }`：`width/height` 不传则用 texture 原尺寸
- 图片段占位 = `width`，高度 = `height`（或 texture 原高）；layout 自动换行
- `revealedChars` 推进到 image 段时整图瞬间显示（不逐像素）；text 段继续逐字

### 长文本（自动换行）

长 CJK 文本直接进 `text` 就行——PIXI `wordWrap: true` 自动换行：

```ts
avd.setScript([
  { speaker: 'Alice', text: '文字支持自动排版。如果一行放不下，' +
                            'Avd 会自动换行。每个字符、每张图片都会算进自动排版的逻辑里。' },
]);
```

如果混排多种字号 / 颜色 / 富文本，**用 `AvdTextSegment[]`** 而不是 hack wordWrap。

### 立绘（portrait）

每行可独立指定立绘和位置：

```ts
avd.setScript([
  { speaker: 'Alice', text: '...', portrait: aliceTex, portraitPos: 'left' },
  { speaker: 'Bob',   text: '...', portrait: bobTex,   portraitPos: 'right' },
  { speaker: 'Narrator', text: '旁白时无立绘' },
  { speaker: 'Alice', text: '不指定 portraitPos 则继承上一行（或 roster 默认）' },
]);
```

- `portrait: null` 显式清除立绘（fade out 当前）
- `portraitPos: 'left' | 'center' | 'right'`（省略时**通过 roster 自动解析**，见下）
- 立绘换行时**同位置换 texture** → 立即换（alpha 0→1 淡入）；**其它位置 fade out**

### Roster（自动立绘排位）

如果你有一组固定角色（Alice / Bob / Carol），用 `setRoster` 注册他们的默认立绘位置，script 就不用每行都写 `portraitPos`：

```ts
avd.setRoster({
  Alice: { pos: 'left',   texture: aliceTex },
  Bob:   { pos: 'right',  texture: bobTex },
  Carol: { pos: 'center', texture: carolTex },
});

avd.setScript([
  // Alice 出现在 left，Bob 在 right，Carol 在 center——同时存在
  { speaker: 'Alice', text: '三人都在场。' },
  { speaker: 'Bob',   text: '我们仨。' },
  // speaker 切换：上一说话者淡出，新说话者在自己默认位置淡入
  { speaker: 'Carol', text: '同意。' },
]);
```

**优先级**：
1. line 显式 `portrait: Texture` + `portraitPos: 'left'|'center'|'right'`（覆盖一切）
2. line 显式 `portrait: Texture` + 省略 `portraitPos` → 用 roster[speaker].pos（roster 必须有此人）
3. roster[speaker] 存在 → 用 roster 的 texture + pos
4. 都没有 → 该行无立绘（fade out 当前）

roster 的 texture 是**默认底图**（角色不在对话中时也常驻显示？还是只在说话时显示？见下）

**`roster 持续可见模式`**：roster 里的角色**始终保持可见**（alpha=1 或根据说话状态淡入/淡出）。说话者淡入到 1.0，非说话者降到 0.4（示例值）。这是经典 VN 三人场景的常见做法。

**`roster 仅说话时可见模式`**：roster 里的角色**只在说话时**淡入到 1.0，其余隐藏。这是单 speaker 风格的现代 VN 做法。

切换模式用 `setRosterMode(mode)`。默认 `'speaker-only'`。

### 完整 script 模板

```ts
avd.setScript([
  // 1) 旁白
  { speaker: 'Narrator', text: '...背景描述...' },

  // 2) Alice 立绘出现在左
  { speaker: 'Alice', text: '你好！', portrait: aliceTex, portraitPos: 'left' },

  // 3) Alice 继续说话，inline 图片
  { speaker: 'Alice', text: [
    { kind: 'text', text: '看，那边有' },
    { kind: 'image', texture: birdTex, width: 28, height: 28 },
    { kind: 'text', text: '。' },
  ]},

  // 4) Bob 出现在右
  { speaker: 'Bob', text: '你看到了什么？', portrait: bobTex, portraitPos: 'right' },

  // 5) 长文本自动换行
  { speaker: 'Alice', text: '文字支持自动排版。如果一行放不下，Avd 会自动换行。' },

  // 6) 旁白（无立绘）
  { speaker: 'Narrator', text: '—— 沉默 ——' },
]);
```

---

## 加载 Script

script 本身是纯数据。**怎么加载由调用方决定**——Avd 不关心你从哪里拿数据。

### 方式 1：硬编码（demo / 小项目）

```ts
import { Avd, type AvdLine } from '../../components/Avd';

const SCRIPT: AvdLine[] = [
  { speaker: 'Alice', text: '...', portrait: aliceTex, portraitPos: 'left' },
  // ...
];

avd.setScript(SCRIPT);
```

### 方式 2：从 JSON 加载（推荐：数据/代码分离）

见下文 [JSON Script + Roster](#json-script--roster)。`parseAvdScriptJSON(json, assetResolver)` 一行解析：meta（窗口/主题）+ roster（角色列表 + texture）+ lines（对话）。

### 方式 3：从 API 加载（动态内容 / 后端驱动）

```ts
async function loadScript(url: string): Promise<AvdLine[]> {
  const res = await fetch(url);
  const json = await res.json();
  return parseAvdScriptJSON(json, {
    loadTexture: async (key) => {
      const tex = await PIXI.Assets.load(key);
      return tex;
    },
  });
}

loadScript('/api/story/chapter1.json').then((lines) => {
  avd.setScript(lines);
});
```

### 方式 4：热替换（运行时换章）

```ts
async function loadChapter(n: number) {
  const lines = await loadScript(`/api/chapter${n}.json`);
  avd.setScript(lines);  // setScript 重置 lineIndex=0, fade 重启
}
```

**注意**：`setScript` 不会清空 roster。如果切换章节需要换角色，**先 `setRoster({})` 清空再 `setRoster(newRoster)`**。

### 方式 5：流式追加（边播边加载）

```ts
avd.setScript(initialLines);
const sock = new WebSocket('/api/script-stream');
sock.onmessage = (e) => {
  const line = JSON.parse(e.data);
  // push to internal buffer（需要 Avd 暴露 appendLine API；当前未实现）
  // avd.appendLine(line);
};
```

**当前限制**：`setScript` 是一次性设置，不支持 `appendLine`。流式追加要先 push 到本地数组，再 `setScript([...])` 重建。代价是每条新行触发淡入动画——一般可接受。

### 错误处理

```ts
try {
  const lines = await loadScript(url);
  avd.setScript(lines);
} catch (e) {
  // 把 script 加载失败展示给用户
  avd.setScript([
    { speaker: 'System', text: `加载失败: ${(e as Error).message}` },
  ]);
}
```

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

### Mobile adaptation（单 app 同时支持桌面 + 手机）

Avd 构造函数检测窄屏（`screenW < 720`），自动调小所有默认尺寸。**目标**：同一个 Avd 实例、同一份 `AvdLine[]` 数据，桌面和手机浏览器都能正确显示——不需要做"两个 webapp"。

窄屏（`screenW < 720`）触发：

| 字段 | 桌面默认 | 窄屏默认 | 计算 |
|---|---|---|---|
| `boxWidth` | `920` | `W - 24` | 留 12px 边距 |
| `boxHeight` | `200` | `min(180, H * 0.26)` | 不超过屏高 1/4 |
| `boxX` | `(W - 920) / 2` | `12` | 居左 |
| `boxY` | `H - 200 - 40` | `H - boxHeight - 16` | 距底 16 |
| `boxPadding` | `24` | `14` | 内容紧凑 |
| `boxRadius` | `12` | `10` | 圆角小 |
| `textSize` | `24` | `clamp(15, 20, (W - 48) / 26)` | 按宽度缩字号 |
| `nameSize` | `22` | `clamp(14, 18, (W - 48) / 30)` | 同上 |
| `portraitMaxH` | `min(560, H * 0.7)` | `min(380, H * 0.5)` | 立绘留更多对话区 |
| `portraitY` | `H - portraitMaxH - 20` | `H - portraitMaxH - 8` | 距底更近 |

**仍然可被用户 options 覆盖**——`...options` 在窄屏默认之后展开，所以调用方传 `boxWidth: 600` 还是能用窄屏默认的其它字段。

**touch 输入**：PIXI v8 `pointerdown` 自动覆盖 mouse + touch + pen，**不需要改代码**。`clickOverlay`（`eventMode='static'`）在手机 tap 时同样触发 `_onAdvanceClick`。

**已知手机布局注意点**：
- 字体最小 15px（iOS Safari 12pt 等价）—— 太小看不清
- `portraitMaxH` 收到 380px——桌面 avatar 280 渲染会顶到 portrait 顶部，可以把 `AVATAR_SIZE` 调小（如 200）或在 `buildAssets` 里加 narrow 分支
- Demo 控件（theme 按钮 / stepper / restart / skip）在 < 480px 屏上会水平溢出。**主交互还是 click-to-advance**，控件只是 demo helper。生产 app 应该在窄屏下隐藏/折叠部分控件

**为什么不拆两个 webapp**：脚本数据（`AvdLine[]`）和组件代码（`Avd.ts`）都已经和数据本身解耦——只要构造时给正确的 `screenW/screenH`，同一个实例就能自适应。手机/桌面共用同一份 Avd 仓库、同一份脚本，不用为脚本同步操心。

---

## JSON Script + Roster

让剧本**完全数据化**——把整章 VN 写成一个 JSON 文件，让 JSON 控制窗口尺寸、主题、立绘排位、对话。

### JSON 格式

```ts
interface AvdScriptJSON {
  meta?: AvdMetaJSON;
  roster?: Record<string, AvdRosterEntryJSON>;
  lines: AvdLineJSON[];
}

interface AvdMetaJSON {
  width?: number;          // 窗口宽（override canvas size）
  height?: number;         // 窗口高
  boxWidth?: number;       // 对话框宽
  boxHeight?: number;      // 对话框高
  boxX?: number;           // 对话框 X
  boxY?: number;           // 对话框 Y
  textSize?: number;       // 字号
  nameSize?: number;       // 名字字号
  portraitMaxH?: number;   // 立绘最大高
  portraitY?: number;      // 立绘底边 Y
  typewriterSpeed?: number;
  textFadeMs?: number;
  portraitFadeMs?: number;
  boxEnterMs?: number;
  fontFamily?: string;
}

interface AvdRosterEntryJSON {
  pos: 'left' | 'center' | 'right';
  textureKey: string;      // 资源 key（PIXI.Assets 加载用）
  textureWidth?: number;   // 可选：覆盖 render 时宽度
  textureHeight?: number;
}

interface AvdLineJSON {
  speaker?: string;
  text: string | AvdTextSegmentJSON[];
  portraitKey?: string;    // 覆盖 roster（动态立绘）
  portraitPos?: 'left' | 'center' | 'right';
}

type AvdTextSegmentJSON =
  | { kind: 'text'; text: string }
  | { kind: 'image'; textureKey: string; width?: number; height?: number };
```

### 完整示例

```json
{
  "meta": {
    "width": 1024,
    "height": 720,
    "boxWidth": 880,
    "textSize": 22,
    "fontFamily": "Noto Sans SC, sans-serif"
  },
  "roster": {
    "Alice":  { "pos": "left",   "textureKey": "alice" },
    "Bob":    { "pos": "right",  "textureKey": "bob" },
    "Carol":  { "pos": "center", "textureKey": "carol" }
  },
  "lines": [
    { "speaker": "Narrator", "text": "实验室里很安静。" },
    {
      "speaker": "Alice",
      "text": [
        { "kind": "text",  "text": "Alice 抬头看见了 " },
        { "kind": "image", "textureKey": "moon", "width": 32, "height": 32 },
        { "kind": "text",  "text": "。" }
      ]
    },
    { "speaker": "Bob",   "text": "你好。" }
  ]
}
```

### 解析

`parseAvdScriptJSON` 工具函数把 JSON 解析成 `AvdLine[]` + `Roster` + `Meta`：

```ts
import { parseAvdScriptJSON } from '../../components/AvdScript';

const json = await fetch('/chapters/1.json').then(r => r.json());

const { lines, roster, meta } = await parseAvdScriptJSON(json, {
  loadTexture: async (key) => {
    return await PIXI.Assets.load(key);  // 你的加载策略
  },
});

// 1) 应用 meta 到 Avd options
avd.applyOptions(meta);

// 2) 设置 roster（先 setRoster 注入 texture + pos）
avd.setRoster(roster);  // roster 现在是 { name: { pos, texture } }

// 3) 设置剧本
avd.setScript(lines);
```

### `parseAvdScriptJSON` 详解

| 步骤 | 做什么 |
|---|---|
| 1. 收集所有 `textureKey` | 从 roster + lines.portraitKey + lines.text[].textureKey 去重 |
| 2. 批量加载 | `assetResolver.loadTexture(key)` 异步拉所有图（用 `Promise.all`） |
| 3. 解析 lines | 每行替换 `textureKey` → `PIXI.Texture`（保留 inline image 段） |
| 4. 解析 roster | 每条 `{ pos, texture }` |
| 5. 返回 | `{ lines: AvdLine[], roster: Record<name, {pos, texture}>, meta: AvdOptions }` |

**resource 解析器**可以替换：本地 `PIXI.Assets.load`、远程 `fetch → blob → Texture.from`、程序生成的 `renderer.generateTexture(avatar)`。Avd 不管。

### Meta 字段优先级

`meta` 字段是**部分覆盖** AvdOptions，**不传** = 用 Avd 默认值。这让你可以：

```json
// 桌面 16:9
{ "meta": { "width": 1920, "height": 1080 } }

// 竖屏手机
{ "meta": { "width": 375, "height": 812, "boxWidth": 360, "textSize": 18 } }
```

同一个 Avd 实例可以播放不同 meta 的 JSON——layout 自动适配。**前提**：`applyOptions` 支持的字段才能热更新；未支持的（如 `boxX`）要 destroy + 重建。

---

## 实现细节（调用栈 / 内部流程）

每个公开方法的内部做了什么——按调用顺序展开。

### `new Avd(parent, W, H, ticker, options)` — 构造函数

```
1. 合并 options 进 this.opts（窄屏检测自动覆盖默认）
2. this.typewriterSpeed = max(1, opts.typewriterSpeed)
3. this.container = new Container() → parent.addChild(this.container)
4. this.portraitLayer = new PortraitLayer(this.container, { W, portraitY, portraitMaxH, portraitFadeMs })
5. this.dialogueBox   = new DialogueBox(this.container, { boxX, boxY, boxWidth, boxHeight, ... })
6. this.dialogueText  = new PIXI.Text({ wordWrap, wordWrapWidth=boxW-pad*2, lineHeight=textSize*1.4 })
                        → dialogueBox.getDialogueContainer().addChild(this.dialogueText)
7. this.clickOverlay  = new Graphics()  // 全屏透明矩形
                        → this.container.addChild(this.clickOverlay)
                        → eventMode='static', cursor='pointer'
                        → on('pointerdown', _onAdvanceClick)
8. this.ticker.add(this._tick, this)
9. state = 'typing', lineIndex = 0, revealedChars = 0
```

注意：构造函数**不**自动 `setScript`。`setScript` 是单独的方法。

### `setScript(lines)` — 加载剧本

```
this.lines = lines
this.lineIndex = 0
this.portraitLayer.setPortrait(null, null)  // 清空当前立绘
this._enterLine(0)
```

### `_enterLine(index)` — 进入一行（核心）

```
const line = this.lines[index]
this.opts.onLineEnter?.(line, index)         // 1) 通知外部
this.revealedChars = 0

this.dialogueBox.setSpeaker(line.speaker ?? null)  // 2) 更新名字 tag

// 3) 重建文字布局
if (this.inlineLayout) {
  destroyInlineLayout(this.inlineLayout)
  this.inlineLayout = null
}
if (typeof line.text === 'string') {
  this.inlineMode = false
  this.fullText = line.text
  this.totalUnits = line.text.length
  this.dialogueText.visible = true
  this.dialogueText.text = ''
} else {
  this.inlineMode = true
  this.fullText = ''
  this.totalUnits = 0
  this.dialogueText.visible = false
  this.inlineLayout = buildInlineLayout(line.text, { maxWidth: boxW - pad*2, lineHeight, fontSize, fontFamily, fill })
  this.dialogueBox.getDialogueContainer().addChild(this.inlineLayout.container)
  this.totalUnits = this.inlineLayout.totalUnits
}

// 4) 立绘（roster 解析 + 换 texture）
const resolvedPos = line.portraitPos ?? (line.speaker && this.roster[line.speaker]?.pos) ?? null
const resolvedTex = line.portrait ?? (line.speaker && this.roster[line.speaker]?.texture) ?? null
this.portraitLayer.setPortrait(resolvedPos, resolvedTex)

// 5) 文字整段淡入
this.textFadeStart = now; this.textFadeFrom = 0; this.textFadeTo = 1
this.textFading = true; this.dialogueBox.setAlpha(0)

// 6) 首次进入：box 入场动画
if (index === 0) {
  this.dialogueBox.setBoxOffsetY(opts.boxEnterOffsetY)  // 80
  this.boxEnterStart = now
  this.boxEnterActive = true
} else {
  this.dialogueBox.setBoxOffsetY(0)
  this.boxEnterActive = false
}

this._setState('typing')
```

### `_tick(ticker)` — 每帧调用

```
const dt = ticker.deltaMS
const now = performance.now()

// A. Box 入场动画
if (this.boxEnterActive) {
  const t = min(1, (now - this.boxEnterStart) / opts.boxEnterMs)
  const eased = 1 - (1 - t)^3                          // ease-out cubic
  this.dialogueBox.setBoxOffsetY(opts.boxEnterOffsetY * (1 - eased))
  if (t >= 1) { this.dialogueBox.setBoxOffsetY(0); this.boxEnterActive = false }
}

// B. 文字整段淡入
if (this.textFading) {
  const t = min(1, (now - this.textFadeStart) / opts.textFadeMs)
  this.dialogueBox.setAlpha(textFadeFrom + (textFadeTo - textFadeFrom) * t)
  if (t >= 1) this.textFading = false
}

// C. Typewriter 揭示（typing 状态）
if (this.state === 'typing' && revealedChars < totalUnits) {
  revealedChars = min(totalUnits, revealedChars + (typewriterSpeed * dt) / 1000)
  if (this.inlineMode) {
    updateInlineLayout(this.inlineLayout, revealedChars)
  } else {
    this.dialogueText.text = Array.from(this.fullText).slice(0, floor(revealedChars)).join('')
  }
  if (revealedChars >= totalUnits) {
    this._setState('between')  // 自动转 between
    this.arrowPhase = 0
  }
}

// D. Continue 箭头脉冲（between 状态）
if (this.state === 'between') {
  this.arrowPhase += (dt / 1000) * 2 * PI            // 1Hz
  this.dialogueBox.redrawArrow(this.state, this.arrowPhase)
}

// E. 立绘淡入/淡出（每帧 lerp）
this.portraitLayer.update(now)

// F. 重新画 click overlay（根据 state 决定是否接受事件）
this._redrawClickOverlay()
```

### `_onAdvanceClick()` — 用户点屏幕

```
if (this.state === 'done') return                          // 已结束，忽略

if (this.state === 'typing') {
  this._completeTypewriter()                              // 直接跳到行尾
  return
}

if (this.state === 'between') {
  const cur = this.lines[this.lineIndex]
  this.opts.onLineExit?.(cur, this.lineIndex)              // 通知
  this.lineIndex++
  if (this.lineIndex >= this.lines.length) {
    this._setState('done')
    this.opts.onComplete?.()                              // 全部播完
    return
  }
  this._enterLine(this.lineIndex)                         // 进下一行
}
```

### `_redrawClickOverlay()` — 每帧重画透明点击层

```
this.clickOverlay.clear()
if (this.state === 'done') {
  this.clickOverlay.eventMode = 'none'                     // 关闭点击
  return
}
this.clickOverlay.eventMode = 'static'
this.clickOverlay.rect(0, 0, W, H).fill({ color: 0x000000, alpha: 0.001 })  // 透明矩形
```

`alpha 0.001` 看不到但 hit-test 能命中。比 `alpha 0` + `visible true` 稳。

### `applyOptions(partial)` — 实时更新 options

```
1. 备份旧值（boxBg / boxBgAlpha / textColor / nameColor / portraitY）
2. this.opts = { ...this.opts, ...partial }
3. 委托给子组件：
   dialogueBox.applyOptions({ boxBg, boxBgAlpha, textColor, nameColor, arrowColor })
   portraitLayer.applyOptions({ portraitY })  // 仅当 portraitY 改变
4. textColor 改变时，dialogueText.style.fill 同步更新
5. boxBg / boxBgAlpha 改变时，dialogueBox.redrawBox()
6. nameColor 改变时，dialogueBox.applyOptions({ nameColor })
```

**未热更新的字段**（如 `textSize` / `fontFamily` / `boxX` / `boxY`）：要等下次 `_enterLine` 才生效（重建 dialogueText 才会读 opts.textSize）。**为什么**：这些字段是构造时确定的，dialogueText 已经创建好了，**重新设置要重建**——不值得每帧重 text。设置后调 `avd.goTo(avd.getLineIndex())` 强制 rebuild 当前行。

### `destroy()` — 卸载

```
this.ticker.remove(this._tick, this)           // 1) 摘 ticker（关键，否则下一帧崩）
this.container.destroy({ children: true })     // 2) 销毁整棵 scene graph（含 clickOverlay + portraitLayer + dialogueBox）
```

**顺序很重要**：必须先 `ticker.remove`，否则下一帧 `_tick` 跑时 container 已 destroyed，访问 `container.alpha` 抛 null。

---

## 设置界面（Settings UI）

Avd 自身没有"设置 UI"——它只暴露 `applyOptions` / `setTypewriterSpeed` / `setRoster` / `setRosterMode`。**设置 UI 是调用方的事**。

### 设置项全景

| 类别 | 字段 | 实时更新？ | 怎么改 |
|---|---|---|---|
| **主题色** | `boxBg` / `boxBgAlpha` / `textColor` / `nameColor` / `arrowColor` | ✅ | `applyOptions({ boxBg: 0x1a1a2a })` |
| **尺寸** | `boxWidth` / `boxHeight` / `boxX` / `boxY` / `portraitMaxH` / `portraitY` | 部分 | `boxWidth/boxHeight/boxX/boxY/portraitMaxH` 要重建；`portraitY` 实时 |
| **字号** | `textSize` / `nameSize` | ❌（下次 enter line 生效） | 调后 `avd.goTo(avd.getLineIndex())` 强制 rebuild |
| **字体** | `fontFamily` | ❌（同上） | 同上 |
| **速度** | `typewriterSpeed` | ✅ | `avd.setTypewriterSpeed(60)` |
| **角色排位** | roster / rosterMode | ✅ | `avd.setRoster({...})` / `avd.setRosterMode('persistent')` |
| **剧本** | lines | ✅ | `avd.setScript(newLines)` |
| **进度** | lineIndex | ✅ | `avd.goTo(idx)` / `avd.next()` |

### React 设置面板范式

```tsx
import { useState, useRef, useEffect } from 'react';
import type { Avd } from '../../components/Avd';

const THEMES = {
  dark:  { boxBg: 0x0a0a1e, textColor: 0xffffff, nameColor: 0x88ccff },
  light: { boxBg: 0xf4f4ee, textColor: 0x1a1a1a, nameColor: 0x3a5a8a },
  sepia: { boxBg: 0x3a2a1a, textColor: 0xf4e4c8, nameColor: 0xe8a868 },
};

function SettingsPanel({ avd }: { avd: Avd }) {
  const [theme, setTheme] = useState<keyof typeof THEMES>('dark');
  const [speed, setSpeed] = useState(30);

  useEffect(() => {
    avd?.applyOptions(THEMES[theme]);                // 主题实时生效
  }, [theme, avd]);

  useEffect(() => {
    avd?.setTypewriterSpeed(speed);                   // 速度实时生效
  }, [speed, avd]);

  return (
    <div className="settings">
      <select value={theme} onChange={e => setTheme(e.target.value)}>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
        <option value="sepia">Sepia</option>
      </select>
      <label>
        Speed: {speed} cps
        <input type="range" min={1} max={100} value={speed} onChange={e => setSpeed(+e.target.value)} />
      </label>
    </div>
  );
}
```

**核心模式**：
- React state 持有"设置"
- `useEffect([setting])` 把"设置"同步到 PIXI 引用
- **不**用 useState 持有 PIXI 引用（用 useRef + 一次性 useEffect `[]` 拿 Avd 实例）
- 不让 React 重渲触发 Avd 重建

### 持久化（localStorage）

```ts
const SETTINGS_KEY = 'avd-settings';

function loadSettings(): Settings {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
  } catch { return {}; }
}

function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// 组件初始化
const [settings, setSettings] = useState(loadSettings);
useEffect(() => saveSettings(settings), [settings]);
```

### 设置面板布局建议

- **顶部固定栏**（demo 风格）：Theme 选择 + Speed 滑块 + Restart / Skip 按钮
- **侧边抽屉**（生产风格）：滑出显示更细设置（字号、box 位置、字体、auto-play）
- **Modal 弹窗**（modal 风格）：点 ⚙ 按钮弹出 full settings

生产 app 推荐 **侧边抽屉**——不打断阅读。

### Auto-play（实现示例）

```ts
class AvdAutoPlay {
  private avd: Avd;
  private delayMs: number;
  private timer: number | null = null;

  constructor(avd: Avd, delayMs = 1500) {
    this.avd = avd;
    this.delayMs = delayMs;
    avd.onStateChange = (s) => {
      if (s === 'between') {
        this.timer = window.setTimeout(() => this.avd.next(), this.delayMs);
      } else {
        if (this.timer) { clearTimeout(this.timer); this.timer = null; }
      }
    };
  }
}
```

**注意**：`onStateChange` 在 `Avd` 上是 single function（不是事件订阅）。如果你有多个订阅需求，自己用 EventBus（`framework/EventBus`）包装。

### Skip mode（实现示例）

```ts
class AvdSkip {
  private avd: Avd;
  private pressing = false;

  constructor(avd: Avd, button: PIXI.Container) {
    this.avd = avd;
    button.eventMode = 'static';
    button.on('pointerdown', () => { this.pressing = true; this.tick(); });
    button.on('pointerup',   () => { this.pressing = false; });
    button.on('pointerupoutside', () => { this.pressing = false; });
  }

  private tick() {
    if (!this.pressing) return;
    if (this.avd.getState() === 'between') this.avd.next();
    requestAnimationFrame(() => this.tick());
  }
}
```

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

已实现（见上文）：
- ✅ Roster（自动立绘排位）
- ✅ JSON Script（meta + roster + lines）
- ✅ Settings UI 范式（applyOptions 实时更新）
- ✅ Mobile adaptation
- ✅ Auto-play / Skip mode（实现示例见 "设置界面"）

未实现：
- **Backlog / 回看**：缓存所有 reveal 完的行，up 键打开
- **Voice / SE / BGM**：`AvdLine.voice?: Sound, bgs?: Sound, se?: Sound` —— 配合 `PIXI.Assets` 加载 audio
- **Background layer**：`AvdLine.background?: Texture` —— 全屏背景图淡入淡出
- **Animation hooks**：`onLineEnter` 返回 `Promise` / `Tween`，等待外部动画结束再 reveal
- **Save / Load**：state machine + revealed chars 序列化到 JSON
- **Event bus 集成**：emit `'avd:line' { index, speaker, text }` 给其他组件订阅（当前用 onStateChange 单一回调）
- **Word-aware wrap**：在 `computeBreakPoints` 加 word-boundary 检测，避免拆 Latin 单词
- **Inline 段富文本**：在 `AvdTextSegment` 加 `bold` / `italic` / `color` / `size` 字段，每个 text 段独立 style
