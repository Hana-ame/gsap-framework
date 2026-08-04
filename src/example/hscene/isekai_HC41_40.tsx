import { VnPlayer } from '../../vn';
import { isekai_HC41_40 } from '../../vn/scenes/isekai_HC41_40';

export default function isekai_HC41_40Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HC41_40} scriptKey="isekai_HC41_40" />
    </div>
  );
}
