import { VnPlayer } from '../../vn';
import { azusa_HB1_27 } from '../../vn/scenes/azusa_HB1_27';

export default function azusa_HB1_27Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HB1_27} scriptKey="azusa_HB1_27" />
    </div>
  );
}
