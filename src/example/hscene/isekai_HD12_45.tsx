import { VnPlayer } from '../../vn';
import { isekai_HD12_45 } from '../../vn/scenes/isekai_HD12_45';

export default function isekai_HD12_45Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HD12_45} scriptKey="isekai_HD12_45" />
    </div>
  );
}
