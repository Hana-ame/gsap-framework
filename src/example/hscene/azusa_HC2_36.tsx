import { VnPlayer } from '../../vn';
import { azusa_HC2_36 } from '../../vn/scenes/azusa/azusa_HC2_36';

export default function azusa_HC2_36Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HC2_36} scriptKey="azusa_HC2_36" />
    </div>
  );
}
