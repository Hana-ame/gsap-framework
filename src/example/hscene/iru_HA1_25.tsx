import { VnPlayer } from '../../vn';
import { iru_HA1_25 } from '../../vn/scenes/iru_HA1_25';

export default function iru_HA1_25Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HA1_25} />
    </div>
  );
}
