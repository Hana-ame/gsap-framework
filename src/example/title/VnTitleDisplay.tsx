import { VnPlayer } from '../../vn';
import type { VnScript } from '../../vn';

// 标题界面 = 一个 layout:'title' 的 menu scenario（数据驱动，见 docs/goals.md §4）。
// 背景/转场用 bg/fadeMs 表达；条目 id 复用 jump 语义（#hash 路由 / 场景名）。
const titleScript: VnScript = {
  meta: {
    title: 'Hana Story',
    typeSpeed: 0,
    ui: {
      dialog: {
        left: '4%',
        right: '4%',
        bottom: 24,
        bg: 'rgba(10,10,30,0.85)',
        color: '#fff',
        textSize: 22,
      },
      title: 'Hana Story',
    },
  },
  lines: [
    {
      type: 'bg',
      key: 'https://ex.moonchan.xyz/s/44b1bd5866/3191868-4?redirect_to=image',
      fadeMs: 600,
    },
    { type: 'wait', effect: 'flash' },
    {
      type: 'menu',
      layout: 'title',
      items: [
        { id: '#vn-menu', title: '开始游戏' },
        { id: 'settings', title: '设置' },
      ],
    },
    { type: 'label', name: 'settings' },
    { type: 'hook', run: (vn) => vn.openSettings() },
    { type: 'wait' },
    { type: 'menu', layout: 'title', items: [{ id: '#vn-menu', title: '开始游戏' }, { id: 'settings', title: '设置' }] },
    { type: 'end' },
  ],
};

export function VnTitleDisplay() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={titleScript} scriptKey="title" />
    </div>
  );
}

export default VnTitleDisplay;