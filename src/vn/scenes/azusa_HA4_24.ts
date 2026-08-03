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
  "text": "「助けてくれー」\n「エンペラパールだ！逃げろーーー」"
 },
 {
  "type": "cg",
  "key": "HA4"
 },
 {
  "type": "say",
  "speaker": "アズサ",
  "text": "エンパイアに逆らうものは容赦しない"
 },
 {
  "type": "say",
  "speaker": "アズサ",
  "text": "エンパイアに服従か死か、好きな方を選べ"
 },
 {
  "type": "say",
  "speaker": "",
  "text": "機械のように冷酷な魔法少女エンペラパールは\n人類に恐れられる存在となってしまうのだった。"
 },
 {
  "type": "say",
  "speaker": "",
  "text": "悪の魔法少女エンド"
 }
],
};
