import { VnPlayer } from '../../vn';
import type { VnScript } from '../../vn';

// 回想（Recall）= 一个 layout:'list' 的 menu scenario，用 showWhen 结合全局通关变量做解锁。
// 已通关场景（VnPlayer end 时 markSceneSeen 写入 seen_<key>）才显示；未通关条目锁住。
const recallScript: VnScript = {
  meta: {
    title: '回想',
    typeSpeed: 0,
  },
  lines: [
    {
      type: 'menu',
      layout: 'list',
      items: [
        { id: '#hscene-azusa_HA1_21', title: '魔法少女梓 序章', showWhen: "$seen_azusa_HA1_21" },
        { id: '#hscene-iru_HA1_25', title: '伊露 序章', showWhen: "$seen_iru_HA1_25" },
        { id: '#hscene-isekai_HA11_13', title: '异世界 序章', showWhen: "$seen_isekai_HA11_13" },
      ],
    },
    { type: 'end' },
  ],
};

export function VnRecallDisplay() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={recallScript} scriptKey="recall" />
    </div>
  );
}

export default VnRecallDisplay;