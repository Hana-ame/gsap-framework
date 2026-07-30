import type { AvdLineJSON } from '../../avd';
import { HA1_LINES } from '../h-scenes/HA1Script';
import { HA2_LINES } from '../h-scenes/HA2Script';
import { HA3_LINES } from '../h-scenes/HA3Script';
import { HB_START_LINES } from '../h-scenes/HBStartScript';
import { HB1_LINES } from '../h-scenes/HB1Script';
import { HB2_LINES } from '../h-scenes/HB2Script';
import { T21_LINES } from '../h-scenes/T21Script';
import { T22_LINES } from '../h-scenes/T22Script';
import { T22_INRAN_LINES } from '../h-scenes/T22InranScript';
import { HC1_LINES } from '../h-scenes/HC1Script';
import { HC3_LINES } from '../h-scenes/HC3Script';
import { T3_LINES } from '../h-scenes/T3Script';
import { HD1_LINES } from '../h-scenes/HD1Script';
import { HD2_LINES } from '../h-scenes/HD2Script';
import { HD3_LINES } from '../h-scenes/HD3Script';
import { HE1_LINES } from '../h-scenes/HE1Script';
import { HE2_LINES } from '../h-scenes/HE2Script';
import { HF1_LINES } from '../h-scenes/HF1Script';
import { HG1_LINES } from '../h-scenes/HG1Script';
import { T1_LINES } from '../h-scenes/T1Script';
import {
  HA11_LINES, HA12_LINES,
  HB11_LINES, HB12_LINES,
  T1_LINES as RJ_T1_LINES, T2_LINES,
  HA21_LINES, HA22_LINES, HA23_LINES, HA24_LINES, HA25_LINES, HA26_LINES,
  HB21_LINES, HB22_LINES, HB23_LINES, HB24_LINES,
  T21_LINES as RJ_T21_LINES, T22_LINES as RJ_T22_LINES,
  HC1_LINES as RJ_HC1_LINES, HC2_LINES,
  T3_LINES as RJ_T3_LINES,
  HD1_LINES as RJ_HD1_LINES, HD2_LINES as RJ_HD2_LINES, HD3_LINES as RJ_HD3_LINES,
  HE1_LINES as RJ_HE1_LINES,
} from '../h-scenes/rj01222693/scripts';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';
import { IMAGE_MAP as RJ_IMAGE_MAP } from '../h-scenes/rj01222693/imageMapEx';

export interface AvdSceneEntry {
  label: string;
  hint: string;
  lines: AvdLineJSON[];
  imageMap?: Record<string, string>;
  getBgKeys: () => string[];
}

function bgKeys(lines: AvdLineJSON[]): () => string[] {
  return () => lines.filter(l => l.bgKey).map(l => l.bgKey!);
}

export const AVD_SCENE_REGISTRY: Record<string, AvdSceneEntry> = {
  // ── Main 19 scenes ──
  'avd-scene-ha1':     { label: 'HA1 自慰1',         hint: '旅馆自慰(通常服)',           lines: HA1_LINES,       imageMap: IMAGE_MAP, getBgKeys: bgKeys(HA1_LINES) },
  'avd-scene-ha2':     { label: 'HA2 自慰2',         hint: '旅馆自慰',                   lines: HA2_LINES,       imageMap: IMAGE_MAP, getBgKeys: bgKeys(HA2_LINES) },
  'avd-scene-ha3':     { label: 'HA3 自慰3',         hint: '旅馆自慰',                   lines: HA3_LINES,       imageMap: IMAGE_MAP, getBgKeys: bgKeys(HA3_LINES) },
  'avd-scene-hbstart': { label: 'HB 开始',           hint: '忠诚自慰开始',               lines: HB_START_LINES,  imageMap: IMAGE_MAP, getBgKeys: bgKeys(HB_START_LINES) },
  'avd-scene-hb1':     { label: 'HB1 忠诚自慰1',     hint: '忠诚自慰(通常服)',           lines: HB1_LINES,       imageMap: IMAGE_MAP, getBgKeys: bgKeys(HB1_LINES) },
  'avd-scene-hb2':     { label: 'HB2 忠诚自慰2',     hint: '忠诚自慰',                   lines: HB2_LINES,       imageMap: IMAGE_MAP, getBgKeys: bgKeys(HB2_LINES) },
  'avd-scene-t21':     { label: 'T21 胸揉',           hint: '西区胸揉(通常服)',           lines: T21_LINES,       imageMap: IMAGE_MAP, getBgKeys: bgKeys(T21_LINES) },
  'avd-scene-t22':     { label: 'T22 胸揉',           hint: '西区胸揉(色情服)',           lines: T22_LINES,       imageMap: IMAGE_MAP, getBgKeys: bgKeys(T22_LINES) },
  'avd-scene-t22inran':{ label: 'T22 胸揉(淫乱)',     hint: '西区胸揉(色情服/淫乱)',      lines: T22_INRAN_LINES, imageMap: IMAGE_MAP, getBgKeys: bgKeys(T22_INRAN_LINES) },
  'avd-scene-hc1':     { label: 'HC1 窥视',           hint: '西区窥视(色情服)',           lines: HC1_LINES,       imageMap: IMAGE_MAP, getBgKeys: bgKeys(HC1_LINES) },
  'avd-scene-hc3':     { label: 'HC3 贫乳手交',       hint: '西区乳交口交',               lines: HC3_LINES,       imageMap: IMAGE_MAP, getBgKeys: bgKeys(HC3_LINES) },
  'avd-scene-t3':      { label: 'T3 性骚扰',          hint: '胸揉+金项圈奴隶契约',        lines: T3_LINES,        imageMap: IMAGE_MAP, getBgKeys: bgKeys(T3_LINES) },
  'avd-scene-hd1':     { label: 'HD1 贫乳手交',       hint: '城2F 欧派斯基回想(口交)',     lines: HD1_LINES,       imageMap: IMAGE_MAP, getBgKeys: bgKeys(HD1_LINES) },
  'avd-scene-hd2':     { label: 'HD2 正常位',         hint: '城2F 欧派斯基回想(正常位)',   lines: HD2_LINES,       imageMap: IMAGE_MAP, getBgKeys: bgKeys(HD2_LINES) },
  'avd-scene-hd3':     { label: 'HD3 骑乘位',         hint: '城2F 欧派斯基回想(骑乘位)',   lines: HD3_LINES,       imageMap: IMAGE_MAP, getBgKeys: bgKeys(HD3_LINES) },
  'avd-scene-he1':     { label: 'HE1 洗脑',           hint: '洗脑结局',                   lines: HE1_LINES,       imageMap: IMAGE_MAP, getBgKeys: bgKeys(HE1_LINES) },
  'avd-scene-he2':     { label: 'HE2 骑乘位',         hint: '欧派斯基败北结局',           lines: HE2_LINES,       imageMap: IMAGE_MAP, getBgKeys: bgKeys(HE2_LINES) },
  'avd-scene-hf1':     { label: 'HF1 正常位',         hint: '欧派斯基的奴隶结局',          lines: HF1_LINES,       imageMap: IMAGE_MAP, getBgKeys: bgKeys(HF1_LINES) },
  'avd-scene-hg1':     { label: 'HG1 乱交',           hint: '居民结局',                   lines: HG1_LINES,       imageMap: IMAGE_MAP, getBgKeys: bgKeys(HG1_LINES) },
  'avd-scene-t1':      { label: 'T1 自慰',            hint: '自慰',                       lines: T1_LINES,        imageMap: IMAGE_MAP, getBgKeys: bgKeys(T1_LINES) },

  // ── RJ01222693 25 scenes ──
  'avd-scene-rj-ha11': { label: 'RJ HA11', hint: 'RJ01222693', lines: HA11_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(HA11_LINES) },
  'avd-scene-rj-ha12': { label: 'RJ HA12', hint: 'RJ01222693', lines: HA12_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(HA12_LINES) },
  'avd-scene-rj-hb11': { label: 'RJ HB11', hint: 'RJ01222693', lines: HB11_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(HB11_LINES) },
  'avd-scene-rj-hb12': { label: 'RJ HB12', hint: 'RJ01222693', lines: HB12_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(HB12_LINES) },
  'avd-scene-rj-t1':   { label: 'RJ T1',   hint: 'RJ01222693', lines: RJ_T1_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(RJ_T1_LINES) },
  'avd-scene-rj-t2':   { label: 'RJ T2',   hint: 'RJ01222693', lines: T2_LINES,    imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(T2_LINES) },
  'avd-scene-rj-ha21': { label: 'RJ HA21', hint: 'RJ01222693', lines: HA21_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(HA21_LINES) },
  'avd-scene-rj-ha22': { label: 'RJ HA22', hint: 'RJ01222693', lines: HA22_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(HA22_LINES) },
  'avd-scene-rj-ha23': { label: 'RJ HA23', hint: 'RJ01222693', lines: HA23_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(HA23_LINES) },
  'avd-scene-rj-ha24': { label: 'RJ HA24', hint: 'RJ01222693', lines: HA24_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(HA24_LINES) },
  'avd-scene-rj-ha25': { label: 'RJ HA25', hint: 'RJ01222693', lines: HA25_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(HA25_LINES) },
  'avd-scene-rj-ha26': { label: 'RJ HA26', hint: 'RJ01222693', lines: HA26_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(HA26_LINES) },
  'avd-scene-rj-hb21': { label: 'RJ HB21', hint: 'RJ01222693', lines: HB21_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(HB21_LINES) },
  'avd-scene-rj-hb22': { label: 'RJ HB22', hint: 'RJ01222693', lines: HB22_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(HB22_LINES) },
  'avd-scene-rj-hb23': { label: 'RJ HB23', hint: 'RJ01222693', lines: HB23_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(HB23_LINES) },
  'avd-scene-rj-hb24': { label: 'RJ HB24', hint: 'RJ01222693', lines: HB24_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(HB24_LINES) },
  'avd-scene-rj-t21':  { label: 'RJ T21',  hint: 'RJ01222693', lines: RJ_T21_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(RJ_T21_LINES) },
  'avd-scene-rj-t22':  { label: 'RJ T22',  hint: 'RJ01222693', lines: RJ_T22_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(RJ_T22_LINES) },
  'avd-scene-rj-hc1':  { label: 'RJ HC1',  hint: 'RJ01222693', lines: RJ_HC1_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(RJ_HC1_LINES) },
  'avd-scene-rj-hc2':  { label: 'RJ HC2',  hint: 'RJ01222693', lines: HC2_LINES,    imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(HC2_LINES) },
  'avd-scene-rj-t3':   { label: 'RJ T3',   hint: 'RJ01222693', lines: RJ_T3_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(RJ_T3_LINES) },
  'avd-scene-rj-hd1':  { label: 'RJ HD1',  hint: 'RJ01222693', lines: RJ_HD1_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(RJ_HD1_LINES) },
  'avd-scene-rj-hd2':  { label: 'RJ HD2',  hint: 'RJ01222693', lines: RJ_HD2_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(RJ_HD2_LINES) },
  'avd-scene-rj-hd3':  { label: 'RJ HD3',  hint: 'RJ01222693', lines: RJ_HD3_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(RJ_HD3_LINES) },
  'avd-scene-rj-he1':  { label: 'RJ HE1',  hint: 'RJ01222693', lines: RJ_HE1_LINES, imageMap: RJ_IMAGE_MAP, getBgKeys: bgKeys(RJ_HE1_LINES) },
};
