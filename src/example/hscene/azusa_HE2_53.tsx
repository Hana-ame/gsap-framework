import { VnPlayer } from '../../vn';
import { azusa_HE2_53 } from '../../vn/scenes/azusa_HE2_53';

export default function azusa_HE2_53Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HE2_53} scriptKey="azusa_HE2_53" />
    </div>
  );
}
