import { VnPlayer } from '../../vn';
import { azusa_HD1_42 } from '../../vn/scenes/azusa_HD1_42';

export default function azusa_HD1_42Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HD1_42} scriptKey="azusa_HD1_42" />
    </div>
  );
}
