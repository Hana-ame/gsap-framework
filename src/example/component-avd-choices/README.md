# ComponentAvdChoicesDisplay

AVD 分支选择 demo：多章节剧本 + 分支选项 + 多结局。

## 功能

- **分章节剧本** — 4 个独立 `.ts` 文件（ch1 / ch2 / ch3a / ch3b），静态导入后合并
- **segment 导航** — 选项通过 `targetSegment` 跳转到段落名，不依赖硬编码行号
- **`end: true` 结束标记** — 结局行正确停止，不会继续播放后续内容
- **多结局** — 3 个不同结局（龙之宝库 / 符文传承 / 秘密花园）
- **parseScript 解析** — 从 `AvdScriptJSON` 加载剧本、角色、纹理
- **全部 PIXI UI**，无 React DOM

## 剧本文件

| 文件 | 段落 | 内容 |
|------|------|------|
| ch1.ts | — | 开场叙述（4 行） |
| ch2.ts | `ending-a` | 首次分支 + 结局 A（龙之宝库） |
| ch3a.ts | `detour` → `ending-b` | 符文场景 + 二次分支 + 结局 B（传承） |
| ch3b.ts | `ending-c` | 结局 C（秘密花园） |

## 关键设计

- 剧本文件是纯数据对象，可托管到 CDN 后改用 `fetch()` 运行时加载
- `segment` 名在整本剧本中唯一，引擎自动构建 `segment → lineIndex` 映射
- `_resolveTarget()` 优先查找 `targetSegment`，未命中则回退 `targetLine`
