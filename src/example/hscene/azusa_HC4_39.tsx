import { VnPlayer } from '../../vn';
import { azusa_HC4_39 } from '../../vn/scenes/azusa_HC4_39';

export default function azusa_HC4_39Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HC4_39} scriptKey="azusa_HC4_39" />
    </div>
  );
}
