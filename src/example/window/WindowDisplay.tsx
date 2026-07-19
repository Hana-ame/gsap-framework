import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '@framework';
import { createWindow, showLoading } from '../../components';

export function WindowDisplay() {
  useEffect(() => {
    let hideLoading: (() => void) | null = null;

    const destroy = startPixiApp((proxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      root.stage.addChild(
        new PIXI.Text({
          text: `#window — drag title bar to move • click red dot to close • click title to focus`,
          style: { fontSize: 11, fill: 0x88aaff, fontFamily: 'monospace' },
        }),
      );

      const inv = createWindow({
        parent: root,
        title: 'Inventory',
        width: 280,
        height: 200,
        x: 40,
        y: 40,
      });
      for (let i = 0; i < 12; i++) {
        const slot = new PIXI.Graphics()
          .rect(8 + (i % 6) * 42, 12 + Math.floor(i / 6) * 42, 36, 36)
          .fill({ color: 0x334455, alpha: 0.6 })
          .stroke({ width: 1, color: 0x556677 });
        inv.content.stage.addChild(slot);
      }

      const chat = createWindow({
        parent: root,
        title: 'Chat',
        width: 240,
        height: 140,
        x: W - 280,
        y: H - 180,
      });
      const chatText = new PIXI.Text({
        text: 'bus.on("chat", ...)\nawait backend...',
        style: { fontSize: 11, fill: 0xaabbcc, fontFamily: 'monospace' },
      });
      chatText.x = 8;
      chatText.y = 8;
      chat.content.stage.addChild(chatText);

      const offBackend = proxy.bus.on<{ from: string; msg: string }>('chat', (p) => {
        chatText.text = `${p.from}: ${p.msg}\n${chatText.text}`;
      });

      const offBusDemo = proxy.bus.on('demo:event', () => {});

      hideLoading = showLoading(root, 'simulating backend call...');
      const simTimer = setTimeout(() => {
        hideLoading?.();
        proxy.bus.emit('chat', { from: 'system', msg: 'hello from simulated backend' });
      }, 1500);

      const offResize = proxy.onWindowResize(() => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        root.setBounds({ x: 0, y: 0, width: W, height: H });
      });

      return () => {
        clearTimeout(simTimer);
        offBackend();
        offBusDemo();
        offResize();
      };
    });

    return () => {
      hideLoading?.();
      destroy();
    };
  }, []);

  return null;
}

WindowDisplay.head = {
  title: 'PIXI Window — sim',
  description: 'Draggable PIXI window system — Inventory grid + Chat log + loading overlay.',
  meta: [
    { name: 'theme-color', content: '#0a0a14' },
  ],
};
