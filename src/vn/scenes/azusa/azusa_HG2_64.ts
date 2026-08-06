import type { VnScript } from '../types';

export const azusa_HG2_64: VnScript = {
  meta: { strictLoad: true },
  lines: [
 {
  "type": "preload",
  "wait": true,
  "assets": [
   {
    "key": "HG2-1",
    "url": "https://ex.moonchan.xyz/s/553251a778/3191868-291?redirect_to=image"
   },
   {
    "key": "HG2-2",
    "url": "https://ex.moonchan.xyz/s/9124956515/3191868-292?redirect_to=image"
   }
  ]
 },
 {
  "type": "say",
  "speaker": "市民",
   "text": "「呀啊啊啊」\n「救命啊———」"
  },
  {
   "type": "cg",
   "key": "HG2-1"
  },
  {
   "type": "say",
   "speaker": "梓",
   "text": "哈哈哈，弱小的家伙们！\n在帝国面前俯首称臣吧！！"
  },
  {
   "type": "say",
   "speaker": "梓",
   "text": "向帝国臣服的话就饶你们一命\n但要拒绝的话…"
  },
  {
   "type": "say",
   "speaker": "市民",
   "text": "我臣服，我臣服，救救我吧…"
  },
 {
  "type": "say",
  "speaker": "",
  "text": "",
  "effect": "flash"
 },
 {
  "type": "say",
  "speaker": "",
   "text": "男性被魔法送到了毒沼的设施。"
  },
 {
  "type": "cg",
  "key": "HG2-2"
 },
 {
  "type": "cg",
  "key": "HG2-2"
 },
 {
  "type": "say",
   "speaker": "梓",
   "text": "其他人怎么样？\n想要找死吗？"
  },
  {
   "type": "say",
   "speaker": "市民",
   "text": "啊啊啊不要"
  },
  {
   "type": "say",
   "speaker": "",
   "text": "在邪恶的魔法少女帝国珍珠手下，\n人们纷纷向帝国臣服。"
  },
  {
   "type": "say",
   "speaker": "",
   "text": "就这样，世界落入了帝国之手。"
  },
  {
   "type": "say",
   "speaker": "",
   "text": "最邪恶的魔法少女结局"
  },
 {
  "type": "end",
  "goto": "#vn-menu"
 }
],
};
