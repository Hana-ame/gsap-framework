import { VnPlayer } from '../../vn';
import { iru_HD2_56 } from '../../vn/scenes/iru_HD2_56';

export default function iru_HD2_56Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HD2_56} />
    </div>
  );
}
