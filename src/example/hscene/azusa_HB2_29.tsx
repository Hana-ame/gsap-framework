import { VnPlayer } from '../../vn';
import { azusa_HB2_29 } from '../../vn/scenes/azusa/azusa_HB2_29';

export default function azusa_HB2_29Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HB2_29} scriptKey="azusa_HB2_29" />
    </div>
  );
}
