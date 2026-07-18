import * as PIXI from 'pixi.js';
import { SubCanvas } from '../framework/SubCanvas';
import { createLoadingImage, type PixiImageHandle } from './PixiImage';

const TITLE_BAR_H = 22;
const CLOSE_BTN_R = 5;
const PADDING = 14;
const BTN_H = 26;
const BTN_GAP = 8;
const BTN_MIN_W = 72;
const DRAG_HANDLE_LABEL = 'subcanvas-drag-handle';

export type PixiConfirmResult = 'ok' | 'cancel' | string;

export interface PixiConfirmButton {
  label: string;
  onClick?: (confirm: PixiConfirm) => void;
  primary?: boolean;
  keepOpen?: boolean;
}

export interface PixiConfirmOptions {
  parent: SubCanvas;
  title: string;
  message?: string;
  image?: string;
  imageMaxWidth?: number;
  imageMaxHeight?: number;
  width: number;
  height: number;
  x?: number;
  y?: number;
  draggable?: boolean;
  dragMode?: 'title' | 'anywhere' | 'none';
  closable?: boolean;
  keepOpen?: boolean;
  onClose?: () => void;
  okText?: string;
  cancelText?: string;
  buttons?: PixiConfirmButton[];
  onResult?: (result: PixiConfirmResult, confirm: PixiConfirm) => void;
}

export interface PixiConfirm extends SubCanvas {
  setTitle(title: string): void;
  setMessage(message: string): void;
  setImage(url: string): void;
  content: SubCanvas;
}

export function createConfirm(opts: PixiConfirmOptions): PixiConfirm {
  const x = opts.x ?? 60;
  const y = opts.y ?? 60;
  const draggable = opts.draggable !== false;
  const dragMode = draggable ? (opts.dragMode ?? 'anywhere') : 'none';
  const closable = opts.closable !== false;
  const okText = opts.okText ?? 'OK';
  const cancelText = opts.cancelText ?? 'Cancel';

  const buttons: PixiConfirmButton[] =
    opts.buttons ??
    [
      { label: cancelText },
      { label: okText, primary: true },
    ];

  const win = opts.parent.createSubRegion(
    { x, y, width: opts.width, height: opts.height },
    {
      dragMode,
      dragBounds: () => opts.parent.bounds,
    },
  ) as PixiConfirm;

  const bg = new PIXI.Graphics()
    .rect(0, 0, opts.width, opts.height)
    .fill({ color: 0x101018, alpha: 0.97 });
  bg.eventMode = 'none';
  win.stage.addChildAt(bg, 0);

  const bar = new PIXI.Graphics()
    .rect(0, 0, opts.width, TITLE_BAR_H)
    .fill({ color: 0x222a3a, alpha: 1 });
  bar.eventMode = 'static';
  bar.label = DRAG_HANDLE_LABEL;
  bar.cursor = dragMode === 'none' ? 'default' : 'move';
  win.addChild(bar);

  const titleText = new PIXI.Text({
    text: opts.title,
    style: { fontSize: 11, fill: 0xffffff, fontFamily: 'monospace' },
  });
  titleText.x = 8;
  titleText.y = (TITLE_BAR_H - titleText.height) / 2;
  titleText.eventMode = 'none';
  win.stage.addChild(titleText);

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
    const closeCircle = new PIXI.Graphics().circle(0, 0, CLOSE_BTN_R).fill({ color: 0xff5577 });
    closeCircle.eventMode = 'none';
    closeBtn.addChild(closeCircle);
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
      if (opts.keepOpen) return;
      opts.onResult?.('cancel', win);
      if (opts.onClose) opts.onClose();
      else win.destroy();
    });
    win.stage.addChild(closeBtn);
  }

  const messageStyle = new PIXI.TextStyle({
    fontSize: 12,
    fill: 0xdddddd,
    fontFamily: 'sans-serif',
    wordWrap: true,
    wordWrapWidth: opts.width - PADDING * 2,
    lineHeight: 18,
  });
  const messageText = new PIXI.Text({
    text: opts.message ?? '',
    style: messageStyle,
  });
  messageText.x = PADDING;
  messageText.y = TITLE_BAR_H + PADDING;
  messageText.eventMode = 'none';
  win.stage.addChild(messageText);

  const bodyTop = TITLE_BAR_H + PADDING;
  const bodyBottom = opts.height - PADDING - BTN_H;
  const bodyW = opts.width - PADDING * 2;
  const bodyH = bodyBottom - bodyTop;

  let image: PixiImageHandle | null = null;

  if (opts.message && opts.message.length > 0) {
    messageText.visible = true;
  } else {
    messageText.visible = false;
  }
  if (opts.image) {
    image = createLoadingImage(win, {
      url: opts.image,
      x: PADDING,
      y: bodyTop,
      width: bodyW,
      height: bodyH,
      maxWidth: opts.imageMaxWidth,
      maxHeight: opts.imageMaxHeight,
      onError: (err) => {
        console.warn('[PixiConfirm] image load failed:', err);
      },
    });
    messageText.visible = false;
  }

  const fireButton = (idx: number) => {
    const b = buttons[idx];
    let result: PixiConfirmResult = b.label;
    if (b.label === okText) result = 'ok';
    else if (b.label === cancelText) result = 'cancel';
    b.onClick?.(win);
    opts.onResult?.(result, win);
    if (!b.keepOpen && !opts.keepOpen) {
      win.destroy();
    }
  };

  let cursorX = opts.width - PADDING;
  for (let i = buttons.length - 1; i >= 0; i--) {
    const b = buttons[i];
    const isPrimary = b.primary ?? false;
    const labelWidth = new PIXI.Text({
      text: b.label,
      style: { fontSize: 12, fontFamily: 'sans-serif' },
    }).width;
    const w = Math.max(BTN_MIN_W, labelWidth + 24);
    const h = BTN_H;
    cursorX -= w;
    if (i < buttons.length - 1) cursorX -= BTN_GAP;

    const btnContainer = new PIXI.Container();
    btnContainer.x = cursorX;
    btnContainer.y = opts.height - PADDING - h;
    btnContainer.eventMode = 'static';
    btnContainer.cursor = 'pointer';
    btnContainer.hitArea = new PIXI.Rectangle(0, 0, w, h);
    const btnBg = new PIXI.Graphics()
      .roundRect(0, 0, w, h, 3)
      .fill({ color: isPrimary ? 0x3a4a6a : 0x2a2a3a })
      .stroke({ width: 1, color: 0x4a4a66 });
    btnBg.eventMode = 'none';
    const btnLabel = new PIXI.Text({
      text: b.label,
      style: { fontSize: 12, fill: 0xffffff, fontFamily: 'sans-serif' },
    });
    btnLabel.x = (w - btnLabel.width) / 2;
    btnLabel.y = (h - btnLabel.height) / 2;
    btnLabel.eventMode = 'none';
    btnContainer.addChild(btnBg);
    btnContainer.addChild(btnLabel);
    btnContainer.on('pointerdown', (e) => {
      e.stopPropagation();
      fireButton(i);
    });
    win.stage.addChild(btnContainer);
  }

  const content = win.createSubRegion({
    x: 0,
    y: TITLE_BAR_H,
    width: opts.width,
    height: Math.max(0, opts.height - TITLE_BAR_H),
  });
  win.content = content;

  win.setTitle = (t: string) => {
    if (win.destroyed) return;
    titleText.text = t;
  };
  win.setMessage = (m: string) => {
    if (win.destroyed) return;
    messageText.text = m;
    messageText.visible = true;
    if (image) image.container.visible = false;
  };
  win.setImage = (url: string) => {
    if (win.destroyed) return;
    if (image) {
      image.setUrl(url);
    } else {
      image = createLoadingImage(win, {
        url,
        x: PADDING,
        y: bodyTop,
        width: bodyW,
        height: bodyH,
        maxWidth: opts.imageMaxWidth,
        maxHeight: opts.imageMaxHeight,
      });
      messageText.visible = false;
    }
  };

  const origDestroy = win.destroy.bind(win);
  (win as unknown as { destroy: () => void }).destroy = () => {
    image?.destroy();
    image = null;
    origDestroy();
  };

  return win;
}
