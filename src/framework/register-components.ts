import { registerComponent, type Component, type ComponentOptions } from './component';
import { createWindow, type GameWindowOptions } from '../components/PixiWindow';
import { createConfirm, type PixiConfirmOptions } from '../components/PixiConfirm';
import { createScrollable, type ScrollableOptions } from '../components/Scrollable';

registerComponent<GameWindowOptions>('window', (opts) => {
  const win = createWindow(opts);
  return {
    type: 'window',
    stage: win.stage,
    destroy: () => win.destroy(),
    get destroyed() { return win.destroyed; },
  };
});

registerComponent<PixiConfirmOptions>('confirm', (opts) => {
  const conf = createConfirm(opts);
  return {
    type: 'confirm',
    stage: conf.stage,
    destroy: () => conf.destroy(),
    get destroyed() { return conf.destroyed; },
  };
});

registerComponent<ScrollableOptions>('scrollable', (opts) => {
  const sc = createScrollable(opts);
  const origAddChild = sc.content.addChild.bind(sc.content);
  sc.content.addChild = ((...children: Parameters<typeof sc.content.addChild>) => {
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
