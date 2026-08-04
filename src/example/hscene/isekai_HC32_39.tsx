import { VnPlayer } from '../../vn';
import { isekai_HC32_39 } from '../../vn/scenes/isekai_HC32_39';

export default function isekai_HC32_39Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HC32_39} scriptKey="isekai_HC32_39" />
    </div>
  );
}
