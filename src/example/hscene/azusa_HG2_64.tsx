import { VnPlayer } from '../../vn';
import { azusa_HG2_64 } from '../../vn/scenes/azusa/azusa_HG2_64';

export default function azusa_HG2_64Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HG2_64} scriptKey="azusa_HG2_64" />
    </div>
  );
}
