import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, makeButton, type SubCanvasProxy } from '../../framework';

const ROWS = 12;
const COLS = 20;
const SPEED = 2;
const AMPLITUDE = 30;

const PALETTE_TOP = [0x4488ff, 0x44aaff, 0x44ccff, 0x44ddff];
const PALETTE_BOTTOM = [0x004488, 0x0066aa, 0x0088cc, 0x00aadd];

export function ComponentWavesDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const W = window.innerWidth;
      const H = window.innerHeight;
      const cellW = Math.ceil(W / COLS);
      const cellH = Math.ceil(H / ROWS);
      const cols = Math.ceil(W / cellW);
      const rows = Math.ceil(H / cellH);

      const phases = new Float32Array(cols * rows);
      const speeds = new Float32Array(cols * rows);
      for (let i = 0; i < phases.length; i++) {
        phases[i] = Math.random() * Math.PI * 2;
        speeds[i] = 0.3 + Math.random() * 0.7;
      }

      const grid = new PIXI.Graphics();
      grid.eventMode = 'none';
      root.stage.addChild(grid);

      const dots: PIXI.Graphics[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dot = new PIXI.Graphics();
          dot.eventMode = 'none';
          root.stage.addChild(dot);
          dots.push(dot);
        }
      }

      const title = new PIXI.Text({
        text: 'waves',
        style: { fontSize: 14, fill: 0x666888, fontFamily: 'monospace' },
      });
      title.x = 12;
      title.y = 12;
      root.stage.addChild(title);

      let mouseX = W / 2;
      let mouseY = H / 2;
      const ripples: { x: number; y: number; t: number }[] = [];

      root.onMove((e) => {
        mouseX = e.x;
        mouseY = e.y;
      });

      root.onPress((e) => {
        ripples.push({ x: e.x, y: e.y, t: 0 });
      });

      const ticker = proxy.ticker;

      function drawWavyGrid() {
        grid.clear();
        const t = performance.now() / 1000;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const i = r * cols + c;
            const cx = c * cellW + cellW / 2;
            const cy = r * cellH + cellH / 2;

            const dist = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);
            const mouseWave = Math.sin(dist * 0.03 - t * 2) * 8 / (1 + dist * 0.01);

            let rippleWave = 0;
            for (const rip of ripples) {
              const rd = Math.sqrt((rip.x - cx) ** 2 + (rip.y - cy) ** 2);
              rippleWave += Math.sin(rd * 0.05 - rip.t * 5) * 10 * Math.max(0, 1 - rip.t / 3);
            }

            const phase = phases[i];
            const speed = speeds[i];
            const wave = Math.sin(c * 0.4 + r * 0.3 + t * speed + phase) * AMPLITUDE;
            const totalWave = wave + mouseWave + rippleWave;

            const xOff = totalWave * 0.3;
            const yOff = totalWave * 0.2;

            grid.circle(cx + xOff, cy + yOff, 1.5).fill({ color: 0x4488cc, alpha: 0.3 + Math.sin(t + phase) * 0.15 + 0.15 });
          }
        }
      }

      function drawDots() {
        const t = performance.now() / 1000;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const i = r * cols + c;
            const cx = c * cellW + cellW / 2;
            const cy = r * cellH + cellH / 2;

            const dist = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);
            const mouseWave = Math.sin(dist * 0.03 - t * 2) * 8 / (1 + dist * 0.01);

            let rippleWave = 0;
            for (const rip of ripples) {
              const rd = Math.sqrt((rip.x - cx) ** 2 + (rip.y - cy) ** 2);
              rippleWave += Math.sin(rd * 0.05 - rip.t * 5) * 10 * Math.max(0, 1 - rip.t / 3);
            }

            const phase = phases[i];
            const speed = speeds[i];
            const wave = Math.sin(c * 0.4 + r * 0.3 + t * speed + phase) * AMPLITUDE;
            const totalWave = wave + mouseWave + rippleWave;

            const xOff = totalWave * 0.3;
            const yOff = totalWave * 0.2;

            const dot = dots[i];
            dot.clear();
            const size = 1.5 + Math.sin(t + phase + c * 0.2 + r * 0.2) * 1 + 1;
            dot.circle(cx + xOff, cy + yOff, size).fill({ color: 0x88ccff, alpha: 0.3 + Math.sin(t * 0.5 + phase) * 0.2 + 0.2 });
          }
        }
      }

      let mode: 'grid' | 'dots' | 'both' = 'both';
      let y = 4;
      const modes = ['grid', 'dots', 'both'];
      for (const m of modes) {
        const btn = makeButton(m, 140, 28, () => { mode = m as typeof mode; }, 0x1a1a2e);
        btn.x = 10;
        btn.y = y;
        root.stage.addChild(btn);
        y += 34;
      }

      const tickFn = () => {
        grid.clear();
        for (const rip of ripples) rip.t += 0.016;
        for (let i = ripples.length - 1; i >= 0; i--) {
          if (ripples[i].t > 3) ripples.splice(i, 1);
        }
        for (const dot of dots) dot.clear();

        if (mode === 'grid' || mode === 'both') drawWavyGrid();
        if (mode === 'dots' || mode === 'both') drawDots();
      };
      ticker.add(tickFn);

      return () => { ticker.remove(tickFn); };
    });

    return () => stop();
  }, []);

  return null;
}

ComponentWavesDisplay.head = {
  title: 'Waves',
  description: 'Interactive wave visualization — mouse disturbance, click ripples, animated grid + dots, multiple display modes.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
