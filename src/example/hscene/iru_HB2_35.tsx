import { VnPlayer } from '../../vn';
import { iru_HB2_35 } from '../../vn/scenes/iru/iru_HB2_35';

export default function iru_HB2_35Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HB2_35} scriptKey="iru_HB2_35" />
    </div>
  );
}
