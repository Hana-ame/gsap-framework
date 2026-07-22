import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';
import { AvdController, parseScript } from '../../components';
import { IMAGE_MAP, getTexture, preloadPromise } from '../h-scenes/imageMapEx';

export function StepMc03AvdBareDisplay() {
  const avdRef = useRef<AvdController | null>(null);

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const region = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      preloadPromise.then(() => {
        const keys = Object.keys(IMAGE_MAP);
        const lines = keys.map(k => ({
          speaker: '',
          bgKey: k,
          text: `CG: ${k}`,
        }));

        parseScript({ lines, roster: {} }, {
          loadTexture: async (key: string) => getTexture(key),
        }).then((parsed) => {
          const avd = new AvdController(region.stage, region.ticker, {
            screenW: W, screenH: H,
            boxY: H - 200 - 40,
            portraitY: H - 560 - 20,
            typewriterSpeed: 35,
            onComplete: () => {},
            onLineEnter: () => {},
          });

          avd.setBgTextureMap(Object.fromEntries(keys.map(k => [k, getTexture(k)])));
          avd.setScript(parsed.lines);
          avdRef.current = avd;
        });
      });
    });

    return () => { avdRef.current?.destroy(); stop(); };
  }, []);

  return null;
}

StepMc03AvdBareDisplay.head = {
  title: 'MC Step 03: AVD Bare',
  description: 'ex.moonchan.xyz + AVD + setBgTextureMap',
};
