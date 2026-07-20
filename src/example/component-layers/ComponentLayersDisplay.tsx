// Example: Multi-layer rendering with independent Layer components
import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, LayerManager, type SubCanvasProxy, type Layer } from '@framework';
import { makeButton, makeInfoPanel } from '@components';
import { gsap } from 'gsap';

const COLORS = [0x4488ff, 0xff4488, 0x44ff88, 0xffaa44, 0xaa44ff, 0x44ccff];
const NAMES = ['bg', 'game', 'ui', 'overlay', 'fx', 'debug'];

export function ComponentLayersDisplay() {
  const mgrRef = useRef<LayerManager | null>(null);

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const sc = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      makeInfoPanel(sc, {
        title: '图层管理器',
        lines: [
          '用途：命名的 z 排序图层——显示/隐藏、透明度切换、置顶。',
          '测试方法：点击图层名称按钮切换可见性，点击 α 按钮调暗，点击"置顶"循环置顶图层，点击"重置 z"恢复顺序。',
          '预期：切换图层隐藏/显示其文本，α 调暗而不隐藏，置顶将下一层置于顶部，重置 z 恢复原始顺序。',
        ],
        x: window.innerWidth - 400,
        y: window.innerHeight - 150,
      });

      const layers = new LayerManager(sc.stage);
      mgrRef.current = layers;

      const created: Layer[] = [];
      NAMES.forEach((name, i) => {
        const layer = layers.add(name, i * 10);
        created.push(layer);

        const bg = new PIXI.Graphics()
          .rect(0, 0, window.innerWidth, window.innerHeight)
          .fill({ color: COLORS[i % COLORS.length], alpha: 0.08 });
        bg.eventMode = 'none';
        layer.addChild(bg);

        const label = new PIXI.Text({
          text: name,
          style: { fontSize: 32 + i * 8, fill: COLORS[i % COLORS.length], fontFamily: 'monospace', fontWeight: 'bold' },
        });
        label.anchor.set(0.5);
        label.x = window.innerWidth / 2 + (i - 2) * 50;
        label.y = window.innerHeight / 2 + 40;
        label.eventMode = 'none';
        layer.addChild(label);

        const count = new PIXI.Text({
          text: `z=${i * 10}`,
          style: { fontSize: 12, fill: 0x888888, fontFamily: 'monospace' },
        });
        count.anchor.set(0.5);
        count.x = label.x;
        count.y = label.y + 30;
        count.eventMode = 'none';
        layer.addChild(count);
      });

      const panelY = window.innerHeight - 100;
      const panel = sc.createRegion({ x: 0, y: panelY, width: window.innerWidth, height: 100 });
      const panelBg = new PIXI.Graphics()
        .rect(0, 0, window.innerWidth, 100)
        .fill({ color: 0x0a0a14, alpha: 0.92 });
      panelBg.eventMode = 'none';
      panel.stage.addChild(panelBg);

      const title = new PIXI.Text({
        text: 'LayerManager — named layers with z-order, show/hide, alpha, bringToFront/sendToBack',
        style: { fontSize: 12, fill: 0x88aaff, fontFamily: 'monospace' },
      });
      title.x = 14;
      title.y = 8;
      title.eventMode = 'none';
      panel.stage.addChild(title);

      const toggleAllBtn = makeButton('toggle all', 100, 26, () => {
        const visible = !created[0]?.container.visible;
        created.forEach((l) => l.container.visible = visible);
      }, 0x2a4a7a);
      toggleAllBtn.x = 14;
      toggleAllBtn.y = 34;
      panel.stage.addChild(toggleAllBtn);

      let colX = 130;
      let zCounter = 1000;
      created.forEach((layer, i) => {
        const btn = makeButton(layer.name, 60, 24, () => {
          layer.container.visible = !layer.container.visible;
        }, COLORS[i % COLORS.length]);
        btn.x = colX;
        btn.y = 34;
        panel.stage.addChild(btn);
        colX += 68;
      });

      colX = 130;
      const row2 = 62;
      created.forEach((layer, i) => {
        const btn = makeButton('α', 28, 22, () => {
          gsap.to(layer.container, { alpha: layer.container.alpha < 0.5 ? 1 : 0.3, duration: 0.2 });
        }, 0x2a3a4a);
        btn.x = colX;
        btn.y = row2;
        panel.stage.addChild(btn);
        colX += 68;
      });

      const frontBtn = makeButton('front', 60, 24, () => {
        const cur = zCounter++;
        const idx = cur % created.length;
        layers.bringToFront(NAMES[idx]);
      }, 0x3a2a4a);
      frontBtn.x = 14;
      frontBtn.y = 62;
      panel.stage.addChild(frontBtn);

      const resetBtn = makeButton('reset z', 70, 24, () => {
        NAMES.forEach((n, i) => {
          const l = layers.get(n);
          if (l) l.container.zIndex = i * 10;
        });
      }, 0x2a3a3a);
      resetBtn.x = 80;
      resetBtn.y = 62;
      panel.stage.addChild(resetBtn);
    });
    return stop;
  }, []);

  return null;
}

ComponentLayersDisplay.head = {
  title: 'Component: Layers',
  description: 'LayerManager — named layers with z-order, show/hide, alpha, bringToFront/sendToBack.',
};
