import { VnPlayer } from '../../vn';
import { azusa_HE3_55 } from '../../vn/scenes/azusa_HE3_55';

export default function azusa_HE3_55Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HE3_55} scriptKey="azusa_HE3_55" />
    </div>
  );
}
