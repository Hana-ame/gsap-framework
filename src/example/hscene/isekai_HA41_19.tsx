import { VnPlayer } from '../../vn';
import { isekai_HA41_19 } from '../../vn/scenes/isekai_HA41_19';

export default function isekai_HA41_19Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HA41_19} />
    </div>
  );
}
