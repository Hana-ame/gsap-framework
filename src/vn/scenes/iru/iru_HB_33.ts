import type { VnScript } from '../types';

export const iru_HB_33: VnScript = {
  meta: { strictLoad: true },
  lines: [
 {
  "type": "preload",
  "wait": true,
  "assets": [
   {
    "key": "HB1-7",
    "url": "https://ex.moonchan.xyz/s/7d1a837940/3631029-23?redirect_to=image"
   },
   {
    "key": "HB1-8",
    "url": "https://ex.moonchan.xyz/s/9bb900a41a/3631029-24?redirect_to=image"
   }
  ]
 },
 {
  "type": "cg",
  "key": "HB1-7"
 },
 {
  "type": "say",
  "speaker": "伊露",
  "text": "唔啊啊啊啊啊，奇派斯基大人啊"
 },
 {
  "type": "cg",
  "key": "HB1-8"
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
  "text": "噗嗤——"
 },
 {
  "type": "end",
  "goto": "#vn-menu"
 },
 {
  "type": "say",
  "speaker": "",
  "text": "伊露尽情地享受着自慰，直到心满意足。"
 },
 {
  "type": "jump",
  "to": "終了"
 },
 {
  "type": "label",
  "name": "終了"
 },
 {
  "type": "end",
  "goto": "#vn-menu"
 }
],
};
