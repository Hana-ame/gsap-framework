import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, gsap, makeButton, type SubCanvasProxy } from '../../framework';

type Mode = 'rain' | 'snow' | 'fireflies' | 'confetti';

const MODE_COLORS: Record<Mode, number> = {
  rain: 0x6688cc,
  snow: 0xffffff,
  fireflies: 0xffee88,
  confetti: 0x88ff88,
};

const PARTICLE_COUNT = 60;
const SPAWN_INTERVAL = 80;
const POOL_SIZE = 80;

export function ComponentParticleRainDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const panel = root.createRegion(
        { x: 12, y: 12, width: 160, height: window.innerHeight - 24 },
        { dragMode: 'none' },
      );

      const canvas = root.createRegion(
        { x: 180, y: 12, width: window.innerWidth - 192, height: window.innerHeight - 24 },
        { dragMode: 'none' },
      );

      let currentMode: Mode = 'rain';

      const particles: PIXI.Graphics[] = [];
      for (let i = 0; i < POOL_SIZE; i++) {
        const p = new PIXI.Graphics();
        p.eventMode = 'none';
        p.visible = false;
        canvas.stage.addChild(p);
        particles.push(p);
      }

      const tweens: Map<PIXI.Graphics, gsap.core.Tween> = new Map();

      function spawnParticle() {
        if (!canvas || canvas.destroyed) return;
        const p = particles.find((x) => !x.visible);
        if (!p) return;

        const W = canvas.bounds.width;
        const H = canvas.bounds.height;
        p.clear();
        p.alpha = 1;
        p.scale.set(1);
        p.rotation = 0;

        switch (currentMode) {
          case 'rain': {
            const size = 1 + Math.random() * 2;
            p.circle(0, 0, size).fill({ color: 0x6688cc, alpha: 0.4 + Math.random() * 0.4 });
            const x = Math.random() * W;
            const y = -10 - Math.random() * 20;
            p.x = x;
            p.y = y;
            p.visible = true;
            const t = gsap.to(p, {
              y: H + 10,
              x: x + (Math.random() - 0.5) * 60,
              duration: 0.6 + Math.random() * 0.4,
              ease: 'none',
              onComplete: () => { p.visible = false; tweens.delete(p); },
            });
            tweens.set(p, t);
            break;
          }
          case 'snow': {
            const size = 1.5 + Math.random() * 3;
            p.circle(0, 0, size).fill({ color: 0xffffff, alpha: 0.5 + Math.random() * 0.4 });
            p.x = Math.random() * W;
            p.y = -10 - Math.random() * 30;
            p.visible = true;
            const drift = gsap.to(p, {
              x: p.x + (Math.random() - 0.5) * 120,
              duration: 1.5 + Math.random() * 1,
              yoyo: true,
              repeat: -1,
              ease: 'sine.inOut',
            });
            const fall = gsap.to(p, {
              y: H + 10,
              duration: 3 + Math.random() * 3,
              ease: 'none',
              onComplete: () => {
                p.visible = false;
                drift.kill();
                tweens.delete(p);
              },
            });
            tweens.set(p, fall);
            break;
          }
          case 'fireflies': {
            const size = 1.5 + Math.random() * 2;
            p.circle(0, 0, size).fill({ color: 0xffee88, alpha: 0.9 });
            p.x = Math.random() * W;
            p.y = Math.random() * H;
            p.visible = true;
            const glow = gsap.to(p, {
              pixi: { alpha: 0.2 },
              duration: 0.8 + Math.random() * 0.8,
              yoyo: true,
              repeat: -1,
              ease: 'sine.inOut',
            });
            const driftX = gsap.to(p, {
              x: p.x + (Math.random() - 0.5) * 100,
              duration: 2 + Math.random() * 2,
              yoyo: true,
              repeat: -1,
              ease: 'sine.inOut',
            });
            const driftY = gsap.to(p, {
              y: p.y + (Math.random() - 0.5) * 80,
              duration: 2 + Math.random() * 2,
              yoyo: true,
              repeat: -1,
              ease: 'sine.inOut',
            });
            const life = gsap.delayedCall(3 + Math.random() * 4, () => {
              p.visible = false;
              glow.kill();
              driftX.kill();
              driftY.kill();
              tweens.delete(p);
            });
            tweens.set(p, life);
            break;
          }
          case 'confetti': {
            const colors = [0xff4488, 0x44ff88, 0x4488ff, 0xffaa44, 0xff44ff, 0x44ffff];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 3 + Math.random() * 4;
            p.rect(-size / 2, -size / 4, size, size / 2).fill({ color, alpha: 0.8 });
            p.x = Math.random() * W;
            p.y = -10 - Math.random() * 40;
            p.visible = true;
            const spin = gsap.to(p, {
              rotation: Math.PI * (Math.random() > 0.5 ? 4 : -4),
              duration: 1 + Math.random(),
              ease: 'none',
            });
            const fall = gsap.to(p, {
              y: H + 10,
              x: p.x + (Math.random() - 0.5) * 80,
              duration: 2 + Math.random() * 2,
              ease: 'none',
              onComplete: () => {
                p.visible = false;
                spin.kill();
                tweens.delete(p);
              },
            });
            tweens.set(p, fall);
            break;
          }
        }
      }

      let spawnTimer: ReturnType<typeof setInterval> | null = null;

      function startSpawn() {
        stopSpawn();
        spawnTimer = setInterval(spawnParticle, SPAWN_INTERVAL);
        for (let i = 0; i < PARTICLE_COUNT / 2; i++) setTimeout(spawnParticle, i * 30);
      }

      function stopSpawn() {
        if (spawnTimer) {
          clearInterval(spawnTimer);
          spawnTimer = null;
        }
      }

      function switchMode(mode: Mode) {
        currentMode = mode;
        for (const [p] of tweens) {
          gsap.killTweensOf(p);
          p.visible = false;
        }
        tweens.clear();
        startSpawn();
      }

      let y = 4;
      const modes: Mode[] = ['rain', 'snow', 'fireflies', 'confetti'];
      for (const mode of modes) {
        const btn = makeButton(mode, 140, 28, () => switchMode(mode), MODE_COLORS[mode]);
        btn.x = 10;
        btn.y = y;
        panel.stage.addChild(btn);
        y += 34;
      }

      const title = new PIXI.Text({
        text: currentMode,
        style: { fontSize: 16, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      title.x = 12;
      title.y = 12;
      canvas.stage.addChild(title);

      startSpawn();

      return () => {
        stopSpawn();
        for (const [, t] of tweens) t.kill();
        tweens.clear();
      };
    });

    return () => stop();
  }, []);

  return null;
}

ComponentParticleRainDisplay.head = {
  title: 'Particle Rain',
  description: 'Particle effects system — rain, snow, fireflies, confetti. GSAP-driven animations with object pooling.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
