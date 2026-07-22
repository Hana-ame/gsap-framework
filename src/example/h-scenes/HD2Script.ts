import type { AvdLineJSON, AvdScriptJSON } from '../../components';

// Converted from CommonEvents.json event 56 (HD2正常位)
// Each line = one Show Text (code 101 + 401 block) in the original
// bgKey placed on the line where the picture should already be showing
// (game's Show Picture (code 231) fires between dialogue boxes)
//
// Lines 9,17 have speaker="" in the original (no name shown)
export const HD2_LINES: AvdLineJSON[] = [
  { speaker: '伊露', bgKey: 'HD2-1', text: '来吧欧派斯基大人\n请把欧派斯基大人的鸡巴放进我的小穴里' },
  { speaker: '欧派斯基', text: '那我进去了' },
  { speaker: '伊露', bgKey: 'HD2-2', text: '啊啊欧派斯基大人的鸡巴进来了♡' },
  { speaker: '欧派斯基', bgKey: 'HD2-3', text: '怎么样舒服吗？' },
  { speaker: '伊露', text: '是的很舒服\n能感受到欧派斯基大人真是太幸福了' },
  { speaker: '欧派斯基', text: '伊露真是可爱啊' },
  { speaker: '伊露', text: '啊嗯欧派斯基大人才是最棒的呢♡' },
  { speaker: '欧派斯基', text: '你真是最棒的女仆啊' },
  { speaker: '', bgKey: 'HD2-4', text: '欧派斯基的抽送变得更加激烈。' },
  { speaker: '伊露', text: '啊嗯好舒服、好舒服欧派斯基大人' },
  { speaker: '欧派斯基', text: '啊啊不错' },
  { speaker: '欧派斯基', bgKey: 'HD2-5', text: '啊啊差不多要射了' },
  { speaker: '伊露', text: '是的要求吧、请在我里面射很多' },
  { speaker: '伊露', text: '啊啊我也快要去了' },
  { speaker: '欧派斯基', text: '啊啊要射了…' },
  { speaker: '欧派斯基', text: '啊啊射了' },
  { speaker: '', bgKey: 'HD2-6', text: '噗噗噗咻' },
  { speaker: '伊露', bgKey: 'HD2-7', text: '啊啊欧派斯基大人的有这么多…' },
  { speaker: '欧派斯基', text: '以后也要继续侍奉我哦' },
  { speaker: '伊露', text: '当然的欧派斯基大人♡' },
  { speaker: '', text: '— HD2 城2F 欧派斯基回想 终 —', end: true },
];

export const HD2_SCRIPT: AvdScriptJSON = {
  meta: { boxWidth: 900, boxHeight: 220, textSize: 22, nameSize: 20 },
  lines: HD2_LINES,
};
