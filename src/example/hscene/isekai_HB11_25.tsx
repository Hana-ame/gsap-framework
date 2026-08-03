import { VnPlayer } from '../../vn';
import { isekai_HB11_25 } from '../../vn/scenes/isekai_HB11_25';

export default function isekai_HB11_25Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HB11_25} />
    </div>
  );
}
