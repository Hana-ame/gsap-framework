import type { VnScript } from '../types';

export const iru_HC3_48: VnScript = {
  meta: { strictLoad: true },
  lines: [
 {
  "type": "preload",
  "wait": true,
  "assets": [
   {
    "key": "HC3-6",
    "url": "https://ex.moonchan.xyz/s/22ae110a67/3631029-52?redirect_to=image"
   },
   {
    "key": "HC3-7",
    "url": "https://ex.moonchan.xyz/s/0b52d35906/3631029-53?redirect_to=image"
   }
  ]
 },
 {
  "type": "say",
  "speaker": "男性",
  "text": "ホテルへ行く二人。"
 },
 {
  "type": "cg",
  "key": "HC3-6"
 },
 {
  "type": "cg",
  "key": "HC3-7"
 },
 {
  "type": "say",
  "speaker": "",
  "text": "",
  "effect": "flash"
 },
 {
  "type": "end",
  "goto": "#vn-menu"
 }
],
};
