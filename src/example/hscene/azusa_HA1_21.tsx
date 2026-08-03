import { VnPlayer } from '../../vn';
import { azusa_HA1_21 } from '../../vn/scenes/azusa_HA1_21';

export default function azusa_HA1_21Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HA1_21} />
    </div>
  );
}
