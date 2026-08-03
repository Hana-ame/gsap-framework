import { VnPlayer } from '../../vn';
import { isekai_HA43_21 } from '../../vn/scenes/isekai_HA43_21';

export default function isekai_HA43_21Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HA43_21} />
    </div>
  );
}
