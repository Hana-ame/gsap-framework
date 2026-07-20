// Example: Component registry pattern for dynamic component management
import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas, type SubCanvasProxy } from '@framework';
import { createWindow, createConfirm, createScrollable, makeButton, makeInfoPanel } from '@components';

const css = `
.cr-hint {
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

export function ComponentRegistryDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      makeInfoPanel(root, {
        title: '组件工厂演示',
        lines: [
          '用途：演示 createWindow() / createConfirm() / createScrollable() 直接调用。',
        ],
        x: window.innerWidth - 400, y: window.innerHeight - 150,
      });

      const hint = new PIXI.Text({
        text: 'createWindow / createConfirm / createScrollable',
        style: { fontSize: 11, fill: 0x666688, fontFamily: 'monospace' },
      });
      hint.x = 12;
      hint.y = root.bounds.height - 24;
      root.stage.addChild(hint);

      let y = 12;
      const addBtn = (label: string, onClick: () => void) => {
        const btn = makeButton(label, 160, 28, onClick, 0x1a1a2e);
        btn.x = 12;
        btn.y = y;
        root.stage.addChild(btn);
        y += 34;
      };

      addBtn('create window', () => {
        const win = createWindow({
          parent: root,
          title: `Window ${Math.random().toString(36).slice(2, 5)}`,
          x: 200 + Math.random() * 100,
          y: 100 + Math.random() * 100,
          width: 280,
          height: 180,
        });
        const txt = new PIXI.Text({
          text: 'created via createWindow()',
          style: { fontSize: 12, fill: 0xaaaacc, fontFamily: 'monospace' },
        });
        txt.x = 14;
        txt.y = 50;
        win.stage.addChild(txt);
      });

      addBtn('create confirm', () => {
        createConfirm({
          parent: root,
          title: 'Confirm',
          message: 'Created via createConfirm()',
          x: 220 + Math.random() * 100,
          y: 120 + Math.random() * 100,
          width: 320,
          height: 160,
          okText: 'OK',
          cancelText: 'Cancel',
          onResult: (result) => {
            const txt = new PIXI.Text({
              text: `result: ${result}`,
              style: { fontSize: 11, fill: 0x88cc88, fontFamily: 'monospace' },
            });
            txt.x = 12;
            txt.y = 220;
            root.stage.addChild(txt);
          },
        });
      });

      addBtn('create scrollable', () => {
        const sc = createScrollable({
          parent: root,
          width: 240,
          height: 200,
          direction: 'vertical',
          scrollbar: true,
        });
        sc.stage.x = 250 + Math.random() * 80;
        sc.stage.y = 150 + Math.random() * 80;

        for (let i = 0; i < 20; i++) {
          const item = new PIXI.Text({
            text: `item #${i + 1}`,
            style: { fontSize: 13, fill: 0xaaaacc, fontFamily: 'monospace' },
          });
          item.x = 10;
          item.y = i * 26;
          sc.content.addChild(item);
        }

        const title = new PIXI.Text({
          text: 'createScrollable()',
          style: { fontSize: 11, fill: 0x4466aa, fontFamily: 'monospace' },
        });
        title.x = 10;
        title.y = 4;
        sc.content.addChild(title);
      });
    });

    return () => stop();
  }, []);

  return (
    <div className="cr-hint">
      <style>{css}</style>
      click buttons to create components
    </div>
  );
}

ComponentRegistryDisplay.head = {
  title: 'Component Factories',
  description: 'Create window/confirm/scrollable via createWindow() / createConfirm() / createScrollable().',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
