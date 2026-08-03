import { VnPlayer } from '../../vn';
import { azusa_HH3_71 } from '../../vn/scenes/azusa_HH3_71';

export default function azusa_HH3_71Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HH3_71} />
    </div>
  );
}
