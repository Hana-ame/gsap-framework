import { VnPlayer } from '../../vn';
import { iru_HA2_26 } from '../../vn/scenes/iru/iru_HA2_26';

export default function iru_HA2_26Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HA2_26} scriptKey="iru_HA2_26" />
    </div>
  );
}
