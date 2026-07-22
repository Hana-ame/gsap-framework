import type { AvdLine } from '../../../avd/types';
import { AvdController, parseScript } from '../../../components';
import type { AvdLineJSON, AvdAssetResolver } from '../../../components';
import { DomTexture } from '../../../avd/dom/DomNode';
import { IMAGE_MAP } from './imageMapEx';

export interface DomSceneOptions {
  el: HTMLElement;
  title: string;
  lines: AvdLineJSON[];
  getBgKeys: () => string[];
}

export async function mountDomScene(opts: DomSceneOptions): Promise<() => void> {
  const { el, lines, getBgKeys } = opts;

  const W = window.innerWidth;
  const H = window.innerHeight;

  const bgKeys = getBgKeys();
  const uniqueKeys = [...new Set(bgKeys)];

  const textures: Record<string, DomTexture> = {};
  for (const k of uniqueKeys) {
    const url = IMAGE_MAP[k];
    if (url) textures[k] = new DomTexture(url);
  }

  await Promise.allSettled(
    uniqueKeys.map(k => new Promise<void>(resolve => {
      const t = textures[k];
      if (!t || t.loaded) { resolve(); return; }
      const check = () => { if (t.loaded) resolve(); else requestAnimationFrame(check); };
      check();
    }))
  );

  const parsed = await parseScript({ lines, roster: {} }, {
    loadTexture: async () => undefined,
  } as AvdAssetResolver);

  const avd = new AvdController(el, null, {
    screenW: W, screenH: H,
    boxY: H - 200 - 40,
    portraitY: H - 560 - 20,
    boxBg: 0x0a0a14,
    boxBgAlpha: 0.5,
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

  avd.setBgTextureMap(textures);
  avd.setScript(parsed.lines as AvdLine[]);

  return () => { avd.destroy(); };
}
