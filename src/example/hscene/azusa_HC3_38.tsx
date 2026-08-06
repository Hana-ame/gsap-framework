import { VnPlayer } from '../../vn';
import { azusa_HC3_38 } from '../../vn/scenes/azusa/azusa_HC3_38';

export default function azusa_HC3_38Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HC3_38} scriptKey="azusa_HC3_38" />
    </div>
  );
}
