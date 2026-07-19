/* ===================================================
 * 组件注册中心
 *
 * 将 PixiWindow、PixiConfirm、Scrollable 注册到组件工厂，
 * 使用者通过 createComponent('name') 创建，无需手动 import。
 * 注册和创建分离：组件库可以按需打包，工厂做统一生命周期管理。
 * =================================================== */

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

/*
 * Scrollable 比较特殊：它暴露 content（容器）给用户填内容，
 * 但组件的 stage 需要用这个 content（而不是 scrollable 实例本身）。
 * 另外 override addChild 是为了让外部往 content 里加东西后自动 recalc
 * （重新计算内容区域大小，保证滚动正确）。
 */
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
