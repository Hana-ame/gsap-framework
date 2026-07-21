/**
 * 第三章 B：剑与秘密花园
 *
 * 场景：玩家在 ch3a 中选择"剑柄敲击"后触发。
 *   segment: 'ending-c' 由 ch3a 的 choice targetSegment 指向。
 *
 * 注意：
 *   ch3a 和 ch3b 共享 detour 段落（符文场景），
 *   分别在其后走向不同结局。
 *   如需独立加载，可以将 detour 段落提取为公共章节。
 */
export const CH3B = {
  lines: [
    { segment: 'ending-c', speaker: 'Narrator', bgKey: 'bg_garden', bgmKey: 'bgm_garden', text: '剑柄敲击符文的瞬间，整个走廊开始震颤。' },
    { speaker: 'Narrator', text: '墙壁裂开，露出了隐藏的密道！' },
    { speaker: 'Narrator', text: '你沿着密道逃出，发现了一片隐秘的花园。——  结局 C：秘密花园', end: true },
  ],
} as const;
