import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';
import { AvdController, parseScript } from '../../components';
import { getTexture, makeResolver, preloadPromise } from '../h-scenes/imageMap';
import { HD2_LINES } from '../h-scenes/HD2Script';

export function StepHd204AvdFullDisplay() {
  const avdRef = useRef<AvdController | null>(null);

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const region = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const bgGradient = new PIXI.Graphics();
      const steps = 64;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const r = Math.round(0x1a * (1 - t) + 0x08 * t);
        const g = Math.round(0x12 * (1 - t) + 0x08 * t);
        const b = Math.round(0x3a * (1 - t) + 0x18 * t);
        bgGradient
          .rect(0, (H / steps) * i, W, Math.ceil(H / steps) + 1)
          .fill({ color: (r << 16) | (g << 8) | b });
      }
      region.stage.addChild(bgGradient);

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

StepHd204AvdFullDisplay.head = {
  title: 'HD2 Step 04: AVD Full',
  description: 'AVD + 渐层背景 + setBgTextureMap + cover 模式',
};
