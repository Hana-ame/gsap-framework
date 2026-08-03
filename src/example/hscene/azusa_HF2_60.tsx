import { VnPlayer } from '../../vn';
import { azusa_HF2_60 } from '../../vn/scenes/azusa_HF2_60';

export default function azusa_HF2_60Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HF2_60} />
    </div>
  );
}
