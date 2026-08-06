import { VnPlayer } from '../../vn';
import { azusa_HH2_70 } from '../../vn/scenes/azusa/azusa_HH2_70';

export default function azusa_HH2_70Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HH2_70} scriptKey="azusa_HH2_70" />
    </div>
  );
}
