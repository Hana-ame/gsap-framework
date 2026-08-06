import { VnPlayer } from '../../vn';
import { azusa_HB3_30 } from '../../vn/scenes/azusa/azusa_HB3_30';

export default function azusa_HB3_30Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HB3_30} scriptKey="azusa_HB3_30" />
    </div>
  );
}
