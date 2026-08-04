import { VnPlayer } from '../../vn';
import type { VnMenu, VnScript } from '../../vn';
import { SCENE_GROUPS } from '../vn-menu/scene-groups';
import { SCENE_COVERS } from '../vn-menu/scene-covers';

// HS 回想菜单 = 一个 layout:'grid' 的 menu scenario（数据驱动，见 docs/goals.md §4）。
// 分组/封面/解锁全部由菜单条目数据表达，不再用硬编码 React 组件。
const gridMenu: VnMenu = {
  type: 'menu',
  layout: 'grid',
  items: SCENE_GROUPS.flatMap((g) =>
    g.scenes.map((s) => ({
      id: `#hscene-${s}`,
      title: SCENE_COVERS[s]?.title ?? s,
      cover: SCENE_COVERS[s]?.cover,
      group: g.title,
    })),
  ),
};

const menuScript: VnScript = {
  meta: {
    title: 'H-Scene 回想',
    typeSpeed: 0,
    ui: {
      title: 'H-Scene 回想',
    },
  },
  lines: [gridMenu, { type: 'end', goto: '#vn-title' }],
};

export function VnMenuDisplay() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={menuScript} scriptKey="menu" />
    </div>
  );
}

VnMenuDisplay.head = {
  title: 'H-Scene 回想',
  description: '三游戏 77 场景 · ex.moonchan.xyz · 数据驱动 menu',
};

export default VnMenuDisplay;