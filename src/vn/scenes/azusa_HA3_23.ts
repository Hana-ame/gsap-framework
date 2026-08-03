import type { VnScript } from '../types';

export const azusa_HA3_23: VnScript = {
  meta: { strictLoad: true },
  lines: [
 {
  "type": "preload",
  "wait": true,
  "assets": [
   {
    "key": "HA3-1",
    "url": "https://ex.moonchan.xyz/s/e4437102f9/3191868-20?redirect_to=image"
   },
   {
    "key": "HA3-2",
    "url": "https://ex.moonchan.xyz/s/f4b7c8b301/3191868-21?redirect_to=image"
   },
   {
    "key": "HA3-3",
    "url": "https://ex.moonchan.xyz/s/5074475ef1/3191868-22?redirect_to=image"
   }
  ]
 },
 {
  "type": "cg",
  "key": "HA3-1"
 },
 {
   "type": "say",
   "speaker": "毒沼部下",
   "text": "总算把她抓住了呢"
  },
  {
   "type": "say",
   "speaker": "毒沼",
   "text": "刚才真是危险…"
  },
  {
   "type": "say",
   "speaker": "毒沼",
   "text": "幸好她才刚觉醒不久，\n还没能完全掌握那股力量"
  },
  {
   "type": "say",
   "speaker": "毒沼",
   "text": "好，开始重新洗脑！"
  },
  {
   "type": "say",
   "speaker": "毒沼部下",
   "text": "是！"
  },
  {
   "type": "cg",
   "key": "HA3-2"
  },
  {
   "type": "say",
   "speaker": "",
   "text": "洗脑装置启动。"
  },
  {
   "type": "say",
   "speaker": "毒沼",
   "text": "半吊子的洗脑有被解除的可能"
  },
  {
   "type": "say",
   "speaker": "毒沼",
   "text": "把人格彻底抹消，让她成为只服从帝国的存在"
  },
  {
   "type": "say",
   "speaker": "毒沼部下",
   "text": "明白了，最大输出！！"
  },
  {
   "type": "cg",
   "key": "HA3-3"
  },
  {
   "type": "say",
   "speaker": "",
   "text": "洗脑装置以最大输出运转。"
  },
  {
   "type": "say",
   "speaker": "梓",
   "text": "（啊啊啊，我要消失了…就这样消失掉了呜呜呜呜）"
  },
  {
   "type": "say",
   "speaker": "毒沼",
   "text": "今后就为我们卖力吧，帝国珍珠"
  },
  {
   "type": "say",
   "speaker": "梓",
   "text": "（啊啊啊啊啊，谁来…救我…）"
  },
  {
   "type": "say",
   "speaker": "梓",
   "text": "（对帝…国…宣誓…忠…诚…）"
  },
  {
   "type": "say",
   "speaker": "",
   "text": "就这样，梓的人格被抹消，\n沦为只为帝国而战的兵器。"
  },
 {
  "type": "end",
  "goto": "#vn-menu"
 }
],
};
