import * as PIXI from 'pixi.js';
import { SubCanvas } from '../pixi/SubCanvas';

const TITLE_BAR_H = 22;
const CLOSE_BTN_R = 5;

export interface GameWindowOptions {
  parent: SubCanvas;
  title: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  draggable?: boolean;
  closable?: boolean;
  onClose?: () => void;
}

export interface GameWindow extends SubCanvas {
  setTitle(title: string): void;
  content: SubCanvas;
}

export function createWindow(opts: GameWindowOptions): GameWindow {
  const x = opts.x ?? 60;
  const y = opts.y ?? 60;
  const draggable = opts.draggable !== false;
  const closable = opts.closable !== false;

  const win = opts.parent.createSubRegion({ x, y, width: opts.width, height: opts.height }) as GameWindow;

  const bg = new PIXI.Graphics()
    .rect(0, 0, opts.width, opts.height)
    .fill({ color: 0x101018, alpha: 0.95 });
  bg.eventMode = 'none';
  win.stage.addChildAt(bg, 0);

  const bar = new PIXI.Graphics()
    .rect(0, 0, opts.width, TITLE_BAR_H)
    .fill({ color: 0x222a3a, alpha: 1 });
  bar.eventMode = 'none';
  win.stage.addChild(bar);

  const title = new PIXI.Text({
    text: opts.title,
    style: { fontSize: 11, fill: 0xffffff, fontFamily: 'monospace' },
  });
  title.x = 8;
  title.y = (TITLE_BAR_H - title.height) / 2;
  title.eventMode = 'none';
  win.stage.addChild(title);

  if (closable) {
    const cx = opts.width - 12;
    const cy = TITLE_BAR_H / 2;
    const closeBtn = new PIXI.Graphics().circle(cx, cy, CLOSE_BTN_R).fill({ color: 0xff5577 });
    closeBtn.eventMode = 'none';
    win.stage.addChild(closeBtn);

    const xMark = new PIXI.Graphics()
      .moveTo(cx - 2, cy - 2)
      .lineTo(cx + 2, cy + 2)
      .moveTo(cx + 2, cy - 2)
      .lineTo(cx - 2, cy + 2)
      .stroke({ width: 1.2, color: 0xffffff });
    xMark.eventMode = 'none';
    win.stage.addChild(xMark);
  }

  const content = win.createSubRegion({
    x: 0,
    y: TITLE_BAR_H,
    width: opts.width,
    height: Math.max(0, opts.height - TITLE_BAR_H),
  });
  win.content = content;

  if (draggable) {
    const constraint = opts.parent.bounds;
    let dragging = false;
    let sx = 0;
    let sy = 0;
    let ox = 0;
    let oy = 0;
    let onGlobalMove: ((e: PointerEvent) => void) | null = null;
    let onGlobalUp: ((e: PointerEvent) => void) | null = null;

    const cleanupGlobal = () => {
      if (onGlobalMove) {
        window.removeEventListener('pointermove', onGlobalMove);
        onGlobalMove = null;
      }
      if (onGlobalUp) {
        window.removeEventListener('pointerup', onGlobalUp);
        window.removeEventListener('pointercancel', onGlobalUp);
        onGlobalUp = null;
      }
    };
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      cleanupGlobal();
    };

    win.onPress((e) => {
      cleanupGlobal();
      if (closable) {
        const closeX = opts.width - 12;
        const closeY = TITLE_BAR_H / 2;
        const dx = e.x - closeX;
        const dy = e.y - closeY;
        if (dx * dx + dy * dy <= (CLOSE_BTN_R + 2) * (CLOSE_BTN_R + 2)) {
          if (opts.onClose) opts.onClose();
          else win.destroy();
          return;
        }
      }
      if (e.y > TITLE_BAR_H) return;
      dragging = true;
      sx = e.globalX;
      sy = e.globalY;
      ox = win.bounds.x;
      oy = win.bounds.y;
      win.bringToFront();

      onGlobalMove = (ev: PointerEvent) => {
        if (!dragging) return;
        let nx = ox + (ev.clientX - sx);
        let ny = oy + (ev.clientY - sy);
        nx = Math.max(0, Math.min(nx, constraint.width - win.bounds.width));
        ny = Math.max(0, Math.min(ny, constraint.height - win.bounds.height));
        win.setPosition(nx, ny);
      };
      onGlobalUp = () => endDrag();
      window.addEventListener('pointermove', onGlobalMove);
      window.addEventListener('pointerup', onGlobalUp);
      window.addEventListener('pointercancel', onGlobalUp);
    });

    win.onRelease(() => endDrag());

    const origDestroy = win.destroy.bind(win);
    (win as unknown as { destroy: () => void }).destroy = () => {
      cleanupGlobal();
      origDestroy();
    };
  }

  win.setTitle = (t: string) => {
    title.text = t;
  };

  return win;
}
