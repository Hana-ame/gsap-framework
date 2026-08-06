import { VnPlayer } from '../../vn';
import { iru_HB_33 } from '../../vn/scenes/iru/iru_HB_33';

export default function iru_HB_33Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HB_33} scriptKey="iru_HB_33" />
    </div>
  );
}
