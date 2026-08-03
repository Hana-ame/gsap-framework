import { VnPlayer } from '../../vn';
import { azusa_HH5_74 } from '../../vn/scenes/azusa_HH5_74';

export default function azusa_HH5_74Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HH5_74} />
    </div>
  );
}
