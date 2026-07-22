import { useEffect, useRef } from 'react';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';
import { AvdController } from '../../avd/AvdController';
import { DomTexture } from '../../avd/dom/DomNode';
import type { AvdLine } from '../../avd/types';

const LINES: AvdLine[] = [
  { bgKey: 'HD2-1', text: '' },
  { bgKey: 'HD2-2', text: '' },
  { bgKey: 'HD2-3', text: '' },
  { bgKey: 'HD2-4', text: '' },
  { bgKey: 'HD2-5', text: '' },
  { bgKey: 'HD2-6', text: '' },
  { bgKey: 'HD2-7', text: '' },
  { bgKey: 'HA1-1', text: '' },
  { bgKey: 'HA1-2', text: '' },
  { bgKey: 'HA1-3', text: '' },
  { bgKey: 'HA1-4', text: '' },
  { bgKey: 'HA1-5', text: '' },
  { bgKey: 'HE1-1', text: '' },
  { bgKey: 'HE1-2', text: '' },
  { bgKey: 'HE1-3', text: '' },
  { bgKey: 'HE1-4', text: '' },
  { bgKey: 'HE1-5', text: '' },
  { bgKey: 'HE1-6', text: '' },
  { bgKey: 'HE1-7', text: '' },
  { bgKey: 'HE1-8', text: '' },
  { bgKey: 'HE1-9', text: '' },
  { bgKey: 'HE1-10', text: '' },
  { bgKey: 'HE1-11', text: '' },
  { bgKey: 'HE1-13', text: '' },
  { bgKey: 'HE1-14', text: '' },
  { bgKey: 'HF1-1', text: '' },
  { bgKey: 'HF1-2', text: '' },
  { bgKey: 'HF1-3', text: '' },
  { bgKey: 'HF1-4', text: '' },
  { bgKey: 'HF1-5', text: '' },
  { bgKey: 'HF1-6', text: '' },
  { bgKey: 'HF1-7', text: '' },
  { bgKey: 'HG1-1', text: '' },
  { bgKey: 'HG1-2', text: '' },
  { bgKey: 'HG1-2^', text: '' },
  { bgKey: 'HG1-3', text: '' },
  { bgKey: 'HG1-4', text: '' },
  { bgKey: 'HG1-5', text: '' },
  { text: '', end: true },
];

export function Cg06AvdNoscriptDisplay() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const allBgKeys = LINES.filter(l => l.bgKey).map(l => l.bgKey!);
    const texMap: Record<string, DomTexture> = {};
    for (const k of allBgKeys) texMap[k] = new DomTexture(IMAGE_MAP[k]);

    const checkLoaded = () => {
      if (allBgKeys.every(k => texMap[k].loaded)) {
        const avd = new AvdController(root, null, {
          screenW: window.innerWidth,
          screenH: window.innerHeight,
          boxHeight: 0, boxWidth: 0,
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

Cg06AvdNoscriptDisplay.head = {
  title: 'CG 06: AVD DOM bare',
  description: 'AvdController(dom) + 仅 bgKey 的 38 行脚本 + 隐藏对话框',
};
