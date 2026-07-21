/**
 * 第一章：古门
 *
 * 场景：冒险者推开古门，穿过走廊，看到壁画和石门。
 * 本章包含开场叙述，不包含选项。
 *
 * 字段说明：
 *   speaker   — 说话者名称。显示在对话框顶部。
 *   text      — 对话文本。支持纯字符串或 AvdTextSegment[]（图文混排）。
 *   segment   — 段落标识。其他章节的 choice 可通过 targetSegment 跳转到此。
 *              例如：{ targetSegment: 'ending-a' } 会跳转到第一个 segment='ending-a' 的行。
 *   end       — 设为 true 表示当前行为结局/终止行，打字完成后停止推进。
 *   choices   — 选项列表。每个选项有 text（显示文字）和 targetSegment（跳转段落）。
 *
 * 章节文件是纯数据，不依赖框架类型，可在任何地方编辑或托管。
 */
export const CH1 = {
  lines: [
    { speaker: 'Narrator', voiceKey: 'voice_hello', bgKey: 'bg_cave', bgmKey: 'bgm_cave', text: '你推开了古旧的木门。' },
    { speaker: 'Narrator', voiceKey: 'voice_wonder', sfxKey: 'sfx_drip', text: '走廊两侧的烛台依次亮起，照亮了墙上的壁画。' },
    { speaker: 'Narrator', text: '壁画描绘着一场古老的战争，骑士与巨龙对峙。' },
    { speaker: 'Narrator', sfxKey: 'sfx_door', text: '走廊尽头出现了一扇雕刻精美的石门。' },
    { speaker: 'Hero', voiceKey: 'voice_cheer', expression: 'happy', text: '门后一定有宝藏！' },
    { speaker: 'Hero', expression: 'sad', text: '但也许也藏着什么可怕的东西……' },
  ],
} as const;
