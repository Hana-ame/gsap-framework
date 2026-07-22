# Issue: rj01222693 (亜里沙主角) CG 无法显示

## 状态

**搁置** — 推测 DeepSeek（当前 AI）暂无法胜任该工作，需待 AVD 框架及更低层的重置后再处理。

## 问题描述

`src/example/h-scenes/rj01222693/` 中的剧本脚本（`scripts.ts`）引用的是**亜里沙（有理紗）** 为主角的另一款游戏。
其剧本行使用 `bgKey: '1'`, `'2'`, `'3'` 等**纯数字字符串**作为 CG 键名，例如：

```ts
export const HA11_LINES: AvdLineJSON[] = [
  { speaker: '有理紗', bgKey: '1', text: '勝利おめでとうございます茶羅井様' },
  { speaker: '', bgKey: '1', text: 'セックスしながら勝利を祝い合う二人。' },
  ...
];
```

而现有的 `IMAGE_MAP`（`imageMapEx.ts`）仅包含**イルと貧乳の国**（伊露主角）的 CG 映射，
键名格式为 `'HA1-1'`、`'HD2-1'`、`'HC32-1'` 等，与数字键名完全不匹配。

## 受影响组件

使用 `rj01222693/scripts.ts` 导出的剧本的组件（共 9 个）：

| 组件 | 路由 |
|------|------|
| ComponentAvdT21Display | component-avd-t21 |
| ComponentAvdT22Display | component-avd-t22 |
| ComponentAvdHc1Display | component-avd-hc1 |
| ComponentAvdT3Display | component-avd-t3 |
| ComponentAvdHd1Display | component-avd-hd1 |
| ComponentAvdHd2Display | component-avd-hd2 |
| ComponentAvdHd3Display | component-avd-hd3 |
| ComponentAvdHe1Display | component-avd-he1 |
| ComponentAvdT1Display | component-avd-t1 |

经 2024-07-23 迁移后，这些组件已使用 `mountDomScene({ imageMap: IMAGE_MAP })`（DOM 模式），
但 `IMAGE_MAP` 中不存在对应的数字键名（`'1'`, `'2'`, …），导致 `setBgLazyLoad` 返回 `null`，
CG 无法加载。

## 根本原因

1. **两套游戏的 CG 映射不同** — `imageMapEx.ts` 是伊露游戏的 CG 映射（键名含场景前缀），
   亜里沙游戏需要**独立的 CG URL 映射**。
2. **亜里沙游戏的原始 CG 来源未知** — 现有的 ExMoonchan gallery（3631029）仅包含伊露游戏的 CG。
   亜里沙游戏需要不同的 gallery URL 来生成对应的 `IMAGE_MAP`。
3. **数字 bgKey 需要场景索引映射** — 数字键名（`'1'` → `'HA11-1'`）的对应关系需要从 `CommonEvents.json`
   或原始 RPG Maker 数据中推导。

## 下一步（搁置中）

- [ ] 定位亜里沙游戏在 ExMoonchan 上的 gallery URL
- [ ] 生成亜里沙游戏的 `IMAGE_MAP`（格式为 `数字键 → ExMoonchan URL`）
- [ ] 确认 `rj01222693/scripts.ts` 中所有数字 bgKey 对应的正确 CG
- [ ] 在 `mountDomScene` 调用时传入正确的 imageMap

## 备注

- `rj01222693/scripts.ts` 在早期被外部环境**错误替换**了 bgKey 为 `'HA11-1'`、`'HC32-1'` 等形式，
  已于 2024-07-23 通过 `git restore` 恢复为原始数字键名。
- 外部环境（构建工具 / 编辑器插件）可能持续修改 `scripts.ts` 和 `imageMap.ts`，需在每次编辑前验证。
