import { VnPlayer } from '../../vn';
import { isekai_HB32_29 } from '../../vn/scenes/isekai/isekai_HB32_29';

export default function isekai_HB32_29Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HB32_29} scriptKey="isekai_HB32_29" />
    </div>
  );
}
