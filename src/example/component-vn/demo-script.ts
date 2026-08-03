import type { VnScript } from '../../vn/types';

/**
 * HA1 演示剧本 — 使用 ex.moonchan.xyz 外链图片（<img> 无 CORS 限制）。
 * 展示 preload(wait/next) + say + bg + choice + jump + label。
 */
export const demoScript: VnScript = {
  meta: {
    strictLoad: true,
    fontFamily: '"Noto Serif SC", "STSong", serif',
    textSize: 22,
  },
  lines: [
    {
      type: 'preload',
      wait: true,
      assets: [
        { key: 'HA1-1', url: 'https://ex.moonchan.xyz/s/c1491b9616/3631029-6?redirect_to=image' },
        { key: 'HA1-2', url: 'https://ex.moonchan.xyz/s/4dd8df8987/3631029-7?redirect_to=image' },
        { key: 'HA1-3', url: 'https://ex.moonchan.xyz/s/e36c56dcfd/3631029-8?redirect_to=image' },
        { key: 'HA1-3^', url: 'https://ex.moonchan.xyz/s/02e1207368/3631029-9?redirect_to=image' },
        { key: 'HA1-4', url: 'https://ex.moonchan.xyz/s/0f580b0d53/3631029-10?redirect_to=image' },
        { key: 'HA1-5', url: 'https://ex.moonchan.xyz/s/1c9ac39ec7/3631029-11?redirect_to=image' },
      ],
    },
    { type: 'bg', key: 'HA1-1' },
    { type: 'say', speaker: '伊露', bg: 'HA1-1', text: '听说胸部会变得敏感来着…' },
    { type: 'say', speaker: '', bg: 'HA1-1', text: '伊露躺在床上，试着触碰自己。' },
    { type: 'say', speaker: '伊露', bg: 'HA1-1', text: '啊嗯…这是什么，感觉好强烈…' },
    { type: 'bg', key: 'HA1-2' },
    { type: 'say', speaker: '', bg: 'HA1-2', text: '伊露敞开衣服，直接抚摸乳头。' },
    { type: 'say', speaker: '伊露', bg: 'HA1-2', text: '哈啊…哈啊…真的感觉好强烈…' },
    { type: 'bg', key: 'HA1-3' },
    { type: 'say', speaker: '伊露', bg: 'HA1-3', text: '好厉害…好舒服…还要…更多…' },
    {
      type: 'choice',
      options: [
        { text: '继续', to: 'cont' },
        { text: '停下', to: 'stop' },
      ],
    },
    { type: 'label', name: 'cont' },
    { type: 'bg', key: 'HA1-4' },
    { type: 'say', speaker: '', bg: 'HA1-4', text: '身体一颤一颤。' },
    { type: 'jump', to: 'end' },
    { type: 'label', name: 'stop' },
    { type: 'bg', key: 'HA1-5' },
    { type: 'say', speaker: '伊露', bg: 'HA1-5', text: '还是到此为止吧…' },
    { type: 'label', name: 'end' },
    { type: 'end' },
  ],
};