import { VnPlayer } from '../../vn';
import { isekai_HA21_14 } from '../../vn/scenes/isekai_HA21_14';

export default function isekai_HA21_14Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HA21_14} scriptKey="isekai_HA21_14" />
    </div>
  );
}
