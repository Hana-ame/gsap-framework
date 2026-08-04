import { VnPlayer } from '../../vn';
import { isekai_HC12_35 } from '../../vn/scenes/isekai_HC12_35';

export default function isekai_HC12_35Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HC12_35} scriptKey="isekai_HC12_35" />
    </div>
  );
}
