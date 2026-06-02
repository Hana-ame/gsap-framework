import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '../../pixi/PixiApp';
import { createWindow } from '../../window/PixiWindow';
import { showLoading } from '../../ui/Loading';
import type { SubCanvas } from '../../pixi/SubCanvas';

const TITLE_BAR_H = 22;
const MOBILE_BREAKPOINT = 600;
const SIDE_MARGIN = 12;
const STACK_GAP = 8;
const HEADER_H = 24;
const BOTTOM_MARGIN = 16;

interface WinBox {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface Layout {
  mobile: boolean;
  inv: WinBox;
  chat: WinBox;
}

function computeLayout(W: number, H: number): Layout {
  const mobile = W < MOBILE_BREAKPOINT;
  const usableW = Math.max(160, W - SIDE_MARGIN * 2);

  if (mobile) {
    const winW = Math.min(280, usableW);
    const invH = Math.min(200, Math.floor((H - HEADER_H - BOTTOM_MARGIN - STACK_GAP) * 0.55));
    const chatH = H - HEADER_H - BOTTOM_MARGIN - STACK_GAP - invH;
    return {
      mobile,
      inv: { width: winW, height: Math.max(120, invH), x: SIDE_MARGIN, y: HEADER_H },
      chat: {
        width: winW,
        height: Math.max(80, chatH),
        x: SIDE_MARGIN,
        y: HEADER_H + invH + STACK_GAP,
      },
    };
  }

  const invW = 280;
  const invH = 200;
  const chatW = 240;
  const chatH = 140;
  return {
    mobile,
    inv: { width: invW, height: invH, x: 40, y: 40 },
    chat: {
      width: chatW,
      height: chatH,
      x: Math.max(SIDE_MARGIN, W - chatW - 40),
      y: Math.max(40, H - chatH - 40),
    },
  };
}

export function WindowMobileDisplay() {
  useEffect(() => {
    let hideLoading: (() => void) | null = null;
    let invWin: SubCanvas | null = null;
    let chatWin: SubCanvas | null = null;
    let chatText: PIXI.Text | null = null;
    let offBackend: (() => void) | null = null;
    let offBusDemo: (() => void) | null = null;
    let offResize: (() => void) | null = null;
    let offMql: (() => void) | null = null;
    let simTimer: ReturnType<typeof setTimeout> | null = null;

    const destroy = startPixiApp((proxy) => {
      const root = proxy.createRegion({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });

      const header = new PIXI.Text({
        text: '#window-mobile — adaptive layout, stack on narrow screens',
        style: { fontSize: 11, fill: 0x88aaff, fontFamily: 'monospace' },
      });
      header.x = 8;
      header.y = 8;
      header.eventMode = 'none';
      root.stage.addChild(header);

      const buildInventory = (parent: SubCanvas, box: WinBox) => {
        const w = createWindow({
          parent,
          title: 'Inventory',
          width: box.width,
          height: box.height,
          x: box.x,
          y: box.y,
        });
        const padX = 8;
        const padY = 8;
        const gap = 4;
        const innerW = box.width - padX * 2;
        const innerH = box.height - TITLE_BAR_H - padY * 2;
        const cols = Math.max(1, Math.floor((innerW + gap) / 36));
        const slotSize = Math.max(16, Math.floor((innerW - (cols - 1) * gap) / cols));
        const rows = Math.max(1, Math.floor((innerH + gap) / (slotSize + gap)));
        for (let i = 0; i < cols * rows; i++) {
          const c = i % cols;
          const r = Math.floor(i / cols);
          const slot = new PIXI.Graphics()
            .rect(padX + c * (slotSize + gap), padY + r * (slotSize + gap), slotSize, slotSize)
            .fill({ color: 0x334455, alpha: 0.6 })
            .stroke({ width: 1, color: 0x556677 });
          slot.eventMode = 'none';
          w.content.stage.addChild(slot);
        }
        return w;
      };

      const buildChat = (parent: SubCanvas, box: WinBox) => {
        const w = createWindow({
          parent,
          title: 'Chat',
          width: box.width,
          height: box.height,
          x: box.x,
          y: box.y,
        });
        const text = new PIXI.Text({
          text: 'bus.on("chat", ...)\nawait backend...',
          style: { fontSize: 11, fill: 0xaabbcc, fontFamily: 'monospace' },
        });
        text.x = 8;
        text.y = 8;
        w.content.stage.addChild(text);
        return { w, text };
      };

      const relayout = () => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        root.setBounds({ x: 0, y: 0, width: W, height: H });
        const layout = computeLayout(W, H);

        invWin?.destroy();
        chatWin?.destroy();
        invWin = null;
        chatWin = null;
        chatText = null;

        invWin = buildInventory(root, layout.inv);
        const chatRes = buildChat(root, layout.chat);
        chatWin = chatRes.w;
        chatText = chatRes.text;
      };

      relayout();

      offBackend = proxy.bus.on<{ from: string; msg: string }>('chat', (p) => {
        if (chatText) chatText.text = `${p.from}: ${p.msg}\n${chatText.text}`;
      });
      offBusDemo = proxy.bus.on('demo:event', () => {});

      hideLoading = showLoading(root, 'simulating backend call...');
      simTimer = setTimeout(() => {
        hideLoading?.();
        proxy.bus.emit('chat', { from: 'system', msg: 'hello from simulated backend' });
      }, 1500);

      offResize = proxy.onWindowResize(() => relayout());

      if (typeof window.matchMedia === 'function') {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const onMql = () => relayout();
        if (mql.addEventListener) {
          mql.addEventListener('change', onMql);
          offMql = () => mql.removeEventListener('change', onMql);
        } else {
          mql.addListener(onMql);
          offMql = () => mql.removeListener(onMql);
        }
      }
    });

    return () => {
      hideLoading?.();
      if (simTimer) clearTimeout(simTimer);
      offBackend?.();
      offBusDemo?.();
      offResize?.();
      offMql?.();
      destroy();
    };
  }, []);

  return null;
}
