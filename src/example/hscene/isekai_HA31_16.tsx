import { VnPlayer } from '../../vn';
import { isekai_HA31_16 } from '../../vn/scenes/isekai_HA31_16';

export default function isekai_HA31_16Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HA31_16} scriptKey="isekai_HA31_16" />
    </div>
  );
}
