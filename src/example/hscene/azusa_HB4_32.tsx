import { VnPlayer } from '../../vn';
import { azusa_HB4_32 } from '../../vn/scenes/azusa_HB4_32';

export default function azusa_HB4_32Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HB4_32} />
    </div>
  );
}
