import { VnPlayer } from '../../vn';
import { azusa_HA3_23 } from '../../vn/scenes/azusa_HA3_23';

export default function azusa_HA3_23Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HA3_23} />
    </div>
  );
}
