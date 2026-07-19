import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, makeButton, makeInfoPanel, type SubCanvas, type SubCanvasProxy } from '@framework';
import { gsap } from 'gsap';

export function ComponentGsapDisplay() {
  useEffect(() => {
    let box: PIXI.Graphics | null = null;
    let tween: gsap.core.Tween | gsap.core.Timeline | null = null;

    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      makeInfoPanel(root, { title: 'GSAP 动画', lines: ['GSAP 动画演示——位置、缩放、旋转、透明度、时间线、缓动效果。', '点击左侧面板的按钮触发蓝色方块的不同动画。', '方块根据按钮描述平滑动画。时间线演示串联多个动画。终止全部停止所有动画。重置恢复初始状态。'], x: window.innerWidth - 400, y: window.innerHeight - 150 });

      const panel = root.createRegion(
        { x: 12, y: 12, width: 190, height: window.innerHeight - 24 },
        { dragMode: 'none' },
      );

      const canvas = root.createRegion(
        { x: 210, y: 12, width: window.innerWidth - 222, height: window.innerHeight - 24 },
        { dragMode: 'none' },
      );

      box = new PIXI.Graphics();
      box.eventMode = 'none';
      box.x = 200;
      box.y = 200;
      canvas.stage.addChild(box);

      let y = 4;
      const addBtn = (label: string, onClick: () => void) => {
        const btn = makeButton(label, 170, 28, onClick, 0x1a1a2e);
        btn.x = 10;
        btn.y = y;
        panel.stage.addChild(btn);
        y += 34;
      };

      const drawBox = (color: number) => {
        box?.clear().roundRect(-40, -40, 80, 80, 8).fill({ color });
      };
      drawBox(0x4488ff);

      addBtn('→ x: 400', () => {
        tween?.kill();
        tween = gsap.to(box, { pixi: { x: 400 }, duration: 0.6, ease: 'power2.out' });
      });
      addBtn('← x: 200', () => {
        tween?.kill();
        tween = gsap.to(box, { pixi: { x: 200 }, duration: 0.6, ease: 'power2.out' });
      });
      addBtn('scale 1.5', () => {
        tween?.kill();
        tween = gsap.to(box.scale, { x: 1.5, y: 1.5, duration: 0.4, ease: 'back.out(2)' });
      });
      addBtn('scale 0.5', () => {
        tween?.kill();
        tween = gsap.to(box.scale, { x: 0.5, y: 0.5, duration: 0.4, ease: 'back.out(2)' });
      });
      addBtn('spin 360°', () => {
        tween?.kill();
        tween = gsap.to(box, { rotation: `+=${Math.PI * 2}`, duration: 0.8, ease: 'power4.out' });
      });
      addBtn('fade out', () => {
        tween?.kill();
        tween = gsap.to(box, { pixi: { alpha: 0.2 }, duration: 0.5, ease: 'power2.out' });
      });
      addBtn('fade in', () => {
        tween?.kill();
        tween = gsap.to(box, { pixi: { alpha: 1 }, duration: 0.5, ease: 'power2.out' });
      });
      addBtn('bounce', () => {
        tween?.kill();
        const tl = gsap.timeline();
        tl.to(box, { pixi: { y: 400 }, duration: 0.5, ease: 'power2.in' });
        tl.to(box, { pixi: { y: 200 }, duration: 0.6, ease: 'bounce.out' });
        tween = tl;
      });
      addBtn('color pulse', () => {
        if (box) {
          gsap.to(box, {
            pixi: { tint: 0xff4488 },
            duration: 0.3,
            yoyo: true,
            repeat: 3,
            ease: 'power1.inOut',
          });
        }
      });
      addBtn('kill all', () => {
        if (box) gsap.killTweensOf(box);
        gsap.killTweensOf(box?.scale);
      });
      addBtn('reset', () => {
        gsap.killTweensOf(box!);
        gsap.killTweensOf(box!.scale);
        box!.x = 200;
        box!.y = 200;
        box!.scale.set(1);
        box!.rotation = 0;
        box!.alpha = 1;
        drawBox(0x4488ff);
      });

      addBtn('timeline demo', () => {
        tween?.kill();
        const tl = gsap.timeline();
        tl.to(box, { pixi: { x: 400, scale: 1.3 }, duration: 0.4, ease: 'power2.out' });
        tl.to(box, { rotation: Math.PI, duration: 0.3, ease: 'power2.out' });
        tl.to(box, { pixi: { x: 200, y: 300, scale: 0.7 }, duration: 0.4, ease: 'power2.out' });
        tl.to(box, { rotation: 0, pixi: { scale: 1 }, duration: 0.3, ease: 'back.out(2)' });
        tl.to(box, { pixi: { y: 200 }, duration: 0.3, ease: 'power2.out' });
        tween = tl;
      });
    });

    return () => {
      if (box) gsap.killTweensOf(box);
      stop();
    };
  }, []);

  return (
    <div className="gsap-hint">
      <style>{css}</style>
      GSAP · click buttons to animate the blue box
    </div>
  );
}

const css = `
.gsap-hint {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 100;
  background: rgba(10,10,20,0.8);
  border: 1px solid #2a2a3a;
  border-radius: 8px;
  padding: 8px 14px;
  font-family: monospace;
  font-size: 0.75rem;
  color: #88aaff;
}
`;

ComponentGsapDisplay.head = {
  title: 'GSAP Showcase',
  description: 'Animate PIXI objects with GSAP — position, scale, rotation, alpha, timeline, easings.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
