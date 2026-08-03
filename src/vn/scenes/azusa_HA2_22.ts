import type { VnScript } from '../types';

export const azusa_HA2_22: VnScript = {
  meta: { strictLoad: true },
  lines: [
 {
  "type": "preload",
  "wait": true,
  "assets": [
   {
    "key": "HA2",
    "url": "https://ex.moonchan.xyz/s/e175af2f85/3191868-19?redirect_to=image"
   }
  ]
 },
 {
   "type": "say",
   "speaker": "市民",
   "text": "帝国攻过来啦——"
  },
  {
   "type": "cg",
   "key": "HA2"
  },
  {
   "type": "say",
   "speaker": "梓",
   "text": "对帝国宣誓忠诚…"
  },
  {
   "type": "say",
   "speaker": "",
   "text": "帝国的战斗员中出现了梓的身影。"
  },
  {
   "type": "say",
   "speaker": "",
   "text": "站在那里的，只是丧失了人格、只会忠实服从命令的\n一介战斗员。"
  },
  {
   "type": "say",
   "speaker": "梓",
   "text": "胆敢反抗帝国者，一律排除"
  },
  {
   "type": "say",
   "speaker": "梓&战斗员们",
   "text": "对帝国宣誓忠诚！！"
  },
  {
   "type": "say",
   "speaker": "",
   "text": "沦为战斗员的结局"
  },
 {
  "type": "end",
  "goto": "#vn-menu"
 }
],
};
