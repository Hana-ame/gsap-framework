import { VnPlayer } from '../../vn';
import { azusa_HA2_22 } from '../../vn/scenes/azusa_HA2_22';

export default function azusa_HA2_22Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HA2_22} scriptKey="azusa_HA2_22" />
    </div>
  );
}
