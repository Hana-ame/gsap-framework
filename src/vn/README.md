# src/vn — 剧本驱动 VN 播放器框架

解耦旧 `src/avd` 的轻量视觉小说引擎。剧本（scenario）= 纯 TS 数据，资源 URL 内联，按剧本加载。

## 设计目标

- **剧本驱动**：scenario 是 TS 文件（`export const X: VnScript`），含 meta（配置）+ lines（指令序列）。不做 txt/json 运行时解析（简单场景除外）。
- **框架只提供组件，不含场景逻辑**：VnPlayer 提供原子能力（图层渲染/对话框/打字机/选项/加载遮罩/跳转），场景数据决定画什么、在哪层。
- **按剧本加载资源**：资源 URL 内联在 `preload` 指令，只加载当前剧本声明的内容，不一次性全量。
- **外链 CG**：图片用 `ex.moonchan.xyz` 外链，DOM `<img>` 无 CORS 限制。

## 剧本格式

```ts
import type { VnScript } from '../types';

export const demo: VnScript = {
  meta: { strictLoad: true, bgMode: 'cg', fontFamily: '"Noto Serif SC", serif', textSize: 22 },
  lines: [
    { type: 'preload', wait: true, assets: [{ key: 'cg1', url: 'https://...' }] },
    { type: 'bg', key: 'bg1' },          // 背景层（cover 占满）
    { type: 'cg', key: 'cg1' },          // CG 层（contain 看全）
    { type: 'say', speaker: '伊露', cg: 'cg1', text: '台词' },
    { type: 'choice', options: [{ text: '继续', to: 'next' }] },
    { type: 'label', name: 'next' },
    { type: 'jump', to: 'next' },        // 跳 label
    { type: 'end', goto: '#vn-menu' },   // 结束并回菜单
  ],
};
```

## 指令集

| 指令 | 作用 |
|------|------|
| `preload` | 声明资源 `{key,url}`。`wait:true` 等加载完再继续；`wait:false` 立即继续后台加载 |
| `say` | 对话。`speaker` 空串=旁白。`bg`/`cg` 附带切对应图层；`index`/`zIndex` 控制叠加 |
| `bg` | 背景层，cover 占满全屏 |
| `cg` | CG 层，contain 看全（16:9 框内） |
| `choice` | 选项，`options[].to` 跳 label |
| `jump` | 跳转：label 名 / `#hash` 路由 / `https://` 开网页 / 场景名加载 |
| `label` | 跳转标签 |
| `end` | 结束。`goto` 可跳 `#hash` / URL / 场景名 |

## 图层

- 两层语义：`bg`（背景，cover）、`cg`（CG，contain）。同 index 时 cg 在 bg 前。
- `index`（默认 0）、`zIndex` 可选，控制叠加顺序。
- 用 `bg:`/`cg:` 指令或 `say.bg`/`say.cg` 切换图层。

## 跳转目标（`jump.to` / `end.goto`）

| 目标值 | 行为 |
|--------|------|
| `#vn-menu` | hash 路由切到菜单 |
| `https://example.com` | 打开新网页标签 |
| `scenario-key` | 自动加载 `hscene-<key>` 场景 |

## 加载模式

- `preload.wait:true`（或 meta `strictLoad:true`）：等全部加载完成才继续播放，期间显示 loading 进度。
- `preload.wait:false`：不等待立即继续，图片后台加载、准备好后显示。

## 消费方

- `src/example/hscene/*.tsx`：每个场景一个懒加载组件，渲染 `VnPlayer` + 对应 scenario。
- `src/example/vn-menu/`：默认入口，HS 列表按游戏分组，点击切 `#hscenekey`。
- `src/example/examples.ts`：全组件 React.lazy 分离，主 bundle 保持小体积。

## 维护提示

- 场景由 `scripts/rmmz2vn.py` 从 3 个 RMMZ 游戏 CommonEvents 生成（脚本保留，可重跑）。
- 不要改动 `src/avd/`（遗留），新增剧情走 `src/vn/`。