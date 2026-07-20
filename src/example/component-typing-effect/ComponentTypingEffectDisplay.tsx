// Example: Typing text animation effect
import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, runTextEffect, type SubCanvasProxy, type TextEffectHandle, type TextSegment, type TextEffectType } from '@framework';
import { makeButton, makeInfoPanel } from '@components';
import { gsap } from 'gsap';

const DEMO_TEXTS = [
  'The quick brown fox jumps over the lazy dog.',
  'PIXI.js + GSAP = smooth animations.',
  'SubCanvas provides region-based rendering.',
  'Each SubCanvas has its own coordinate space.',
  'Event routing with proper hit-test claiming.',
  '动画文字效果支持中文显示。',
  'Fade in characters one by one.',
  'Slide in from the left edge.',
  'Scale up with bounce easing.',
  'Typewriter with adjustable speed.',
];

const EFFECT_TYPES = [
  'typewriter',
  'fadeInChars',
  'fadeIn',
  'slideIn',
  'scaleBounce',
  'charRain',
  'scramble',
] as const;

export function ComponentTypingEffectDisplay() {
  const effectRef = useRef<TextEffectHandle | null>(null);

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      makeInfoPanel(root, { title: '打字效果', lines: ['目的：多种文字动画效果，支持跳过和完成状态检测。', '操作：点击效果按钮测试，点击"跳过"立即完成动画，观察"完成"状态变化。', '预期：每个效果正常播放，跳过立刻显示完整文字，completed 属性正确切换。'], x: window.innerWidth - 400, y: window.innerHeight - 150 });

      const panel = root.createRegion(
        { x: 12, y: 12, width: 160, height: window.innerHeight - 24 },
        { dragMode: 'none' },
      );

      const canvas = root.createRegion(
        { x: 180, y: 12, width: window.innerWidth - 192, height: window.innerHeight - 24 },
        { dragMode: 'none' },
      );

      const statusText = new PIXI.Text({
        text: 'completed: false | choose an effect',
        style: { fontSize: 12, fill: 0x556688, fontFamily: 'monospace' },
      });
      statusText.x = 12;
      statusText.y = canvas.bounds.height - 24;
      canvas.stage.addChild(statusText);

      const statusText2 = new PIXI.Text({
        text: 'inline mode: off',
        style: { fontSize: 11, fill: 0x445566, fontFamily: 'monospace' },
      });
      statusText2.x = 12;
      statusText2.y = canvas.bounds.height - 44;
      canvas.stage.addChild(statusText2);

      let inlineMode = false;

      const ctx = {
        text: DEMO_TEXTS[0],
      };

      function makeIconTexture(color: number, shape: 'circle' | 'star' | 'diamond'): PIXI.Texture {
        const g = new PIXI.Graphics();
        const s = 28;
        if (shape === 'circle') {
          g.circle(s / 2, s / 2, s / 2 - 2).fill({ color });
        } else if (shape === 'star') {
          g.star(s / 2, s / 2, 5, s / 2 - 2, (s / 2 - 2) * 0.4).fill({ color });
        } else {
          g.poly([s / 2, 2, s - 2, s / 2, s / 2, s - 2, 2, s / 2]).fill({ color });
        }
        return proxy.renderer.generateTexture(g);
      }

      function buildInlineSegments(): TextSegment[] {
        inlineMode = true;
        statusText2.text = 'inline mode: on';
        return [
          { kind: 'text', text: 'Hello! ' },
          { kind: 'image', texture: makeIconTexture(0xff6688, 'circle'), width: 28, height: 28 },
          { kind: 'text', text: ' This text has ' },
          { kind: 'image', texture: makeIconTexture(0x66ff88, 'star'), width: 28, height: 28 },
          { kind: 'text', text: ' inline images ' },
          { kind: 'image', texture: makeIconTexture(0x6688ff, 'diamond'), width: 28, height: 28 },
          { kind: 'text', text: ' mixed in. 支持中文与图标混排。' },
          { kind: 'image', texture: makeIconTexture(0xffaa44, 'circle'), width: 28, height: 28 },
        ];
      }

      function updateStatus(completed: boolean) {
        const label = inlineMode ? '(inline)' : ctx.text.slice(0, 30);
        statusText.text = `completed: ${completed} | ${label}${!inlineMode && ctx.text.length > 30 ? '…' : ''}`;
      }

      function runEffect(type: string) {
        if (effectRef.current) {
          effectRef.current.destroy();
          effectRef.current = null;
        }

        const textStyle = new PIXI.TextStyle({
          fontSize: 18,
          fill: 0x88aacc,
          fontFamily: 'monospace',
          wordWrap: true,
          wordWrapWidth: canvas.bounds.width - 80,
        });

        let input: string | TextSegment[];
        if (inlineMode) {
          input = buildInlineSegments();
        } else {
          const t = DEMO_TEXTS[Math.floor(Math.random() * DEMO_TEXTS.length)];
          ctx.text = t;
          input = t;
        }

        const handle = runTextEffect({
          parent: canvas.stage,
          text: input,
          textStyle,
          type: type as TextEffectType,
          x: (canvas.bounds.width - Math.min(canvas.bounds.width - 80, 600)) / 2,
          y: canvas.bounds.height / 2 - 20,
          maxWidth: canvas.bounds.width - 80,
          speed: 40,
          duration: 0.8,
        });

        effectRef.current = handle;
        updateStatus(handle.completed);

        const checkId = setInterval(() => {
          if (handle.completed) {
            updateStatus(true);
            clearInterval(checkId);
          }
        }, 100);
      }

      function skipCurrent() {
        if (effectRef.current && !effectRef.current.completed) {
          effectRef.current.skip();
          updateStatus(true);
        }
      }

      let btnY = 4;
      const addBtn = (label: string, color: number, onClick: () => void) => {
        const btn = makeButton(label, 140, 28, onClick, color);
        btn.x = 10;
        btn.y = btnY;
        panel.stage.addChild(btn);
        btnY += 34;
      };

      for (const type of EFFECT_TYPES) {
        addBtn(type, 0x1a1a2e, () => runEffect(type));
      }

      btnY += 6;
      addBtn('inline', 0x2a3a2a, () => {
        inlineMode = !inlineMode;
        statusText2.text = `inline mode: ${inlineMode ? 'on' : 'off'}`;
        runEffect('typewriter');
      });
      addBtn('skip', 0x4a3a1a, skipCurrent);

      runEffect('typewriter');

      return () => {
        if (effectRef.current) effectRef.current.destroy();
        gsap.killTweensOf(canvas.stage.children);
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
