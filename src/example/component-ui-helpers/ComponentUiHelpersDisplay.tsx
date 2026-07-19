import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, makeButton, makeStepper, makeInfoPanel, textPresets, type SubCanvasProxy, type Stepper } from '../../framework';

export function ComponentUiHelpersDisplay() {
  const steppersRef = useRef<Stepper[]>([]);
  const labelRef = useRef<PIXI.Text | null>(null);

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const sc = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      makeInfoPanel(sc, {
        title: 'UI 辅助工具',
        lines: [
          '用途：演示 makeButton()、makeStepper() 和 textPresets 样式预设。',
          '测试方法：点击按钮查看"已点击："更新，调整步进器改变预览框。',
          '预期：按钮显示不同颜色，步进器实时改变预览尺寸/速度/亮度，所有 textPresets 预设正确渲染。',
        ],
        x: window.innerWidth - 400,
        y: window.innerHeight - 150,
      });

      const content = new PIXI.Container();
      sc.stage.addChild(content);

      let y = 0;

      const mkHeader = (text: string) => {
        const t = new PIXI.Text({ text, style: textPresets.heading });
        t.x = 0;
        t.y = y;
        t.eventMode = 'none';
        content.addChild(t);
        y += 24;
      };

      mkHeader('textPresets');
      (Object.entries(textPresets) as [string, PIXI.TextStyle][]).forEach(([name, style]) => {
        const t = new PIXI.Text({
          text: `textPresets.${name}  —  The quick brown fox jumps over the lazy dog`,
          style: { ...style, fill: style.fill as number || 0xffffff },
        });
        t.x = 16;
        t.y = y;
        t.eventMode = 'none';
        content.addChild(t);
        y += 20;
      });

      y += 20;
      mkHeader('makeButton');
      let btnX = 0;
      const addBtn = (label: string, bg: number) => {
        const btn = makeButton(label, 110, 30, () => {
          const t = labelRef.current;
          if (t) t.text = `clicked: ${label}`;
        }, bg);
        btn.x = btnX;
        btn.y = y;
        content.addChild(btn);
        btnX += 120;
      };
      addBtn('Primary', 0x2a4a7a);
      addBtn('Success', 0x2a5a3a);
      addBtn('Danger', 0x5a2a2a);
      addBtn('Ghost', 0x1a1a2e);
      y += 40;

      const clickLabel = new PIXI.Text({ text: 'clicked: —', style: textPresets.label });
      clickLabel.x = 0;
      clickLabel.y = y;
      clickLabel.eventMode = 'none';
      content.addChild(clickLabel);
      labelRef.current = clickLabel;
      y += 30;

      mkHeader('makeStepper');
      let size = 50;
      let speed = 3;
      let brightness = 128;

      const drawPreview = () => {
        const g = new PIXI.Graphics();
        g.clear();
        g.roundRect(0, 0, size, size, 6)
          .fill({ color: (brightness << 16) | (brightness << 8) | brightness, alpha: speed * 0.1 })
          .stroke({ width: 1, color: 0x446 });
        return g;
      };

      let preview = drawPreview();
      preview.x = 560;
      preview.y = y - 60;
      content.addChild(preview);

      const refreshPreview = () => {
        preview.removeFromParent();
        preview.destroy();
        preview = drawPreview();
        preview.x = 560;
        preview.y = y - 60;
        content.addChild(preview);
      };

      const s1 = makeStepper({ label: 'size  ', getValue: () => size, onChange: (v) => { size = v; refreshPreview(); }, min: 10, max: 150, step: 10 });
      s1.container.x = 0;
      s1.container.y = y;
      content.addChild(s1.container);
      steppersRef.current.push(s1);

      const s2 = makeStepper({ label: 'speed ', getValue: () => speed, onChange: (v) => { speed = v; refreshPreview(); }, min: 1, max: 10 });
      s2.container.x = s1.width + 20;
      s2.container.y = y;
      content.addChild(s2.container);
      steppersRef.current.push(s2);

      const s3 = makeStepper({ label: 'bright', getValue: () => brightness, onChange: (v) => { brightness = v; refreshPreview(); }, min: 0, max: 255, step: 10 });
      s3.container.x = s1.width + 20 + s2.width + 20;
      s3.container.y = y;
      content.addChild(s3.container);
      steppersRef.current.push(s3);

      y += 60;

      const code = new PIXI.Text({
        text: [
          'import { makeButton, makeStepper, textPresets } from \'../../framework\';',
          '',
          'const btn = makeButton(label, w, h, onClick, bgColor?);',
          'const stepper = makeStepper({ label, getValue, onChange, min, max });',
          '  // returns { container, width, refresh }',
          '',
          'textPresets.btn     — button text style',
          'textPresets.label   — label text style',
          'textPresets.dim     — dim text style',
          'textPresets.coord   — coordinate text style',
          'textPresets.heading — heading text style',
        ].join('\n'),
        style: { fontSize: 11, fill: 0x666688, fontFamily: 'monospace', lineHeight: 18 },
      });
      code.x = 0;
      code.y = y + 10;
      code.eventMode = 'none';
      content.addChild(code);

      const center = () => {
        const b = content.getLocalBounds();
        content.pivot.set(b.x, b.y);
        content.x = Math.max(20, (window.innerWidth - b.width) / 2);
        content.y = Math.max(20, (window.innerHeight - b.height) / 2);
      };
      center();
      const onResize = () => center();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    });
    return stop;
    return stop;
  }, []);

  return null;
}

ComponentUiHelpersDisplay.head = {
  title: 'Component: UI Helpers',
  description: 'makeButton, makeStepper, textPresets style presets — reusable UI building blocks.',
};
