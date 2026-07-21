/** Draggable, resizable window with title bar and close button, rendered in PixiJS. */
import * as PIXI from 'pixi.js';
import { SubCanvas, type SubDragMode } from '@framework/SubCanvas';
import { WindowBorder } from '@framework/utils/WindowBorder';

const TITLE_BAR_H = 22;
const CLOSE_BTN_R = 5;
const DRAG_HANDLE_LABEL = 'subcanvas-drag-handle';

export type PixiDragMode = SubDragMode;

export interface GameWindowOptions {
  parent: SubCanvas;
  title: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  draggable?: boolean;
  dragMode?: PixiDragMode;
  closable?: boolean;
  onClose?: () => void;
  borderWidth?: number;
  borderColor?: number;
  cornerRadius?: number;
}

export interface GameWindow extends SubCanvas {
  setTitle(title: string): void;
  content: SubCanvas;
}

export function createWindow(opts: GameWindowOptions): GameWindow {
  const x = opts.x ?? 60;
  const y = opts.y ?? 60;
  const draggable = opts.draggable !== false;
  const dragMode: PixiDragMode = draggable ? (opts.dragMode ?? 'anywhere') : 'none';
  const closable = opts.closable !== false;
  const bw = opts.borderWidth ?? 1;
  const tbh = TITLE_BAR_H;

  const win = opts.parent.createRegion(
    { x, y, width: opts.width, height: opts.height },
    {
      dragMode,
      dragBounds: () => opts.parent.bounds,
    },
  ) as GameWindow;

  const border = new WindowBorder({
    width: opts.width,
    height: opts.height,
    borderWidth: bw,
    borderColor: opts.borderColor,
    cornerRadius: opts.cornerRadius,
  });
  win.stage.addChild(border.bg);

  const bar = new PIXI.Graphics()
    .rect(bw, bw, opts.width - bw * 2, tbh)
    .fill({ color: 0x222a3a, alpha: 1 });
  bar.eventMode = 'static';
  bar.label = DRAG_HANDLE_LABEL;
  bar.cursor = dragMode === 'none' ? 'default' : 'move';
  win.addChild(bar);

  const title = new PIXI.Text({
    text: opts.title,
    style: { fontSize: 11, fill: 0xffffff, fontFamily: 'monospace' },
  });
  title.eventMode = 'none';
  win.stage.addChild(title);

  let closeBtn: PIXI.Container | null = null;
  if (closable) {
    closeBtn = new PIXI.Container();
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.hitArea = new PIXI.Rectangle(-14, -14, 28, 28);
    const circle = new PIXI.Graphics().circle(0, 0, CLOSE_BTN_R).fill({ color: 0xff5577 });
    circle.eventMode = 'none';
    closeBtn.addChild(circle);
    const xMark = new PIXI.Graphics()
      .moveTo(-2, -2).lineTo(2, 2)
      .moveTo(2, -2).lineTo(-2, 2)
      .stroke({ width: 1.2, color: 0xffffff });
    xMark.eventMode = 'none';
    closeBtn.addChild(xMark);
    closeBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      opts.onClose?.();
      win.destroy();
    });
    win.stage.addChild(closeBtn);
  }

  const content = win.createRegion(
    {
      x: 0,
      y: tbh,
      width: opts.width,
      height: Math.max(0, opts.height - tbh),
    },
    { clipToBounds: true },
  );
  win.content = content;

  const relayout = () => {
    if (win.destroyed) return;
    const w = win.bounds.width;
    const h = win.bounds.height;
    border.resize(w, h);

    bar.clear();
    bar.rect(bw, bw, w - bw * 2, tbh).fill({ color: 0x222a3a, alpha: 1 });

    title.x = 8 + bw;
    title.y = bw + (tbh - title.height) / 2;

    if (closeBtn) {
      closeBtn.x = w - 12 - bw;
      closeBtn.y = bw + tbh / 2;
    }

    const cr = win.content as SubCanvas;
    cr.setBounds({ x: 0, y: tbh, width: w, height: Math.max(0, h - tbh) });
  };

  relayout();
  win.onResize(relayout);

  win.onPress(() => { if (!win.destroyed) win.bringToFront(); });

  win.setTitle = (t: string) => {
    if (win.destroyed) return;
    title.text = t;
  };

  return win;
}
