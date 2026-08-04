import { VnPlayer } from '../../vn';
import { azusa_HA4_24 } from '../../vn/scenes/azusa_HA4_24';

export default function azusa_HA4_24Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HA4_24} scriptKey="azusa_HA4_24" />
    </div>
  );
}
