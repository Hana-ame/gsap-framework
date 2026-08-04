import { VnPlayer } from '../../vn';
import { azusa_HE1_52 } from '../../vn/scenes/azusa_HE1_52';

export default function azusa_HE1_52Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HE1_52} scriptKey="azusa_HE1_52" />
    </div>
  );
}
