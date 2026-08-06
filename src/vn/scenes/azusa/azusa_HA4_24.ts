import type { VnScript } from '../types';

export const azusa_HA4_24: VnScript = {
  meta: { strictLoad: true },
  lines: [
 {
  "type": "preload",
  "wait": true,
  "assets": [
   {
    "key": "HA4",
    "url": "https://ex.moonchan.xyz/s/f5036e6d19/3191868-23?redirect_to=image"
   }
  ]
 },
 {
   "type": "say",
   "speaker": "市民",
   "text": "「救命啊——」\n「是帝国珍珠！快逃啊———」"
  },
  {
   "type": "cg",
   "key": "HA4"
  },
  {
   "type": "say",
   "speaker": "梓",
   "text": "胆敢反抗帝国者，绝不轻饶"
  },
  {
   "type": "say",
   "speaker": "梓",
   "text": "对帝国臣服，或者死，随你选"
  },
  {
   "type": "say",
   "speaker": "",
   "text": "宛如机械般冷酷无情的魔法少女帝国珍珠，\n最终成为了让人类闻风丧胆的存在。"
  },
  {
   "type": "say",
   "speaker": "",
   "text": "邪恶魔法少女的结局"
  },
 {
  "type": "end",
  "goto": "#vn-menu"
 }
],
};
