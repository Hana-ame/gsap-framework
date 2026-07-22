import type { AvdLine } from '../../avd/types';
import { AvdController, parseScript } from '../../components';
import { DomTexture } from '../../avd/dom/DomNode';

export interface DomSceneOptions {
  el: HTMLElement;
  title?: string;
  lines: any[];
  getBgKeys?: () => string[];
  imageMap?: Record<string, string>;
}

export async function mountDomScene(opts: DomSceneOptions): Promise<() => void> {
  const { el, lines, imageMap } = opts;

  const W = window.innerWidth;
  const H = window.innerHeight;

  const parsed = await parseScript({ lines, roster: {} }, {
    loadTexture: async () => {},
  } as any);

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

  avd.setBgLazyLoad(async (key) => {
    const url = imageMap ? imageMap[key] : `/game-cgs/${key}.png`;
    if (!url) return null;
    const tex = new DomTexture(url);
    if (!tex.loaded) {
      await new Promise<void>(resolve => {
        const check = () => { if (tex.loaded) resolve(); else requestAnimationFrame(check); };
        check();
      });
    }
    return tex;
  });
  avd.setBgTextureMap({});
  avd.setScript(parsed.lines as AvdLine[]);

  return () => { avd.destroy(); };
}
