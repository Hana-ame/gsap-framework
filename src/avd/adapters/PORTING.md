# AVD 移植适配器参考

将 **RPG Maker MZ (RMMZ)** 和 **Ren'Py (Pygame)** 内容移植到 AVD 框架的技术方案。

## 总体思路

AVD 剧本 = `AvdLineJSON[]`（平坦数组，含 `segment` 标记支持分支跳转）。
源格式（RMMZ 事件命令 / Ren'Py .rpy）均需翻译为这种格式。

```
源格式          →  翻译层               →  AVD 格式
RMMZ Map.json      rmmz-adapter.ts        AvdLineJSON[]
Ren'Py .rpy        renpy-adapter.ts       AvdLineJSON[]
```

## 数据映射总表

| AVD 字段         | RMMZ 来源                        | Ren'Py 来源               |
| ---------------- | -------------------------------- | ------------------------- |
| `speaker`        | 101.faceName → mapper           | say 语句的标识符 → mapper |
| `text`           | 101/401.parameters[0]           | say 语句内容              |
| `portraitKey`    | 101.faceName + faceIndex        | show 语句图片名           |
| `expression`     | 101.faceIndex（脸图格子索引）    | show 语句的表情修饰词     |
| `bgKey`          | 231.ShowPicture.name            | scene 语句图片名          |
| `bgmKey`         | 241.PlayBgm.name                | (无，需外部注入)          |
| `sfxKey`         | 250.PlaySe.name                 | (无，需外部注入)          |
| `voiceKey`       | (RMMZ 无原生语音，需插件)       | (无)                      |
| `choices[]`      | 102 + 402-404 分支              | menu: 块                  |
| `segment`        | 118.Label                       | label:                    |
| `end`            | 353.GameOver / 脚本结束         | return                    |
| `conditionFlag`  | 111.ConditionalBranch + 121.Switch | (需手动映射)           |

## RMMZ 适配器 (`rmmz-adapter.ts`)

### 命令行式事件 → 平坦式剧本

RMMZ 事件命令是**树枝结构**（通过 `indent` 字段表示嵌套），AVD 需要**平坦分段结构**。

翻译步骤：

1. **Label 预扫描** — 遍历所有命令，收集 `code 118` 的标签名 → 生成 `rmmz_label_${name}` 的 segment 名称
2. **对话折叠** — 遇到 `code 101` 后，吞噬后续所有 `code 401` 续行，合并为一行文本
3. **选项折叠** — 遇到 `code 102` 后，收集 indent 更高的 `402/403` 子命令块，从中提取 jump/label 作为 targetSegment
4. **条件分支** — `code 111` 的条件验证可映射为 `conditionFlag`；分支内的内容需要手动展开为分叉 segment
5. **背景/音频** — `code 231/241/250` 为"挂起状态"，附着到下一个文本行的对应字段

### 典型使用流程

```typescript
import { rmmzCommandsToAvdLines, rmmzMergeEventScripts } from './rmmz-adapter';

// 1. 加载 RMMZ 数据
const mapData = await fetch('./data/Map001.json').then(r => r.json());
const systemData = await fetch('./data/System.json').then(r => r.json());
const actorsData = await fetch('./data/Actors.json').then(r => r.json());

// 2. 配置适配器
const actorNames: Record<number, string> = {};
for (const actor of actorsData) actorNames[actor.id] = actor.name;

// 3. 提取对话事件（示例：遍历事件页，只取 page 1）
const scripts: AvdLineJSON[][] = [];
for (const ev of Object.values(mapData.events)) {
  const page = ev.pages[0];
  if (!page) continue;
  const lines = rmmzCommandsToAvdLines(page.list, {
    actorNames,
    faceToSpeaker: { 'Actor1': 'Hero' },
    switchFlags: { 1: 'flag_door_open' },
    bgMap: { 'castle': 'bg_castle', 'forest': 'bg_forest' },
  });
  if (lines.length) scripts.push(lines);
}

// 4. 合并
const fullScript = rmmzMergeEventScripts(scripts, Object.keys(mapData.events).map(id => mapData.events[id].name));
```

### 控制字符处理

| RMMZ 控制字符 | AVD 处理方式               |
| ------------- | -------------------------- |
| `\V[n]`      | resolveVariable(id) → 内联 |
| `\N[n]`      | resolveActorName(id) → 内联 |
| `\C[n]`      | 暂忽略（可扩展为颜色样式） |
| `\I[n]`      | 暂忽略（可扩展为 inline 图片） |
| `\.` `\|` `!` `>` `<` `^` | 全部忽略（AVD 用 typewriterSpeed 控制速度） |

### 条件分支的策略

RMMZ 的 `code 111`（条件分支）支持 13 种条件类型。适配器使用两种策略：

1. **开关条件**（type=0, switchId） → 映射为 `conditionFlag`，AVD 在显示 choices 时自动过滤
2. **复杂条件**（变量/物品/队伍等） → 在适配器配置中注册 custom handler，手动压缩为分叉 segment

## Ren'Py 适配器 (`renpy-adapter.ts`)

### 脚本式 → 平坦式剧本

Ren'Py 是**缩进敏感的脚本语法**，使用空格/制表符表示嵌套。

翻译步骤：

1. **行分类** — 按缩进和关键字分为 label/say/scene/show/hide/jump/call/menu/return 等
2. **Label 预扫描** — 收集所有 `label:` 名称 → 生成 `renpy_${name}` 的 segment 名称
3. **say 语句** — `"speaker" "text"` 或 `"text"` → AvdLine
4. **menu 块** — 收集 indent 更高的 `"choice":` 子项，提取 jump/call 作为 targetSegment
5. **scene/show/hide** — 作为"挂起状态"附着到下一行

### 典型使用流程

```typescript
import { parseRenPyScript } from './renpy-adapter';

// 1. 加载 .rpy 文件内容
const rpyContent = await fetch('./game/script.rpy').then(r => r.text());

// 2. 解析
const lines = parseRenPyScript(rpyContent, {
  characterMap: { 'e': 'Eileen', 'l': 'Lucia', 'n': 'Narrator' },
  imageMap: { 'bg castle': 'bg_castle', 'eileen happy': 'portrait_eileen' },
});
```

### 不支持的语法及替代方案

| Ren'Py 语法           | 原因               | 替代方案                               |
| --------------------- | ------------------ | -------------------------------------- |
| `if/elif/else`        | AVD 无运行时条件   | 手动展开为分叉 segment                 |
| `while/for`           | 无等价物           | 手动展开                               |
| `python:` 块          | 无法翻译           | 手动编写等效 AVD 逻辑                  |
| `$` 单行 Python       | 无法翻译           | 同上                                   |
| `transform` / ATL     | 无等价物           | 用 AVD ScreenEffects / ParticleSystem 模拟 |
| `call`（带参数）      | AVD 无调用栈       | 展开为 segment 跳转（等价于 jump）     |
| `image` 声明          | 需资源管理         | 在 Assets.load 中预加载即可            |

### Ren'Py 到 AVD 的 image 命名约定

Ren'Py 的 image 声明（`image bg castle = "castle.jpg"`）需要转换为 AVD 的 textureKey。

适配器通过 `imageMap` 和 `bgPrefix`/`portraitPrefix` 配置来控制映射：

- `scene bg castle` → bgKey: `${bgPrefix}castle` → `bg_castle`
- `show eileen happy` → portraitKey: `${portraitPrefix}eileen` → `portrait_eileen`

## 测试方式

```bash
# 运行 AVD 现有测试（通过后可补充适配器测试）
npx vitest run src/avd/ --reporter verbose
```

适配器是纯函数（输入数据 → 输出 AvdLineJSON[]），可直接编写单元测试：

```typescript
// 示例：RMMZ adapter test
const rmmzInput = [
  { code: 118, indent: 0, parameters: ['start'] },
  { code: 101, indent: 0, parameters: ['Actor1', 0, 0, 1] },
  { code: 401, indent: 0, parameters: ['Hello, \\N[1]!'] },
  { code: 102, indent: 0, parameters: [['Yes', 'No'], 0, 0] },
  { code: 402, indent: 1, parameters: [0] },
  { code: 119, indent: 2, parameters: ['yes_end'] },
  { code: 402, indent: 1, parameters: [1] },
  { code: 119, indent: 2, parameters: ['no_end'] },
  { code: 404, indent: 0, parameters: [] },
];

const result = rmmzCommandsToAvdLines(rmmzInput, { actorNames: { 1: 'Hero' } });
// → 验证 segment, speaker, text, choices 字段正确
```

## 已知局限

1. **条件分支的 flatten** — RMMZ 和 Ren'Py 都允许复杂的嵌套条件，AVD 的 `conditionFlag` 仅支持选项级别的简单过滤。复杂的条件逻辑需要在移植时手动展开为独立 segment。
2. **动画 / 转场** — RMMZ 的 MovePicture / Ren'Py 的 ATL transform 无法映射到 AVD，需用 ScreenEffects 或 ParticleSystem 手动模拟。
3. **变量系统** — RMMZ 有完整的变量/开关系统，AVD 仅有 `flags: Set<string>`。需要将重要变量映射为 flags。
4. **对话历史** — RMMZ 和 Ren'Py 使用 message 历史，和 AVD 的 `BacklogEntry` 兼容。
5. **保存系统** — AVD 的 `AvdSaveData` 仅保存 lineIndex + flags，不支持完整的变量状态。需要扩展保存接口以支持 RMMZ 的完整变量表快照。
