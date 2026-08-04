import { VnPlayer } from '../../vn';
import { isekai_HB31_28 } from '../../vn/scenes/isekai_HB31_28';

export default function isekai_HB31_28Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HB31_28} scriptKey="isekai_HB31_28" />
    </div>
  );
}
