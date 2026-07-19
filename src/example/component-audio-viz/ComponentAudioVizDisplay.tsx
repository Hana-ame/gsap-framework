import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';

const BAR_COUNT = 64;
const BAR_WIDTH = 6;
const BAR_GAP = 2;

export function ComponentAudioVizDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const totalW = BAR_COUNT * (BAR_WIDTH + BAR_GAP);
      const ox = (window.innerWidth - totalW) / 2;
      const oy = window.innerHeight / 2;

      const phase = new Float32Array(BAR_COUNT);
      const speeds = new Float32Array(BAR_COUNT);
      const heights = new Float32Array(BAR_COUNT);
      const colors = new Uint32Array(BAR_COUNT);

      for (let i = 0; i < BAR_COUNT; i++) {
        phase[i] = Math.random() * Math.PI * 2;
        speeds[i] = 0.8 + Math.random() * 1.5;
        heights[i] = 0;
        const hue = (i / BAR_COUNT) * 360;
        colors[i] = hslToNumber(hue, 0.8, 0.5);
      }

      const bars: PIXI.Graphics[] = [];
      for (let i = 0; i < BAR_COUNT; i++) {
        const g = new PIXI.Graphics();
        g.eventMode = 'none';
        g.x = ox + i * (BAR_WIDTH + BAR_GAP);
        root.stage.addChild(g);
        bars.push(g);
      }

      const title = new PIXI.Text({
        text: 'audio visualizer',
        style: { fontSize: 14, fill: 0x666888, fontFamily: 'monospace' },
      });
      title.x = 12;
      title.y = 12;
      root.stage.addChild(title);

      let time = 0;
      const ticker = proxy.ticker;
      const tickFn = () => {
        time += 0.02;
        for (let i = 0; i < BAR_COUNT; i++) {
          const freq = Math.sin(time * speeds[i] + phase[i]) * 0.5 + 0.5;
          const beat = Math.sin(time * 3) * 0.15 + 0.85;
          const bassBoost = Math.sin(time * 1.2) * 0.2 + 0.8;
          const envelope = 1 - Math.abs(i / BAR_COUNT - 0.5) * 0.6;
          const h = Math.max(4, (freq * beat * bassBoost * envelope) * (oy - 40));
          heights[i] += (h - heights[i]) * 0.12;

          const barH = Math.max(4, heights[i]);
          const g = bars[i];
          g.clear();
          g.rect(0, -barH, BAR_WIDTH, barH).fill({ color: colors[i], alpha: 0.85 });
        }
      };
      ticker.add(tickFn);

      return () => {
        ticker.remove(tickFn);
      };
    });

    return () => stop();
  }, []);

  return null;
}

function hslToNumber(h: number, s: number, l: number): number {
  h /= 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return (Math.round(f(0) * 255) << 16) | (Math.round(f(8) * 255) << 8) | Math.round(f(4) * 255);
}

ComponentAudioVizDisplay.head = {
  title: 'Audio Visualizer',
  description: 'Audio spectrum visualizer with 64 animated bars — sine-wave synthesis, smoothed heights, hue gradient.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
