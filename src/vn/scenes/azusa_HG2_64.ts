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
  "text": "「きゃーーー」\n「助けてくれーーー」"
 },
 {
  "type": "cg",
  "key": "HG2-1"
 },
 {
  "type": "say",
  "speaker": "アズサ",
  "text": "あはははは、弱い人間たちよ！\nエンパイアの前にひれ伏すのだ！！"
 },
 {
  "type": "say",
  "speaker": "アズサ",
  "text": "エンパイアに服従するなら命だけは助けてやる\nだが断るなら…"
 },
 {
  "type": "say",
  "speaker": "市民",
  "text": "するっ、服従するから助けてくれ…"
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
  "text": "魔法で毒沼の施設へ送られる男性。"
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
  "speaker": "アズサ",
  "text": "他のみんなはどうなんだ？\n死がお望みか？"
 },
 {
  "type": "say",
  "speaker": "市民",
  "text": "ひぃいいいい"
 },
 {
  "type": "say",
  "speaker": "",
  "text": "悪の魔法少女エンペラパールにより、\n人々はエンパイアに服従していった。"
 },
 {
  "type": "say",
  "speaker": "",
  "text": "こうして世界はエンパイアのものとなるのだった。"
 },
 {
  "type": "say",
  "speaker": "",
  "text": "最悪の魔法少女エンド"
 },
 {
  "type": "end",
  "goto": "#vn-menu"
 }
],
};
