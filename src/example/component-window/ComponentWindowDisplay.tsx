// Example: Window manager component with drag/resize
import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas, type SubCanvasProxy } from '@framework';
import { makeInfoPanel } from '@components';
import { createWindow, type GameWindow, type GameWindowOptions } from '../../components';
// NOTE: this example uses createWindow() directly as a component demo. Do NOT migrate to WindowManagerAdapter — standalone component showcases should keep using the direct API.

type WinKey = 'A' | 'B' | 'C';
const KEYS: WinKey[] = ['A', 'B', 'C'];

const WINDOW_SPECS: Record<WinKey, Omit<GameWindowOptions, 'parent'>> = {
  A: { title: 'A · title drag', x: 40, y: 80, width: 320, height: 220, dragMode: 'title' },
  B: { title: 'B · anywhere drag', x: 380, y: 80, width: 320, height: 220, dragMode: 'anywhere' },
  C: { title: 'C · fixed', x: 720, y: 80, width: 320, height: 220, dragMode: 'none' },
};

const HINTS: Record<WinKey, string> = {
  A: 'drag the title bar only',
  B: 'drag from anywhere inside',
  C: 'cannot be dragged',
};

const PRESET: Record<WinKey, { x: number; y: number }> = {
  A: { x: 100, y: 300 },
  B: { x: 440, y: 300 },
  C: { x: 780, y: 300 },
};

const BTN_W = 64;
const BTN_H = 24;
const ROW_H = 28;
const COL_GAP = 6;

function makeBtn(label: string, onClick: () => void): PIXI.Container {
  const c = new PIXI.Container();
  c.eventMode = 'static';
  c.cursor = 'pointer';
  const g = new PIXI.Graphics().roundRect(0, 0, BTN_W, BTN_H, 4).fill(0x14141f).stroke({ color: 0x2a2a3a, width: 1 });
  c.addChild(g);
  const t = new PIXI.Text({ text: label, style: { fontSize: 10, fill: 0xe6e6f0, fontFamily: 'monospace' } });
  t.x = (BTN_W - t.width) / 2;
  t.y = (BTN_H - t.height) / 2;
  c.addChild(t);
  c.hitArea = new PIXI.Rectangle(0, 0, BTN_W, BTN_H);
  c.on('pointerdown', (e) => { e.stopPropagation(); onClick(); });
  return c;
}

function setBtnEnabled(btn: PIXI.Container, enabled: boolean) {
  btn.alpha = enabled ? 1 : 0.35;
  btn.eventMode = enabled ? 'static' : 'none';
}

function addContent(win: GameWindow, hint: string) {
  const text = new PIXI.Text({ text: hint, style: { fontSize: 13, fill: 0xffffff, fontFamily: 'monospace' } });
  text.x = 14;
  text.y = 50;
  win.stage.addChild(text);
}

interface Btns { close: PIXI.Container; open: PIXI.Container; reopen: PIXI.Container; preset: PIXI.Container; }

export function ComponentWindowDisplay() {
  useEffect(() => {
    let sc: SubCanvas | null = null;
    const wins: Record<WinKey, GameWindow | null> = { A: null, B: null, C: null };
    const lastPos: Record<WinKey, { x: number; y: number } | null> = { A: null, B: null, C: null };
    const btns: Record<WinKey, Btns | null> = { A: null, B: null, C: null };

    const syncBtns = () => {
      for (const k of KEYS) {
        const b = btns[k];
        if (!b) continue;
        const isOpen = wins[k] != null;
        setBtnEnabled(b.close, isOpen);
        setBtnEnabled(b.open, !isOpen);
        setBtnEnabled(b.reopen, !isOpen && lastPos[k] != null);
        setBtnEnabled(b.preset, !isOpen);
      }
    };

    const doClose = (k: WinKey) => {
      const win = wins[k];
      if (!win) return;
      lastPos[k] = { x: Math.round(win.bounds.x), y: Math.round(win.bounds.y) };
      win.destroy();
      wins[k] = null;
      syncBtns();
    };

    const doOpen = (k: WinKey, pos?: { x: number; y: number }) => {
      if (!sc || wins[k]) return;
      const spec = { ...WINDOW_SPECS[k], parent: sc };
      if (pos) { spec.x = pos.x; spec.y = pos.y; }
      const win = createWindow(spec);
      wins[k] = win;
      addContent(win, HINTS[k]);
      syncBtns();
    };

    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      sc = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      makeInfoPanel(sc, { title: '窗口组件', lines: ['用途：演示 createWindow() 的三种拖拽模式：标题栏拖拽、任意位置拖拽、固定模式', '测试方法：使用底部面板按钮对每个窗口执行关闭/打开/恢复/预设操作，尝试拖拽各窗口', '预期效果：窗口A仅能通过标题栏拖拽，窗口B可在任意位置拖拽，窗口C不可拖拽。关闭后恢复可还原上次位置'], x: window.innerWidth - 400, y: window.innerHeight - 150 });

      const pH = 130;
      const panel = sc.createRegion({ x: 0, y: H - pH, width: W, height: pH });
      const bg = new PIXI.Graphics().rect(0, 0, W, pH).fill({ color: 0x0a0a14, alpha: 0.92 });
      bg.eventMode = 'none';
      panel.stage.addChild(bg);

      const title = new PIXI.Text({ text: 'PixiWindow.ts', style: { fontSize: 13, fill: 0x88aaff, fontFamily: 'monospace' } });
      title.x = 14;
      title.y = 8;
      title.eventMode = 'none';
      panel.stage.addChild(title);

      const hint = new PIXI.Text({
        text: "createWindow({ title, x, y, w, h, parent, dragMode })  dragMode: 'title' | 'anywhere' | 'none'",
        style: { fontSize: 10, fill: 0x888888, fontFamily: 'monospace' },
      });
      hint.x = 14;
      hint.y = 26;
      hint.eventMode = 'none';
      panel.stage.addChild(hint);

      KEYS.forEach((k, i) => {
        const rowY = 48 + i * ROW_H;
        const label = new PIXI.Text({ text: `win ${k}`, style: { fontSize: 11, fill: 0x88aaff, fontFamily: 'monospace' } });
        label.x = 14;
        label.y = rowY + 4;
        label.eventMode = 'none';
        panel.stage.addChild(label);

        const col0 = 60;
        const close = makeBtn('close', () => doClose(k));
        close.x = col0;
        close.y = rowY;
        panel.stage.addChild(close);

        const open = makeBtn('open', () => doOpen(k));
        open.x = col0 + BTN_W + COL_GAP;
        open.y = rowY;
        panel.stage.addChild(open);

        const reopen = makeBtn('reopen', () => doOpen(k, lastPos[k] ?? undefined));
        reopen.x = col0 + (BTN_W + COL_GAP) * 2;
        reopen.y = rowY;
        panel.stage.addChild(reopen);

        const preset = makeBtn('preset', () => doOpen(k, PRESET[k]));
        preset.x = col0 + (BTN_W + COL_GAP) * 3;
        preset.y = rowY;
        panel.stage.addChild(preset);

        btns[k] = { close, open, reopen, preset };
      });

      for (const k of KEYS) {
        wins[k] = createWindow({ ...WINDOW_SPECS[k], parent: sc });
        addContent(wins[k], HINTS[k]);
      }
      syncBtns();
    });
    return () => {
      for (const k of KEYS) wins[k]?.destroy();
      stop();
    };
  }, []);

  return null;
}

ComponentWindowDisplay.head = {
  title: 'subcanvas — Window',
  description: 'Showcase: createWindow() with title/anywhere/none drag modes.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
