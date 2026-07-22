import { useEffect, useRef } from 'react';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';
import { AvdController } from '../../avd/AvdController';
import { DomTexture } from '../../avd/dom/DomNode';
import type { AvdLine } from '../../avd/types';

const LINES: AvdLine[] = [
  { speaker: '???', text: '你醒了…', bgKey: 'HD2-1' },
  { speaker: '???', text: '感觉如何？' },
  { speaker: '主人公', text: '这里是…？', bgKey: 'HD2-2' },
  { speaker: '???', text: '不用担心，这里很安全' },
  { speaker: '???', text: '先休息一下吧' },
  { speaker: '主人公', text: '你是谁？', bgKey: 'HD2-3' },
  { speaker: '???', text: '我是这里的管理人' },
  { speaker: '???', text: '你以后会慢慢知道的', bgKey: 'HD2-4' },
  { speaker: '主人公', text: '我为什么会在这里？' },
  { speaker: '???', text: '那并不重要', bgKey: 'HD2-5' },
  { speaker: '???', text: '重要的是你以后的选择' },
  { speaker: '???', text: '好好休息吧', bgKey: 'HD2-6' },
  { speaker: '主人公', text: '等等——', bgKey: 'HD2-7' },
  { text: '（意识逐渐模糊……）' },
  { bgKey: 'HA1-1', text: '' },
  { bgKey: 'HA1-2', text: '' },
  { bgKey: 'HA1-3', text: '' },
  { bgKey: 'HA1-3^', text: '' },
  { bgKey: 'HA1-4', text: '' },
  { bgKey: 'HA1-5', text: '' },
  { text: '', end: true },
];

export function Cg07AvdScriptDisplay() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const allBgKeys = LINES.filter(l => l.bgKey).map(l => l.bgKey!);
    const texMap: Record<string, DomTexture> = {};
    for (const k of allBgKeys) texMap[k] = new DomTexture(IMAGE_MAP[k]);

    const checkLoaded = () => {
      if (allBgKeys.every(k => texMap[k].loaded)) {
        const W = window.innerWidth;
        const H = window.innerHeight;
        const avd = new AvdController(root, null, {
          screenW: W, screenH: H,
          boxY: H - 200 - 40,
          portraitY: H - 560 - 20,
          typewriterSpeed: 35,
          fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
        }, 'dom');
        avd.setBgTextureMap(texMap);
        avd.setScript(LINES);
      } else {
        setTimeout(checkLoaded, 200);
      }
    };
    checkLoaded();

    return () => {};
  }, []);

  return <div ref={rootRef} style={{ position: 'fixed', inset: 0, background: '#000' }} />;
}

Cg07AvdScriptDisplay.head = {
  title: 'CG 07: AVD DOM Script',
  description: 'AvdController(dom) + 有台词的脚本 + CG 过渡 + 打字机效果',
};
