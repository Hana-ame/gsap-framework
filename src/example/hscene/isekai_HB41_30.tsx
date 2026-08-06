import { VnPlayer } from '../../vn';
import { isekai_HB41_30 } from '../../vn/scenes/isekai/isekai_HB41_30';

export default function isekai_HB41_30Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HB41_30} scriptKey="isekai_HB41_30" />
    </div>
  );
}
