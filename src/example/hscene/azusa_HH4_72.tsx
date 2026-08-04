import { VnPlayer } from '../../vn';
import { azusa_HH4_72 } from '../../vn/scenes/azusa_HH4_72';

export default function azusa_HH4_72Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HH4_72} scriptKey="azusa_HH4_72" />
    </div>
  );
}
