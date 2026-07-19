import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import {
  startPixiApp,
  gsap,
  InfiniteCanvas,
  EventBus,
  createComponent,
  makeButton,
  type SubCanvasProxy,
  type Chunk,
} from '@framework';

export function ComponentTutorialGsapIcDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth, height: window.innerHeight,
      });

      const panel = root.createRegion(
        { x: 12, y: 12, width: 190, height: window.innerHeight - 24 },
        { dragMode: 'none' },
      );

      const panelBg = new PIXI.Graphics()
        .roundRect(0, 0, 190, window.innerHeight - 24, 8)
        .fill({ color: 0x14141f, alpha: 0.9 })
        .stroke({ width: 1, color: 0x2a2a3a });
      panelBg.eventMode = 'none';
      panel.stage.addChild(panelBg);

      const panelTitle = new PIXI.Text({
        text: 'GSAP + IC',
        style: { fontSize: 12, fill: 0x88aaff, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      panelTitle.x = 10;
      panelTitle.y = 6;
      panelTitle.eventMode = 'none';
      panel.stage.addChild(panelTitle);

      const demo = root.createRegion(
        { x: 210, y: 12, width: window.innerWidth - 222, height: window.innerHeight - 24 },
        { dragMode: 'none', clipToBounds: true },
      );

      const CHUNK = 80;
      const ic = new InfiniteCanvas({
        parent: demo,
        viewport: { x: 0, y: 0, width: demo.bounds.width, height: demo.bounds.height },
        chunkSize: CHUNK,
        preloadMargin: 2,
        chunkCreate: (chunk: Chunk) => {
          const palette = [0x1a2a3a, 0x1a2a3c, 0x182c38, 0x1c2834, 0x162e36];
          const color = palette[((chunk.cx * 7 + chunk.cy * 11) % palette.length + palette.length) % palette.length];
          const g = new PIXI.Graphics()
            .rect(0, 0, CHUNK, CHUNK)
            .fill({ color })
            .stroke({ width: 1, color: 0x2a3a4a });
          const t = new PIXI.Text({
            text: `${chunk.cx},${chunk.cy}`,
            style: { fontSize: 10, fill: 0x8899aa, fontFamily: 'monospace' },
          });
          t.x = 4;
          t.y = 4;
          chunk.container.addChild(g, t);
        },
        chunkDestroy: (chunk: Chunk) => {
          chunk.container.destroy({ children: true });
        },
        decelerate: true,
        minZoom: 0.3,
        maxZoom: 5,
      });

      let btnY = 30;
      const addBtn = (label: string, onClick: () => void) => {
        const btn = makeButton(label, 170, 28, onClick, 0x1a1a2e);
        btn.x = 10;
        btn.y = btnY;
        panel.stage.addChild(btn);
        btnY += 34;
      };

      let currentTween: gsap.core.Tween | gsap.core.Timeline | null = null;
      const killCurrent = () => { currentTween?.kill(); currentTween = null; };

      const icState = { x: 0, y: 0, zoom: 1 };

      addBtn('→ pan 400', () => {
        killCurrent();
        currentTween = gsap.to(icState, {
          x: 400, duration: 0.6, ease: 'power2.out',
          onUpdate: () => ic.panTo(icState.x, icState.y),
        });
      });

      addBtn('← pan 0', () => {
        killCurrent();
        currentTween = gsap.to(icState, {
          x: 0, duration: 0.6, ease: 'power2.out',
          onUpdate: () => ic.panTo(icState.x, icState.y),
        });
      });

      addBtn('zoom 1.8', () => {
        killCurrent();
        ic.setZoom(1.8, demo.bounds.width / 2, demo.bounds.height / 2);
      });
      addBtn('zoom 0.5', () => {
        killCurrent();
        ic.setZoom(0.5, demo.bounds.width / 2, demo.bounds.height / 2);
      });

      addBtn('pan down+left', () => {
        killCurrent();
        currentTween = gsap.to(icState, {
          x: -200, y: 200, duration: 0.5, ease: 'power2.in',
          onUpdate: () => ic.panTo(icState.x, icState.y),
        });
      });

      addBtn('bounce', () => {
        killCurrent();
        const tl = gsap.timeline();
        const startX = icState.x, startY = icState.y;
        tl.to(icState, {
          x: startX + 300, y: startY + 200, duration: 0.5, ease: 'power2.in',
          onUpdate: () => ic.panTo(icState.x, icState.y),
        });
        tl.to(icState, {
          x: startX, y: startY, duration: 0.6, ease: 'bounce.out',
          onUpdate: () => ic.panTo(icState.x, icState.y),
        });
        currentTween = tl;
      });

      addBtn('timeline demo', () => {
        killCurrent();
        const tl = gsap.timeline();
        tl.to(icState, {
          x: 400, duration: 0.4, ease: 'power2.out',
          onUpdate: () => ic.panTo(icState.x, icState.y),
        });
        tl.call(() => ic.setZoom(1.8, demo.bounds.width / 2, demo.bounds.height / 2));
        tl.to(icState, {
          x: 600, y: -100, duration: 0.5, ease: 'power2.out',
          onUpdate: () => ic.panTo(icState.x, icState.y),
        });
        tl.call(() => ic.setZoom(0.5, demo.bounds.width / 2, demo.bounds.height / 2));
        currentTween = tl;
      });

      addBtn('reset', () => {
        killCurrent();
        icState.x = 0; icState.y = 0; icState.zoom = 1;
        ic.panTo(0, 0);
        ic.setZoom(1, demo.bounds.width / 2, demo.bounds.height / 2);
      });

      const bus = proxy.bus as EventBus;
      let busCount = 0;
      const busLabel = new PIXI.Text({
        text: 'EventBus counter: 0',
        style: { fontSize: 13, fill: 0x88cc88, fontFamily: 'monospace' },
      });
      busLabel.x = 0;
      busLabel.y = demo.bounds.height + 8;
      demo.stage.addChild(busLabel);

      const unsub = bus.on('tutorial:increment', (payload: { step: number }) => {
        busCount += payload.step;
        busLabel.text = `EventBus counter: ${busCount}`;
      });

      addBtn('bus +1', () => {
        bus.emit('tutorial:increment', { step: 1 });
      });

      // registry buttons
      addBtn('reg window', () => {
        const win = createComponent('window', {
          parent: root,
          title: 'Registry Window',
          x: 250 + Math.random() * 80,
          y: 370 + Math.random() * 60,
          width: 250, height: 180,
        });
        const txt = new PIXI.Text({
          text: 'createComponent(\'window\')\nworks via registry adapter',
          style: { fontSize: 11, fill: 0xaaaacc, fontFamily: 'monospace' },
        });
        txt.x = 14; txt.y = 14;
        win.stage.addChild(txt);
      });

      addBtn('reg confirm', () => {
        createComponent<import('../../framework').ComponentOptions & { title: string; message?: string }>('confirm', {
          parent: root,
          title: 'Confirm via Registry',
          message: 'Created with createComponent(\'confirm\')',
          x: 280 + Math.random() * 80,
          y: 400 + Math.random() * 60,
          width: 320, height: 160,
        });
      });

      const info = new PIXI.Text({
        text: 'GSAP animates InfiniteCanvas pan/zoom',
        style: { fontSize: 12, fill: 0x556688, fontFamily: 'monospace' },
      });
      info.x = 0;
      info.y = demo.bounds.height + 22;
      demo.stage.addChild(info);

      return () => {
        killCurrent();
        unsub();
      };
    });

    return () => { stop(); };
  }, []);

  return (
    <div className="tutorial-hint">
      <style>{css}</style>
      GSAP + InfiniteCanvas · 左侧按钮控制 IC 平移和缩放
    </div>
  );
}

const css = `
.tutorial-hint {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 100;
  background: rgba(10,10,20,0.85);
  border: 1px solid #2a2a3a;
  border-radius: 8px;
  padding: 8px 14px;
  font-family: monospace;
  font-size: 0.75rem;
  color: #88aacc;
}
`;

ComponentTutorialGsapIcDisplay.head = {
  title: 'GSAP + IC',
  description:
    'Tutorial variant: InfiniteCanvas fills the demo area, GSAP buttons animate pan/zoom.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
