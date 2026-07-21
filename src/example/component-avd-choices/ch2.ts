/**
 * 第二章：抉择与龙之宝库
 *
 * 场景：石门打开后，玩家面临第一个分支选项。
 *   - 选项 A（踏入光芒）→ 进入结局 A（龙之宝库）
 *   - 选项 B（后退观察）→ 进入第三章（符文线索），该章会再次分支。
 *
 * targetSegment 说明：
 *   选项中的 targetSegment 指向另一章节中 segment 字段匹配的行。
 *   引擎会自动构建 segment → lineIndex 的映射。
 *   segment 值在整本剧本中必须唯一。
 *
 * end: true 说明：
 *   一行结束后不再推进到下一行，触发 onComplete 回调。
 *   这对结局行是必需的，否则会继续播放下一个章节。
 */
export const CH2 = {
  lines: [
    {
      speaker: 'Narrator', bgKey: 'bg_treasure', bgmKey: 'bgm_treasure',
      text: '石门缓缓打开，透出耀眼的光芒……',
      choices: [
        { text: '踏入光芒之中', targetSegment: 'ending-a' },
        { text: '后退，仔细观察四周', targetSegment: 'detour' },
      ],
    },
    { segment: 'ending-a', speaker: 'Narrator', bgKey: 'bg_treasure', text: '你被传送到了一个巨大的宝库。' },
    { speaker: 'Narrator', effect: 'flash', text: '金币和宝石堆积如山，在魔法光芒下闪烁。' },
    { speaker: 'Narrator', text: '你获得了传说中的龙之宝藏！——  结局 A：龙之宝库', end: true },
  ],
} as const;
