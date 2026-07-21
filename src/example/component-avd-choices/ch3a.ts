/**
 * 第三章 A：符文与魔法传承
 *
 * 场景：玩家选择"后退观察"后触发，发现石门上刻着符文。
 *   此处出现第二个分支选项。
 *   - 选项 A（轻触符文）→ 结局 B（符文传承）
 *   - 选项 B（剑柄敲击）→ 结局 C（秘密花园）
 *
 * segment: 'detour' 是整个剧本的第二个段落的入口，
 * 由 ch2 中的 choice targetSegment: 'detour' 指向这里。
 *
 * 使用建议：
 *   分支文件（如 ch3a / ch3b）可以各自独立托管在不同 URL，
 *   引擎在加载时合并 lines 数组，segment 名保持全局唯一即可。
 */
export const CH3A = {
  lines: [
    { segment: 'detour', speaker: 'Narrator', bgKey: 'bg_rune', bgmKey: 'bgm_rune', effect: 'shake', text: '你退后半步，注意到门框上刻着细小的符文。' },
    { speaker: 'Narrator', text: '符文闪烁着淡蓝色的光，似乎是一种古老的机关。' },
    {
      speaker: 'Narrator',
      text: '你伸手触碰符文……',
      choices: [
        { text: '用指尖轻触符文', targetSegment: 'ending-b' },
        { text: '用剑柄敲击符文', targetSegment: 'ending-c' },
        { text: '拿出笔记对照符文', targetSegment: 'ending-b', conditionFlag: 'has_notebook' },
      ],
    },
    { segment: 'ending-b', speaker: 'Narrator', bgKey: 'bg_rune', text: '符文发出耀眼的光芒，你感到一阵眩晕。' },
    { speaker: 'Narrator', text: '你获得了古代魔法传承！' },
    { speaker: 'Narrator', text: '现在你能理解所有古老的咒语了。——  结局 B：符文传承', end: true },
  ],
} as const;
