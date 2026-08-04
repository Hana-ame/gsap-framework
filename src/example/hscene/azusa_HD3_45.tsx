import { VnPlayer } from '../../vn';
import { azusa_HD3_45 } from '../../vn/scenes/azusa_HD3_45';

export default function azusa_HD3_45Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HD3_45} scriptKey="azusa_HD3_45" />
    </div>
  );
}
