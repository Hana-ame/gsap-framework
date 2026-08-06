import { VnPlayer } from '../../vn';
import { isekai_HB12_26 } from '../../vn/scenes/isekai/isekai_HB12_26';

export default function isekai_HB12_26Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HB12_26} scriptKey="isekai_HB12_26" />
    </div>
  );
}
