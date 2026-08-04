import { VnPlayer } from '../../vn';
import { azusa_HD5_48 } from '../../vn/scenes/azusa_HD5_48';

export default function azusa_HD5_48Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HD5_48} scriptKey="azusa_HD5_48" />
    </div>
  );
}
