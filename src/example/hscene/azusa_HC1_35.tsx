import { VnPlayer } from '../../vn';
import { azusa_HC1_35 } from '../../vn/scenes/azusa_HC1_35';

export default function azusa_HC1_35Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HC1_35} scriptKey="azusa_HC1_35" />
    </div>
  );
}
