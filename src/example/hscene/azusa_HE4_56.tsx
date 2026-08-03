import { VnPlayer } from '../../vn';
import { azusa_HE4_56 } from '../../vn/scenes/azusa_HE4_56';

export default function azusa_HE4_56Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HE4_56} />
    </div>
  );
}
