import { VnPlayer } from '../../vn';
import { isekai_HA11_13 } from '../../vn/scenes/isekai_HA11_13';

export default function isekai_HA11_13Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HA11_13} scriptKey="isekai_HA11_13" />
    </div>
  );
}
