# AVD — 视觉小说引擎

## 写一个 H-scene 剧本

4 步，4 个文件：

### Step 1 — 剧本 `src/example/h-scenes/XxxScript.ts`

```typescript
import type { AvdLineJSON } from '../../components';

export const XXX_LINES: AvdLineJSON[] = [
  // 对白：speaker=角色名，bgKey=背景图，text=台词
  { speaker: '伊露', bgKey: 'HA1-1', text: '听说胸部会变得敏感来着…' },

  // 叙述：speaker=''（空字符串 = 无名显示，无名字条）
  { speaker: '', bgKey: 'HA1-2', text: '伊露敞开衣服，直接抚摸乳头。' },

  // 选择肢
  { speaker: '伊露', bgKey: 'T3-14', text: '该怎么做呢…',
    choices: [
      { text: '接受项圈', targetSegment: 'accept' },
      { text: '拒绝',     targetSegment: 'reject' },
    ] },

  // 选择肢目标行：用 segment 匹配
  { speaker: '', segment: 'accept', bgKey: 'T3-15', text: '她戴上了项圈。' },

  // 终了行：end: true
  { speaker: '', text: '— 终 —', end: true },
];
```

### Step 2 — 显示组件 `src/example/component-avd-xxx-dom/ComponentAvdXxxDomDisplay.tsx`

```typescript
import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { XXX_LINES } from '../h-scenes/XxxScript';

export function ComponentAvdXxxDomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = elRef.current; if (!el) return;
    const cleanup = mountDomScene({ el, lines: XXX_LINES });
    return () => { cleanup.then(fn => fn()); };
  }, []);
  return <div ref={elRef} style={{ position:'fixed', inset:0, background:'#000', overflow:'hidden' }} />;
}
```

### Step 3 — 注册路由 `src/example/examples.ts`

```typescript
// (a) import 组件
import { ComponentAvdXxxDomDisplay } from './component-avd-xxx-dom/ComponentAvdXxxDomDisplay';

// (b) 加路由名到 EXAMPLES 数组
'component-avd-xxx-dom',

// (c) 加到 exampleMap
'component-avd-xxx-dom': ComponentAvdXxxDomDisplay,
```

### Step 4 — 添加到启动器 `src/example/launcher/LauncherDisplay.tsx`

```typescript
{ route: 'component-avd-xxx-dom', label: 'AVD DOM: XXX', hint: '说明', glyph: '\u2665', accent: '#4a8a5a' },
```

---

## bgKey 规则

- bgKey 放在 **CG 切换后的第一句台词**上
- ExMoonchan 源使用 `mountDomScene({ imageMap })` 自动查 URL
- 本地文件放 `public/game-cgs/`，无需 imageMap
- 后缀 `^` 表示同 CG 的不同变体（如 `HA1-3^`）

---

## AvdLineJSON 字段参考

| 字段 | 类型 | 说明 |
|------|------|------|
| `speaker` | `string` | 角色名。`''` = 叙述（无名字条），省略同 `''` |
| `text` | `string` | 台词，支持 `\n` 换行 |
| `bgKey` | `string` | CG 图片 key |
| `bgmKey` | `string` | BGM key |
| `sfxKey` | `string` | 音效 key |
| `voiceKey` | `string` | 语音 key |
| `portraitKey` | `string` | 立绘 key |
| `portraitPos` | `'left' \| 'center' \| 'right'` | 立绘位置 |
| `expression` | `string` | 表情 key（配合 roster） |
| `choices` | `AvdChoiceJSON[]` | 选择肢 |
| `segment` | `string` | 行标签，choice 的 targetSegment 跳转目标 |
| `effect` | `'shake' \| 'flash'` | 画面特效 |
| `end` | `boolean` | `true` = 剧本结束 |

---

## 现有剧本参考

全部 19 个 H-scene 剧本在 `src/example/h-scenes/` 下，直接抄一个改最快：

| 文件 | 说明 |
|------|------|
| `HA1Script.ts` | 旅馆自慰(通常服) |
| `HA2Script.ts` | 旅馆自慰 |
| `HA3Script.ts` | 旅馆自慰 |
| `HBStartScript.ts` | 忠诚自慰开始 |
| `HB1Script.ts` | 忠诚自慰(通常服) |
| `HB2Script.ts` | 忠诚自慰 |
| `T21Script.ts` | 西区胸揉(通常服) |
| `T22Script.ts` | 西区胸揉(色情服) |
| `T22InranScript.ts` | 西区胸揉(淫乱) |
| `HC1Script.ts` | 西区窥视(色情服) |
| `HC3Script.ts` | 西区乳交口交 |
| `T3Script.ts` | 胸揉 + 金项圈奴隶契约（含选择肢示例） |
| `HD1Script.ts` | 城2F 欧派斯基回想(口交) |
| `HD2Script.ts` | 城2F 欧派斯基回想(正常位) |
| `HD3Script.ts` | 城2F 欧派斯基回想(骑乘位) |
| `HE1Script.ts` | 洗脑结局 |
| `HE2Script.ts` | 欧派斯基败北结局 |
| `HF1Script.ts` | 欧派斯基的奴隶结局 |
| `HG1Script.ts` | 居民结局 |
