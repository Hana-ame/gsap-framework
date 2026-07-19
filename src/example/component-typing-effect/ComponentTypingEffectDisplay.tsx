import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, gsap, makeButton, type SubCanvasProxy } from '../../framework';

const DEMO_TEXTS = [
  'The quick brown fox jumps over the lazy dog.',
  'PIXI.js + GSAP = smooth animations.',
  'SubCanvas provides region-based rendering.',
  'Each SubCanvas has its own coordinate space.',
  'Event routing with proper hit-test claiming.',
  'Infinite canvas with chunked lazy loading.',
  'Typewriter effect with variable speed.',
  'Fade in characters one by one.',
  'Slide in from the left edge.',
  'Scale up with bounce easing.',
];

export function ComponentTypingEffectDisplay() {
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

      const cx = canvas.bounds.width / 2;
      const cy = canvas.bounds.height / 2;

      const display = new PIXI.Text({
        text: '',
        style: { fontSize: 18, fill: 0x88aacc, fontFamily: 'monospace', wordWrap: true, wordWrapWidth: canvas.bounds.width - 80 },
      });
      display.anchor.set(0.5);
      display.x = cx;
      display.y = cy;
      canvas.stage.addChild(display);

      const info = new PIXI.Text({
        text: 'choose an effect',
        style: { fontSize: 12, fill: 0x556688, fontFamily: 'monospace' },
      });
      info.x = 12;
      info.y = canvas.bounds.height - 24;
      canvas.stage.addChild(info);

      function typewriter(text: string, speed: number = 40) {
        gsap.killTweensOf(display);
        display.text = '';
        display.alpha = 1;
        display.scale.set(1);
        display.x = cx;
        display.y = cy;
        let i = 0;
        const chars = text.split('');
        const tl = gsap.timeline();
        for (const ch of chars) {
          tl.call(() => { display.text += ch; }, undefined, i * speed / 1000);
          i++;
        }
        info.text = `typewriter · ${chars.length} chars · ${(chars.length * speed / 1000).toFixed(1)}s`;
      }

      function fadeIn(text: string) {
        gsap.killTweensOf(display);
        display.text = text;
        display.scale.set(1);
        display.x = cx;
        display.y = cy;
        display.alpha = 0;
        gsap.to(display, { pixi: { alpha: 1 }, duration: 1.2, ease: 'power2.out' });
        info.text = 'fade in';
      }

      function slideIn(text: string) {
        gsap.killTweensOf(display);
        display.text = text;
        display.alpha = 1;
        display.scale.set(1);
        display.x = -canvas.bounds.width;
        display.y = cy;
        gsap.to(display, { pixi: { x: cx }, duration: 0.8, ease: 'power3.out' });
        info.text = 'slide in';
      }

      function scaleBounce(text: string) {
        gsap.killTweensOf(display);
        display.text = text;
        display.alpha = 1;
        display.scale.set(0);
        display.x = cx;
        display.y = cy;
        gsap.to(display.scale, { x: 1, y: 1, duration: 0.7, ease: 'back.out(3)' });
        info.text = 'scale bounce';
      }

      function charRain(text: string) {
        gsap.killTweensOf(display);
        display.text = '';
        display.alpha = 1;
        display.scale.set(1);
        display.x = cx;
        display.y = cy;

        const container = new PIXI.Container();
        container.eventMode = 'none';
        canvas.stage.addChild(container);

        const chars = text.split('');
        const totalW = chars.length * 12;
        const startX = cx - totalW / 2;

        for (let i = 0; i < chars.length; i++) {
          const ch = new PIXI.Text({
            text: chars[i],
            style: { fontSize: 18, fill: 0x88aacc, fontFamily: 'monospace' },
          });
          ch.anchor.set(0.5);
          ch.x = startX + i * 12;
          ch.y = -20 - Math.random() * 100;
          ch.alpha = 0;
          container.addChild(ch);
          gsap.to(ch, {
            y: cy,
            alpha: 1,
            duration: 0.5 + Math.random() * 0.4,
            delay: i * 0.04,
            ease: 'bounce.out',
          });
        }

        gsap.delayedCall(chars.length * 0.04 + 0.7, () => {
          container.removeFromParent();
          container.destroy({ children: true });
          display.text = text;
        });
        info.text = 'char rain';
      }

      function scrambleEffect(text: string) {
        gsap.killTweensOf(display);
        display.text = '';
        display.alpha = 1;
        display.scale.set(1);
        display.x = cx;
        display.y = cy;

        const chars = text.split('');
        const current = new Array(chars.length).fill('');
        let pos = 0;

        const tl = gsap.timeline();
        for (let i = 0; i < chars.length; i++) {
          const scrambleCount = 2 + Math.floor(Math.random() * 3);
          for (let s = 0; s < scrambleCount; s++) {
            const scrambleChar = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)];
            tl.call(() => {
              current[pos] = scrambleChar;
              display.text = current.join('');
            }, undefined, (i * 0.08 + s * 0.03));
          }
          tl.call(() => {
            current[pos] = chars[pos];
            display.text = current.join('');
            pos++;
          }, undefined, (i * 0.08 + scrambleCount * 0.03));
        }
        info.text = 'scramble effect';
      }

      let y = 4;
      const effects = [
        ['typewriter', () => { const t = DEMO_TEXTS[Math.floor(Math.random() * DEMO_TEXTS.length)]; typewriter(t, 30 + Math.random() * 40); }],
        ['fade in', () => fadeIn(DEMO_TEXTS[Math.floor(Math.random() * DEMO_TEXTS.length)])],
        ['slide in', () => slideIn(DEMO_TEXTS[Math.floor(Math.random() * DEMO_TEXTS.length)])],
        ['scale bounce', () => scaleBounce(DEMO_TEXTS[Math.floor(Math.random() * DEMO_TEXTS.length)])],
        ['char rain', () => charRain(DEMO_TEXTS[Math.floor(Math.random() * DEMO_TEXTS.length)])],
        ['scramble', () => scrambleEffect(DEMO_TEXTS[Math.floor(Math.random() * DEMO_TEXTS.length)])],
      ];

      for (const [label, fn] of effects) {
        const btn = makeButton(label as string, 140, 28, fn as () => void, 0x1a1a2e);
        btn.x = 10;
        btn.y = y;
        panel.stage.addChild(btn);
        y += 34;
      }

      typewriter(DEMO_TEXTS[0]);

      return () => {
        gsap.killTweensOf(display);
      };
    });

    return () => stop();
  }, []);

  return null;
}

ComponentTypingEffectDisplay.head = {
  title: 'Typing Effects',
  description: 'Text animation showcase — typewriter, fade in, slide in, scale bounce, char rain, scramble. GSAP-powered.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
