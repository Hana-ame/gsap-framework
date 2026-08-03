import { VnPlayer } from '../../vn';
import { iru_HB1_34 } from '../../vn/scenes/iru_HB1_34';

export default function iru_HB1_34Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HB1_34} />
    </div>
  );
}
