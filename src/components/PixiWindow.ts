import * as PIXI from 'pixi.js';
import { SubCanvas, type SubDragMode } from '../framework/SubCanvas';

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
}

export interface GameWindow extends SubCanvas {
  setTitle(title: string): void;
  content: SubCanvas;
}

export function createWindow(opts: GameWindowOptions): GameWindow {
  const x = opts.x ?? 60;
  const y = opts.y ?? 60;
  const draggable = opts.draggable !== false;
  const dragMode: PixiDragMode = draggable ? (opts.dragMode ?? 'title') : 'none';
  const closable = opts.closable !== false;

  const win = opts.parent.createSubRegion(
    { x, y, width: opts.width, height: opts.height },
    {
      dragMode,
      dragBounds: () => opts.parent.bounds,
    },
  ) as GameWindow;

  const bg = new PIXI.Graphics()
    .rect(0, 0, opts.width, opts.height)
    .fill({ color: 0x101018, alpha: 0.95 });
  bg.eventMode = 'none';
  win.stage.addChild(bg);

  const bar = new PIXI.Graphics()
    .rect(0, 0, opts.width, TITLE_BAR_H)
    .fill({ color: 0x222a3a, alpha: 1 });
  bar.eventMode = 'static';
  bar.label = DRAG_HANDLE_LABEL;
  bar.cursor = 'move';
  win.addChild(bar);

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
    const closeBtn = new PIXI.Container();
    closeBtn.x = cx;
    closeBtn.y = cy;
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.hitArea = new PIXI.Rectangle(
      -CLOSE_BTN_R - 2,
      -CLOSE_BTN_R - 2,
      (CLOSE_BTN_R + 2) * 2,
      (CLOSE_BTN_R + 2) * 2,
    );
    const circle = new PIXI.Graphics().circle(0, 0, CLOSE_BTN_R).fill({ color: 0xff5577 });
    circle.eventMode = 'none';
    closeBtn.addChild(circle);
    const xMark = new PIXI.Graphics()
      .moveTo(-2, -2)
      .lineTo(2, 2)
      .moveTo(2, -2)
      .lineTo(-2, 2)
      .stroke({ width: 1.2, color: 0xffffff });
    xMark.eventMode = 'none';
    closeBtn.addChild(xMark);
    closeBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      if (opts.onClose) opts.onClose();
      else win.destroy();
    });
    win.stage.addChild(closeBtn);
  }

  const content = win.createSubRegion(
    {
      x: 0,
      y: TITLE_BAR_H,
      width: opts.width,
      height: Math.max(0, opts.height - TITLE_BAR_H),
    },
    { clipToBounds: true },
  );
  win.content = content;

  win.setTitle = (t: string) => {
    title.text = t;
  };

  return win;
}
