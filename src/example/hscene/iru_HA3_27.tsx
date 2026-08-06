import { VnPlayer } from '../../vn';
import { iru_HA3_27 } from '../../vn/scenes/iru/iru_HA3_27';

export default function iru_HA3_27Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HA3_27} scriptKey="iru_HA3_27" />
    </div>
  );
}
