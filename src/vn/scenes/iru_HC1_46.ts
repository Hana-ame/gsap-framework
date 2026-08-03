import type { VnScript } from '../types';

export const iru_HC1_46: VnScript = {
  meta: { strictLoad: true },
  lines: [
 {
  "type": "preload",
  "wait": true,
  "assets": [
   {
    "key": "HC1-6",
    "url": "https://ex.moonchan.xyz/s/8f7063ec2d/3631029-35?redirect_to=image"
   },
   {
    "key": "HC1-7",
    "url": "https://ex.moonchan.xyz/s/289f3fa693/3631029-36?redirect_to=image"
   }
  ]
 },
 {
  "type": "cg",
  "key": "HC1-6"
 },
 {
  "type": "say",
  "speaker": "男性",
  "text": "ああ…いいよぉ"
 },
 {
  "type": "cg",
  "key": "HC1-7"
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
