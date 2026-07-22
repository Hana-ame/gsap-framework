import { useEffect, useRef } from 'react';
import { AvdController } from '../../components';
import type { AvdLine } from '../../avd/types';
import { DomTexture } from '../../avd/dom/DomNode';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';

const KEYS = Object.keys(IMAGE_MAP);

export function StepMc09DomAvdDisplay() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    const textures: Record<string, DomTexture> = {};
    for (const k of KEYS) {
      textures[k] = new DomTexture(IMAGE_MAP[k]);
    }

    // wait for all images to load before starting the AVD
    Promise.allSettled(KEYS.map(k => new Promise<void>(resolve => {
      if (textures[k].loaded) { resolve(); return; }
      const check = () => { if (textures[k].loaded) resolve(); else requestAnimationFrame(check); };
      check();
    }))).then(() => {
      const avd = new AvdController(el, null, {
        screenW: W, screenH: H,
        boxY: H - 200 - 40,
        portraitY: H - 560 - 20,
        boxBg: 0x0a0a14,
        boxBgAlpha: 1,
        boxRadius: 0,
        textColor: 0xffffff,
        nameColor: 0x88ccff,
        textSize: 20,
        nameSize: 16,
        fontFamily: '"Noto Serif SC", "STSong", serif',
        typewriterSpeed: 35,
        onComplete: () => {},
        onLineEnter: () => {},
      }, 'dom');

      avd.setBgTextureMap(textures as any);

      const lines: AvdLine[] = KEYS.map((k, i) => ({
        speaker: '',
        text: `CG: ${k}  (${i + 1}/${KEYS.length})`,
        bgKey: k,
      }));

      avd.setScript(lines);
    });
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}

StepMc09DomAvdDisplay.head = {
  title: 'MC Step 09: DOM AVD',
  description: '純 DOM AvdController + DomTexture 绕过 CORS · ex.moonchan.xyz',
};
