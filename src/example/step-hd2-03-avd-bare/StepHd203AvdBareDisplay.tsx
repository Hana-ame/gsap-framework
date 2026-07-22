import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';
import { AvdController, parseScript } from '../../components';
import { getTexture, makeResolver, preloadPromise } from '../h-scenes/imageMap';
import { HD2_LINES } from '../h-scenes/HD2Script';

export function StepHd203AvdBareDisplay() {
  const avdRef = useRef<AvdController | null>(null);

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const region = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const allBgKeys = HD2_LINES.filter(l => l.bgKey).map(l => l.bgKey!);

      preloadPromise.then(() => parseScript({ lines: HD2_LINES, roster: {} }, makeResolver()))
        .then((parsed) => {
          const avd = new AvdController(region.stage, region.ticker, {
            screenW: W, screenH: H,
            boxY: H - 200 - 40,
            portraitY: H - 560 - 20,
            typewriterSpeed: 35,
            onComplete: () => {},
            onLineEnter: () => {},
          });

          avd.setBgTextureMap(Object.fromEntries(allBgKeys.map(k => [k, getTexture(k)])));
          avd.setScript(parsed.lines);
          avdRef.current = avd;
        });
    });

    return () => { avdRef.current?.destroy(); stop(); };
  }, []);

  return null;
}

StepHd203AvdBareDisplay.head = {
  title: 'HD2 Step 03: AVD Bare',
  description: 'AVD + setBgTextureMap + cover 模式',
};
