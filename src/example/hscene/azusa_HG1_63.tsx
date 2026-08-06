import { VnPlayer } from '../../vn';
import { azusa_HG1_63 } from '../../vn/scenes/azusa/azusa_HG1_63';

export default function azusa_HG1_63Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HG1_63} scriptKey="azusa_HG1_63" />
    </div>
  );
}
