import type { VnScript } from '../types';

export const azusa_HH5_74: VnScript = {
  meta: { strictLoad: true },
  lines: [
 {
  "type": "preload",
  "wait": true,
  "assets": [
   {
    "key": "HH5-1",
    "url": "https://ex.moonchan.xyz/s/f05f496e67/3191868-336?redirect_to=image"
   },
   {
    "key": "HH5s-1",
    "url": "https://ex.moonchan.xyz/s/f3e86e2d1c/3191868-341?redirect_to=image"
   }
  ]
 },
 {
  "type": "choice",
  "options": [
   {
    "text": "魔法少女の姿でエッチする",
    "to": "azusa_74_c0"
   },
   {
    "text": "アズサとしてエッチする",
    "to": "azusa_74_c1"
   }
  ]
 },
 {
  "type": "label",
  "name": "azusa_74_c0"
 },
 {
  "type": "bg",
  "key": "HH5-1"
 },
 {
  "type": "label",
  "name": "azusa_74_c1"
 },
 {
  "type": "bg",
  "key": "HH5s-1"
 }
],
};
