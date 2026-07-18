import * as PIXI from 'pixi.js';
import { registerComponent, type Component, type ComponentOptions } from './component';
import { createWindow } from '../components/PixiWindow';
import { createConfirm } from '../components/PixiConfirm';
import { createScrollable } from '../components/Scrollable';

interface WindowComponentOptions extends ComponentOptions {
  title: string;
  draggable?: boolean;
  dragMode?: 'title' | 'anywhere' | 'none';
  closable?: boolean;
  onClose?: () => void;
}

registerComponent<WindowComponentOptions>('window', (opts) => {
  const win = createWindow({
    parent: opts.parent,
    title: opts.title,
    width: opts.width,
    height: opts.height,
    x: opts.x,
    y: opts.y,
    draggable: opts.draggable,
    dragMode: opts.dragMode,
    closable: opts.closable,
    onClose: opts.onClose,
  });
  return {
    type: 'window',
    stage: win.stage,
    destroy: () => win.destroy(),
    get destroyed() { return win.destroyed; },
  };
});

interface ConfirmComponentOptions extends ComponentOptions {
  title: string;
  message?: string;
  image?: string;
  imageMaxWidth?: number;
  imageMaxHeight?: number;
  draggable?: boolean;
  dragMode?: 'title' | 'anywhere' | 'none';
  closable?: boolean;
  keepOpen?: boolean;
  onClose?: () => void;
  okText?: string;
  cancelText?: string;
  buttons?: import('../components/PixiConfirm').PixiConfirmButton[];
  onResult?: (result: import('../components/PixiConfirm').PixiConfirmResult, confirm: import('../components/PixiConfirm').PixiConfirm) => void;
}

registerComponent<ConfirmComponentOptions>('confirm', (opts) => {
  const conf = createConfirm({
    parent: opts.parent,
    title: opts.title,
    message: opts.message,
    image: opts.image,
    imageMaxWidth: opts.imageMaxWidth,
    imageMaxHeight: opts.imageMaxHeight,
    width: opts.width,
    height: opts.height,
    x: opts.x,
    y: opts.y,
    draggable: opts.draggable,
    dragMode: opts.dragMode,
    closable: opts.closable,
    keepOpen: opts.keepOpen,
    onClose: opts.onClose,
    okText: opts.okText,
    cancelText: opts.cancelText,
    buttons: opts.buttons,
    onResult: opts.onResult,
  });
  return {
    type: 'confirm',
    stage: conf.stage,
    destroy: () => conf.destroy(),
    get destroyed() { return conf.destroyed; },
  };
});

interface ScrollableComponentOptions extends ComponentOptions {
  direction?: 'vertical' | 'horizontal';
  scrollbar?: boolean;
  accept?: { x?: number; y?: number };
}

registerComponent<ScrollableComponentOptions>('scrollable', (opts) => {
  const sc = createScrollable(opts.parent, {
    width: opts.width,
    height: opts.height,
    direction: opts.direction,
    scrollbar: opts.scrollbar,
    accept: opts.accept,
  });
  const origAddChild = sc.content.addChild.bind(sc.content);
  sc.content.addChild = ((...children: PIXI.Container[]) => {
    const r = origAddChild(...children);
    sc.recalc();
    return r;
  }) as typeof sc.content.addChild;
  return {
    type: 'scrollable',
    stage: sc.content,
    destroy: () => sc.destroy(),
    get destroyed() { return sc.destroyed; },
  };
});


