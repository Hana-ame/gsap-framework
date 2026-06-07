# AvdScript — JSON 脚本解析器

`src/components/AvdScript.ts` 的对应文档。

---

## 职责

把 `AvdScriptJSON` 解析成 `{ lines: AvdLine[], roster: AvdRoster, meta, rosterMode }`——`Avd` 直接消费。**资源加载策略由调用方决定**（local / fetch / Assets.load / 程序生成）。

---

## 快速使用

```ts
import { parseAvdScriptJSON, Avd } from '../../components';
import * as PIXI from 'pixi.js';

const json: AvdScriptJSON = {
  meta: { width: 1024, height: 720, boxWidth: 880, fontFamily: 'Noto Sans SC, sans-serif' },
  roster: {
    Alice: { pos: 'left',  textureKey: 'alice' },
    Bob:   { pos: 'right', textureKey: 'bob'   },
  },
  lines: [
    { speaker: 'Narrator', text: '...' },
    { speaker: 'Alice',    text: '你好！' },
    { speaker: 'Bob',      text: 'Hi!' },
  ],
};

const parsed = await parseAvdScriptJSON(json, {
  loadTexture: async (key) => {
    return await PIXI.Assets.load({ alias: key, src: `/assets/${key}.png` });
  },
});

avd.applyOptions(parsed.meta);
avd.setRoster(parsed.roster);
if (parsed.rosterMode) avd.setRosterMode(parsed.rosterMode);
avd.setScript(parsed.lines);
```

---

## API

### `parseAvdScriptJSON(json, resolver): Promise<AvdParsedScript>`

| 参数 | 类型 | 说明 |
|---|---|---|
| `json` | `AvdScriptJSON` | 见下文格式 |
| `resolver` | `AvdAssetResolver` | 资源加载策略 |

**返回**：`Promise<{ lines, roster, meta, rosterMode }>`

**实现流程**：
1. 遍历 `roster` + `lines.portraitKey` + `lines.text[].textureKey` 收集所有 `textureKey`（去重）
2. `Promise.all` 并行加载所有图（用 `resolver.loadTexture(key)`）
3. 把 `textureKey` 替换成 `PIXI.Texture`，构造 `AvdLine[]` 和 `AvdRoster`
4. 返回

### `AvdScriptJSON` 格式

```ts
interface AvdScriptJSON {
  meta?: AvdMetaJSON;
  roster?: Record<string, AvdRosterEntryJSON>;
  lines: AvdLineJSON[];
}
```

### `AvdMetaJSON`

`AvdOptions` 的**部分覆盖**。**不传的字段**用 Avd 默认值（窄屏检测也生效）。详见 [Avd.md](./Avd.md#mobile-adaptation单-app-同时支持桌面--手机) 的 meta 字段说明。

| key | 类型 | 说明 |
|---|---|---|
| `width` / `height` | `number` | 窗口尺寸（Avd 内部目前不用——画布已定——但你可以读它做 layout） |
| `boxWidth` / `boxHeight` / `boxX` / `boxY` | `number` | 对话框位置/尺寸 |
| `textSize` / `nameSize` | `number` | 字号 |
| `portraitMaxH` / `portraitY` | `number` | 立绘位置/尺寸 |
| `typewriterSpeed` | `number` | 打字速度 |
| `textFadeMs` / `portraitFadeMs` / `boxEnterMs` | `number` | 动画时长 |
| `fontFamily` | `string` | 字体族（例：`'Noto Sans SC, sans-serif'`） |
| `rosterMode` | `'speaker-only' \| 'persistent'` | roster 模式 |

### `AvdRosterEntryJSON`

```ts
interface AvdRosterEntryJSON {
  pos: 'left' | 'center' | 'right';
  textureKey: string;
  textureWidth?: number;
  textureHeight?: number;
}
```

`textureWidth/Height` 暂未使用（保留字段；未来想支持 override 默认尺寸时启用）。

### `AvdLineJSON`

```ts
interface AvdLineJSON {
  speaker?: string;
  text: string | AvdTextSegmentJSON[];
  portraitKey?: string;       // 动态立绘（覆盖 roster）
  portraitPos?: 'left' | 'center' | 'right';
}
```

### `AvdTextSegmentJSON`

```ts
type AvdTextSegmentJSON =
  | { kind: 'text'; text: string }
  | { kind: 'image'; textureKey: string; width?: number; height?: number };
```

### `AvdAssetResolver`

```ts
interface AvdAssetResolver {
  loadTexture(key: string): Promise<PIXI.Texture>;
}
```

**实现示例 1：PIXI.Assets**

```ts
const resolver: AvdAssetResolver = {
  loadTexture: async (key) => {
    return await PIXI.Assets.load(key);
  },
};
```

**实现示例 2：fetch + Blob**

```ts
const cache = new Map<string, PIXI.Texture>();
const resolver: AvdAssetResolver = {
  loadTexture: async (key) => {
    if (cache.has(key)) return cache.get(key)!;
    const blob = await fetch(`/img/${key}.png`).then(r => r.blob());
    const bmp = await createImageBitmap(blob);
    const tex = PIXI.Texture.from(bmp);
    cache.set(key, tex);
    return tex;
  },
};
```

**实现示例 3：程序生成（无外部资源）**

```ts
const resolver: AvdAssetResolver = {
  loadTexture: async (key) => {
    if (key === 'alice') return renderer.generateTexture(makeAliceAvatar());
    if (key === 'bob')   return renderer.generateTexture(makeBobAvatar());
    throw new Error(`unknown texture key: ${key}`);
  },
};
```

---

## 完整 JSON 例子

```json
{
  "meta": {
    "width": 1024,
    "height": 720,
    "boxWidth": 880,
    "boxHeight": 220,
    "textSize": 22,
    "fontFamily": "Noto Sans SC, sans-serif",
    "typewriterSpeed": 35,
    "rosterMode": "persistent"
  },
  "roster": {
    "Alice":  { "pos": "left",   "textureKey": "alice" },
    "Bob":    { "pos": "right",  "textureKey": "bob"   },
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

    { "speaker": "Bob",   "text": "你好。" },
    { "speaker": "Carol", "text": "你们好。" }
  ]
}
```

---

## 已知约束

- **`textureWidth/Height` 暂未实现**：保留字段，等需求
- **同步 vs 异步**：`parseAvdScriptJSON` 是 `async`（要等资源加载）。如果你所有 texture 都已经预加载，传一个同步的 resolver 然后 `Promise.resolve()` 包一下即可
- **错误处理**：单个 `loadTexture` 抛错会 reject 整个 Promise。**不**做 fallback 资源。**不**做 progress 回调（要进度条自己包）
- **跨章切换**：换章前 `avd.setRoster({})` 清空，再 `setRoster(newRoster)`，否则旧 roster 角色还占着槽位
- **JSON 体积**：每张图 = 1 行（key 引用）。`meta` 整段重复没问题。脚本本身是纯数据，可 gzip

---

## 性能

- 资源加载用 `Promise.all` 并行——N 张图 ≈ 1 张图的加载时间（取决于带宽/网络并发限制）
- 解析本身 O(N) 遍历，N = lines + roster + segments
- 返回的 `lines` 已经是 `AvdLine[]`，可直接 `avd.setScript()`，**不需要**二次解析

---

## 扩展方向

- **进度回调**：`parseAvdScriptJSON(json, resolver, onProgress)` —— `onProgress(loaded, total)`
- **资源预声明**：`json.assets: { [key]: TextureSource }` —— 显式预加载清单
- **Schema 校验**：用 zod / valibot 校验 JSON 结构（脚本编辑时早报错）
- **Asset cache 层**：跨章复用同一组角色图，避免重复加载
- **JSON Schema 编辑器**：可视化编辑 roster / lines（拖拽位置、添加行）
- **Script diff**：版本控制友好——纯数据无副作用
