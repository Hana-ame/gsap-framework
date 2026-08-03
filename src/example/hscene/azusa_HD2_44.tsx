import { VnPlayer } from '../../vn';
import { azusa_HD2_44 } from '../../vn/scenes/azusa_HD2_44';

export default function azusa_HD2_44Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HD2_44} />
    </div>
  );
}
