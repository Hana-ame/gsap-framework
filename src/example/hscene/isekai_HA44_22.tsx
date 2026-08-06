import { VnPlayer } from '../../vn';
import { isekai_HA44_22 } from '../../vn/scenes/isekai/isekai_HA44_22';

export default function isekai_HA44_22Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HA44_22} scriptKey="isekai_HA44_22" />
    </div>
  );
}
