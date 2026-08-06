import { VnPlayer } from '../../vn';
import { isekai_HD32_53 } from '../../vn/scenes/isekai/isekai_HD32_53';

export default function isekai_HD32_53Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HD32_53} scriptKey="isekai_HD32_53" />
    </div>
  );
}
